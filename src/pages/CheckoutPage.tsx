import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight, ShoppingBag, ShieldCheck, Zap, ChevronLeft, Loader2, CreditCard, Lock, ExternalLink, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { storage } from '../lib/storage';
import { RugConfig } from '../types';
import { useFirebase } from '../components/FirebaseProvider';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { PRICING_TIERS } from '../constants';
import { shopifyService } from '../services/shopifyService';
import { imageService } from '../services/imageService';
import { stripeService } from '../services/stripeService';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripePaymentForm } from '../components/StripePaymentForm';

import { CONSTRUCTIONS } from '../constants';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useFirebase();
  const [submitted, setSubmitted] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    setIsInIframe(window.self !== window.top);
  }, []);
  const [config, setConfig] = useState<RugConfig | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  // Payment Form State
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [email, setEmail] = useState(user?.email || '');

  const isDeposit = location.state?.type === 'deposit';
  const isCredits = location.state?.type === 'credits';
  const depositAmount = location.state?.amount || 500;
  const creditAmount = location.state?.amount || 5;
  const creditCount = location.state?.credits || 5;
  const targetTierId = location.state?.tier;
  const targetTier = PRICING_TIERS.find(t => t.id === targetTierId);

  useEffect(() => {
    const loadData = async () => {
      const savedConfig = await storage.getLarge<RugConfig>('rug_current_config');
      const savedImage = await storage.getLarge<string>('rug_selected_image');
      if (savedConfig && savedImage) {
        setConfig(savedConfig);
        setSelectedImage(savedImage);
      }
    };
    loadData();
  }, []);

  // Initialize Stripe Payment Intent for Credits or Tier
  useEffect(() => {
    if (user && (isCredits || targetTier)) {
      const amount = targetTier ? targetTier.price : creditAmount;
      
      if (!amount || amount <= 0) {
        console.warn('[CheckoutPage] Invalid amount for payment intent:', amount);
        return;
      }

      const metadata = isCredits 
        ? { userId: user.uid, type: 'credits', value: creditCount.toString() }
        : { userId: user.uid, type: 'tier', tierId: targetTier?.id, value: targetTier?.credits.toString() };

      console.log('[CheckoutPage] Requesting payment intent for amount:', amount);
      stripeService.createPaymentIntent(amount, metadata)
        .then(res => {
          console.log('[CheckoutPage] Received client secret');
          setClientSecret(res.clientSecret);
        })
        .catch(err => {
          console.error('[CheckoutPage] Payment intent error:', err);
          setError(err.message);
        });
    }
  }, [user, isCredits, targetTier, creditAmount, creditCount]);

  const handlePayment = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    if (!user) {
      setError('Please sign in to complete your purchase.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    try {
      // 1. If it's a deposit or rug order, use Shopify
      if (isDeposit || isCredits || (!targetTier && config)) {
        let imageUrl = selectedImage;
        if (selectedImage && !selectedImage.startsWith('http')) {
          try {
            // Use ImgBB exclusively for image storage
            imageUrl = await imageService.uploadToImgBB(selectedImage);
          } catch (imgbbError: any) {
            console.error('ImgBB upload failed:', imgbbError);
            // Don't fail for credits or simple orders if image fails
            if (!isCredits) {
              throw new Error(`Failed to store image: ${imgbbError.message || 'Please check your ImgBB API key.'}`);
            }
          }
        }

        const constructionName = config ? (CONSTRUCTIONS.find(c => c.id === config.construction)?.name.split(' — ')[0] || config.construction) : '';
        const dynamicTitle = isCredits ? `${creditCount} Design Credits` : `${config?.prompt || 'Custom'} ${constructionName} Rug${!isDeposit ? ' Sample' : ''}`.toLowerCase();

        const checkoutUrl = await shopifyService.createDynamicCheckout({
          title: dynamicTitle,
          price: isCredits ? creditAmount : (isDeposit ? depositAmount : (location.state?.amount || 50)),
          imageUrl: isCredits ? 'https://cdn.shopify.com/s/files/1/0718/2712/8409/files/credits_icon.png?v=1712568000' : (imageUrl || ''),
          email: user.email || '',
          attributes: isCredits 
            ? [{ key: 'credits', value: creditCount.toString() }, { key: 'userId', value: user.uid }] 
            : shopifyService.formatRugAttributes(config!, imageUrl || ''),
          type: isCredits ? 'credits' : (isDeposit ? 'deposit' : 'sample'),
        });

        if (checkoutUrl) {
          // Log the order attempt in Firestore before redirect
          const orderData = {
            userId: user.uid,
            type: isCredits ? 'Credit Top-up' : (isDeposit ? 'Deposit' : 'Rug Order'),
            status: 'Redirected to Shopify',
            amount: isCredits ? creditAmount : (isDeposit ? depositAmount : 0),
            currency: 'USD',
            paymentMethod: 'Shopify',
            config: config || null,
            imageUrl: imageUrl || null,
            createdAt: serverTimestamp(),
          };
          await addDoc(collection(db, 'orders'), orderData);
          
          window.open(checkoutUrl, '_blank');
          return;
        } else {
          throw new Error('Failed to create Shopify checkout. Please check your Storefront Access Token and Domain.');
        }
      }

      // 2. Handle Plan Upgrade via Shopify
      if (targetTier) {
        if (shopifyService.isConfigured) {
          const { invoiceUrl, draftOrderId } = await shopifyService.createPlanUpgradeCheckout(email || user.email || '', user.uid);
          
          // Store the draft order ID in Firestore to verify later
          await updateDoc(doc(db, 'users', user.uid), {
            pendingUpgradeId: draftOrderId.toString(),
            pendingTierId: targetTier.id
          });

          // Open in same tab so "Return to Store" works correctly
          window.location.href = invoiceUrl;
          return;
        }
      }

      // 3. Simulate Payment Processing for internal tiers (Fallback or if not Shopify)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 2. Create Order in Firestore
      let imageUrl = selectedImage;
      if (selectedImage && !selectedImage.startsWith('http')) {
        try {
          imageUrl = await imageService.uploadToImgBB(selectedImage);
        } catch (imgbbError: any) {
          console.error('ImgBB upload failed for internal order:', imgbbError);
        }
      }

      const orderData = {
        userId: user.uid,
        type: targetTier ? 'Plan Upgrade' : (isCredits ? 'Credit Top-up' : (isDeposit ? 'Deposit' : 'Rug Order')),
        status: 'Paid',
        amount: targetTier ? targetTier.price : (isCredits ? creditAmount : (isDeposit ? depositAmount : 0)),
        currency: 'USD',
        paymentMethod: 'Credit Card (Mock)',
        config: config || null,
        imageUrl: imageUrl || null,
        createdAt: serverTimestamp(),
      };

      const path = 'orders';
      try {
        await addDoc(collection(db, path), orderData);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }

      // 3. Update User Profile if it's a tier upgrade or credits
      if (targetTier || isCredits) {
        const userPath = `users/${user.uid}`;
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            tier: targetTier ? targetTier.id : (profile?.tier || 'free'),
            credits: (profile?.credits || 0) + (targetTier ? targetTier.credits : creditCount),
            updatedAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, userPath);
        }
      }

      setSubmitted(true);
      
      // Cleanup storage after successful order
      if (!targetTier && !isCredits) {
        await storage.remove('rug_current_config');
        await storage.remove('rug_selected_image');
      }

    } catch (err: any) {
      console.error('Payment Error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <div className="max-w-md">
          <h1 className="text-4xl font-serif font-bold mb-4">Payment Successful!</h1>
          <p className="text-black/40 text-lg leading-relaxed">
            Thank you for your purchase. Your order has been confirmed and is being processed.
            {targetTier ? ` Your account has been upgraded to the ${targetTier.name} plan.` : (isCredits ? ` ${creditCount} credits have been added to your account.` : ' Our team will contact you shortly regarding your custom rug.')}
          </p>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-12 py-4 bg-black text-white rounded-full font-bold hover:bg-black/80 transition-all flex items-center gap-2"
        >
          Go to Dashboard <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-6 py-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Order Summary */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-black/5 p-8 rounded-[2.5rem] border border-black/10">
            <h2 className="text-xl font-serif font-bold mb-6">Order Summary</h2>
            {targetTier ? (
              <div className="space-y-6">
                <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-10 h-10 text-blue-600" />
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-serif font-bold text-black">{targetTier.name} Plan</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Subscription Upgrade</p>
                </div>
              </div>
            ) : isCredits ? (
              <div className="space-y-6">
                <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-10 h-10 text-blue-600" />
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-serif font-bold text-black">{creditCount} Credits</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Credit Top-up</p>
                </div>
              </div>
            ) : selectedImage && (
              <div className="aspect-square rounded-2xl overflow-hidden mb-6 border border-black/10">
                <img src={selectedImage} alt="Rug Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}
            <div className="space-y-4 border-t border-black/10 pt-6">
              <div className="flex justify-between text-xs">
                <span className="text-black/40 uppercase font-bold tracking-widest">Item</span>
                <span className="font-bold">{targetTier ? `${targetTier.name} Subscription` : (isCredits ? `${creditCount} Credits` : 'Custom Designer Rug')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-black/40 uppercase font-bold tracking-widest">Type</span>
                <span className="font-bold">{targetTier ? 'Plan Upgrade' : (isCredits ? 'Credit Top-up' : (isDeposit ? 'Deposit Payment' : 'Full Payment'))}</span>
              </div>
              <div className="flex justify-between text-xl font-serif font-bold pt-4 border-t border-black/10">
                <span>Total Due</span>
                <span className="text-blue-600">${targetTier ? targetTier.price : (isCredits ? creditAmount : (isDeposit ? depositAmount.toLocaleString() : 'TBD'))}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 p-6 bg-blue-600/5 rounded-2xl border border-blue-600/20">
            <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
            <p className="text-[10px] text-black/60 leading-relaxed font-bold uppercase tracking-wider">
              Secure checkout. Your payment information is encrypted and processed securely.
            </p>
          </div>
        </div>

        {/* Right: Payment Form */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-black/10 shadow-2xl">
          {/* Stripe Configuration */}
          <div className="p-6 bg-[#F0F7FF] border border-blue-200 rounded-2xl mb-8">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm font-bold text-blue-600 uppercase tracking-widest">Stripe Configuration</h4>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Publishable Key</label>
                <input 
                  type="text" 
                  placeholder="pk_test_************************" 
                  className="w-full p-3 bg-white rounded-xl border border-blue-100 text-xs font-mono outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Secret Key</label>
                <input 
                  type="password" 
                  placeholder="sk_test_************************" 
                  className="w-full p-3 bg-white rounded-xl border border-blue-100 text-xs font-mono outline-none focus:border-blue-400"
                />
              </div>
            </div>
          </div>

          {isInIframe && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-[#F0F7FF] border border-blue-200 rounded-2xl flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shrink-0 shadow-lg">
                  <ExternalLink className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-600">Secure Payment Environment</h4>
                  <p className="text-[10px] text-blue-600 font-medium uppercase tracking-wider">
                    For the best experience, please complete your payment in a new tab.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => window.open(window.location.href, '_blank')}
                className="px-6 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-blue-500 transition-all shadow-md flex items-center gap-2"
              >
                Open in New Tab <ArrowRight className="w-3 h-3" />
              </button>
            </motion.div>
          )}

          {isCredits || targetTier ? (
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-8">
                <CreditCard className="w-8 h-8 text-blue-600" />
                <h2 className="text-3xl font-serif font-bold text-black">Payment Details</h2>
              </div>

              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripePaymentForm 
                    amount={targetTier ? targetTier.price : creditAmount}
                    onSuccess={() => setSubmitted(true)}
                    onError={(msg) => setError(msg)}
                  />
                </Elements>
              ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold uppercase tracking-widest">
                  {error}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-black/40 font-bold uppercase tracking-widest text-[10px]">Initializing Secure Checkout...</p>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black/40">
                <Lock className="w-3 h-3" /> Encrypted & Secure Payment via Stripe
              </div>
            </div>
          ) : shopifyService.isConfigured ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-8 py-12">
              <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center">
                {targetTier ? <Zap className="w-12 h-12 text-blue-600" /> : <ShoppingBag className="w-12 h-12 text-blue-600" />}
              </div>
              <div className="max-w-md">
                <h2 className="text-4xl font-serif font-bold mb-4">Shopify Checkout</h2>
                <p className="text-black/40 text-lg leading-relaxed">
                  We use Shopify to process our payments securely. You'll be redirected to complete your {targetTier ? 'plan upgrade' : (isDeposit ? 'deposit' : 'purchase')}.
                </p>
              </div>
              
              <div className="w-full max-w-md space-y-4">
                <button 
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full py-6 bg-blue-600 text-white font-black text-xl rounded-full hover:bg-blue-700 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Redirecting to Shopify...
                    </>
                  ) : (
                    <>
                      Proceed to Shopify Checkout <ArrowRight className="w-6 h-6" />
                    </>
                  )}
                </button>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/20 flex items-center justify-center gap-2">
                  <Lock className="w-3 h-3" /> Secure External Checkout
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-8">
                <CreditCard className="w-8 h-8 text-blue-600" />
                <h2 className="text-3xl font-serif font-bold text-black">Payment Details</h2>
              </div>

              <form onSubmit={handlePayment} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-4 rounded-xl border border-black/10 focus:border-blue-600 outline-none transition-colors"
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Cardholder Name</label>
                <input 
                  type="text" 
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  required
                  className="w-full p-4 rounded-xl border border-black/10 focus:border-blue-600 outline-none transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Card Number</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  required
                  className="w-full p-4 pl-12 rounded-xl border border-black/10 focus:border-blue-600 outline-none transition-colors"
                  placeholder="0000 0000 0000 0000"
                />
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Expiry Date</label>
                <input 
                  type="text" 
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  required
                  className="w-full p-4 rounded-xl border border-black/10 focus:border-blue-600 outline-none transition-colors"
                  placeholder="MM/YY"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">CVC</label>
                <input 
                  type="text" 
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  required
                  className="w-full p-4 rounded-xl border border-black/10 focus:border-blue-600 outline-none transition-colors"
                  placeholder="123"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold uppercase tracking-widest">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isProcessing}
              className="w-full py-6 bg-blue-600 text-white font-black text-xl rounded-full hover:bg-blue-700 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  Pay ${targetTier ? targetTier.price : (isDeposit ? depositAmount.toLocaleString() : '0')} <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black/40">
              <Lock className="w-3 h-3" /> Encrypted & Secure Payment
            </div>
          </form>

          <div className="mt-12 flex items-center gap-6 opacity-20 filter grayscale justify-center">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-6" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-8" />
          </div>
          </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
