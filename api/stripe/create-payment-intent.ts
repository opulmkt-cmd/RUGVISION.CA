import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const { amount, metadata } = req.body;

    if (!amount || !metadata?.userId || !metadata?.type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("🔥 Creating payment for:", metadata);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      metadata: {
        userId: String(metadata.userId),
        type: String(metadata.type),
        value: metadata.value ? String(metadata.value) : "",
        tierId: metadata.tierId ? String(metadata.tierId) : "",
      },
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });

  } catch (err: any) {
    console.error("❌ PaymentIntent error:", err);
    res.status(500).json({ error: err.message });
  }
}
