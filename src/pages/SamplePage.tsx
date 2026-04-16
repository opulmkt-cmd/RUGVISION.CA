import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, ArrowRight, Package, Truck, ShieldCheck, ChevronLeft, Mail, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../lib/storage';
import { RugConfig } from '../types';
import { useFirebase } from '../components/FirebaseProvider';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { shopifyService } from '../services/shopifyService';
import { imageService } from '../services/imageService';

import { CONSTRUCTIONS } from '../constants';
import { calculateEstimate } from '../lib/pricing';

export const SamplePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useFirebase();
  const [config, setConfig] = useState<RugConfig | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const estimate = config ? calculateEstimate(config) : null;
  const depositAmount = estimate ? Math.round(estimate.recommendedQuote * 0.2) : 500;

  useEffect(() => {
    const loadData = async () => {
      const savedConfig = await storage.getLarge<RugConfig>('rug_current_config');
      const savedImage = await storage.getLarge<string>('rug_selected_image');
      if (savedConfig && savedImage) {
        setConfig(savedConfig);
        setSelectedImage(savedImage);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleRequestSample = async () => {
    if (!config || !selectedImage) return;
    setIsSubmitting(true);
    
    try {
      // 1. Upload image to ImgBB
      let imageUrl = selectedImage;
      if (selectedImage && !selectedImage.startsWith('http')) {
        try {
          imageUrl = await imageService.uploadToImgBB(selectedImage);
        } catch (imgbbError: any) {
          console.error('ImgBB upload failed for sample:', imgbbError);
          throw new Error(`Failed to store image: ${imgbbError.message || 'Please check your ImgBB API key.'}`);
        }
      }

      // 2. Try Shopify Checkout for Sample
      const constructionName = CONSTRUCTIONS.find(c => c.id === config.construction)?.name.split(' — ')[0] || config.construction;
      const dynamicTitle = `${config.prompt} ${constructionName} Rug Sample`.toLowerCase();

      const checkoutUrl = await shopifyService.createDynamicCheckout({
        title: dynamicTitle,
        price: 50, // Fixed price for samples
        imageUrl: imageUrl || '',
        email: user?.email || '',
        attributes: shopifyService.formatRugAttributes(config, imageUrl),
        type: 'sample',
      });

      if (checkoutUrl) {
        // Log to Firestore
        if (user) {
          await addDoc(collection(db, 'sample_requests'), {
            userId: user.uid,
            userEmail: user.email,
            imageUrl,
            config,
            status: 'Redirected to Shopify',
            createdAt: serverTimestamp()
          });
        }
        window.open(checkoutUrl, '_blank');
        return;
      }

      // 3. Fallback to mailto if Shopify not configured
      if (user) {
        await addDoc(collection(db, 'sample_requests'), {
          userId: user.uid,
          userEmail: user.email,
          imageUrl,
          config,
          status: 'Pending (Email Sent)',
          createdAt: serverTimestamp()
        });
      }

      // Construct mailto link
      const subject = encodeURIComponent(`Sample Request: ${config.prompt || 'Custom Rug'}`);
      const body = encodeURIComponent(`
Hi RugVision™ Team,

I would like to request a sample for my custom rug design.

Design Details:
- Prompt: ${config.prompt}
- Dimensions: ${config.width}' x ${config.length}'
- Construction: ${config.construction}
- Pile Type: ${config.pileType}
- Pile Height: ${config.pileHeight}
- Materials: ${config.materialTypes.join(', ')}
- Finishes: ${config.surfaceFinishes.join(', ')}

Image URL: ${selectedImage}

User Email: ${user?.email || 'Guest'}
      `);
      
      window.open(`mailto:jenna@opulmkt.com?subject=${subject}&body=${body}`, '_blank');
      
      alert('Sample request recorded! Your email client should open now to send the final request.');
    } catch (error: any) {
      console.error('Sample Request Error:', error);
      const errorMessage = error.message || 'An unexpected error occurred.';
      
      if (errorMessage.includes('Unexpected token') || errorMessage.includes('HTML')) {
        alert('Server Error: The backend is currently unavailable or restarting. Please try again in a few seconds.');
      } else {
        handleFirestoreError(error, OperationType.CREATE, 'sample_requests');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const SAMPLE_GALLERY = [
    { 
      title: "Hand-Tufted Wool", 
      desc: "Premium NZ Wool with a plush 12mm pile. Perfect for living rooms.",
      image: "https://picsum.photos/seed/rug-sample-1/800/800"
    },
    { 
      title: "Hand-Knotted Silk", 
      desc: "100 Knots construction with botanical silk accents. High-sheen luxury.",
      image: "https://picsum.photos/seed/rug-sample-2/800/800"
    },
    { 
      title: "Textured Shag", 
      desc: "High-low pile height variation with tip-shear finish.",
      image: "https://picsum.photos/seed/rug-sample-3/800/800"
    },
    { 
      title: "Flatweave Kilim", 
      desc: "Durable, reversible construction for high-traffic areas.",
      image: "https://picsum.photos/seed/rug-sample-4/800/800"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#EFBB76] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!config || !selectedImage) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto px-6 py-24"
      >
        <header className="text-center mb-20">
          <span className="text-[10px] font-bold text-[#EFBB76] uppercase tracking-[0.3em] block mb-4">Sample Showcase</span>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-black mb-6">Experience the Quality.</h1>
          <p className="text-black/40 text-lg max-w-2xl mx-auto">See how our digital designs translate into physical masterpieces. Request a sample of your custom design to feel the texture before full production.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
          {SAMPLE_GALLERY.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <div className="aspect-square rounded-[3rem] overflow-hidden border border-black/5 mb-8 shadow-xl group-hover:shadow-2xl transition-all duration-500">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
              </div>
              <h3 className="text-2xl font-serif font-bold mb-2">{item.title}</h3>
              <p className="text-black/40 text-sm font-medium leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-black text-white rounded-[4rem] p-16 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-serif font-bold mb-8">Ready to create your own?</h2>
            <button 
              onClick={() => navigate('/design')}
              className="btn-primary px-12 py-5 text-lg"
            >
              Start Designing <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600 via-transparent to-transparent" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto px-6 py-12"
    >
      <header className="mb-16">
        <h1 className="text-5xl font-serif font-bold text-black mb-4">Request a Sample</h1>
        <p className="text-black/40 text-lg max-w-2xl">Review your design details and request a physical sample to feel the quality of our premium fibers.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
        {/* Left: Design Preview */}
        <div className="space-y-8">
          <div className="aspect-square bg-black/5 rounded-3xl overflow-hidden border border-black/10 shadow-2xl">
            <img 
              src={selectedImage} 
              alt="Selected Rug" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <div className="bg-black/5 p-8 rounded-3xl border border-black/10 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest border-b border-black/10 pb-4 mb-4">Design Specifications</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest block">Dimensions</span>
                <p className="text-sm font-bold">{config.width}' x {config.length}'</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest block">Construction</span>
                <p className="text-sm font-bold uppercase">{config.construction.replace('-', ' ')}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest block">Pile Type</span>
                <p className="text-sm font-bold uppercase">{config.pileType}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest block">Pile Height</span>
                <p className="text-sm font-bold">{config.pileHeight}mm</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="space-y-12">
          <div className="space-y-6">
            <div className="bg-blue-600/10 p-8 rounded-[2.5rem] border border-blue-600/20">
              <h3 className="text-xl font-serif font-bold mb-4">Sample Order Details</h3>
              <p className="text-sm text-black/60 mb-8 leading-relaxed">
                We'll send you a 1ft x 1ft sample of your exact design configuration. The cost of the sample is credited back to your final order.
              </p>
              <div className="space-y-4">
                <button 
                  onClick={handleRequestSample}
                  disabled={isSubmitting}
                  className="w-full py-5 bg-blue-600 text-white font-black text-lg rounded-full hover:bg-blue-700 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : <><Mail className="w-5 h-5" /> Request for Sample</>}
                </button>
                <button 
                  onClick={() => navigate('/checkout', { state: { type: 'deposit', amount: depositAmount } })}
                  className="w-full py-5 bg-black text-white font-black text-lg rounded-full hover:bg-black/80 transition-all shadow-xl flex items-center justify-center gap-3"
                >
                  <CreditCard className="w-5 h-5" /> Pay Deposit for Full Rug
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="flex gap-4 p-6 bg-black/5 rounded-2xl border border-black/10">
                <Package className="w-6 h-6 text-blue-600 shrink-0" />
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1">Premium Packaging</h4>
                  <p className="text-[10px] text-black/40 leading-relaxed">Carefully packed to preserve texture and color accuracy.</p>
                </div>
              </div>
              <div className="flex gap-4 p-6 bg-black/5 rounded-2xl border border-black/10">
                <Truck className="w-6 h-6 text-blue-600 shrink-0" />
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1">Global Shipping</h4>
                  <p className="text-[10px] text-black/40 leading-relaxed">Worldwide delivery within 3-5 business days.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
