import Stripe from "stripe";
import { buffer } from "micro";
import { db } from "../../lib/firebaseAdmin.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req, res) {
  let event;

  try {
    const sig = req.headers["stripe-signature"];

    const rawBody = await buffer(req); // ✅ FIXED

    event = stripe.webhooks.constructEvent(
      rawBody,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

  } catch (err: any) {
    console.error("❌ Signature error:", err.message);
    return res.status(200).json({ received: true });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      const { userId, type, value, tierId } = pi.metadata || {};

      console.log("🔥 WEBHOOK HIT:", pi.metadata);

      if (!userId) {
        console.error("Missing userId");
        return res.status(200).json({ received: true });
      }

      const userRef = db.collection("users").doc(userId);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        console.error("User not found:", userId);
        return res.status(200).json({ received: true });
      }

      const user = userSnap.data();

      let updates: any = {
        updatedAt: new Date().toISOString(),
      };

      if (type === "credits") {
        updates.credits = (user.credits || 0) + parseInt(value || "0");
      }

      if (type === "tier") {
        updates.tier = tierId || "pro";
        updates.credits = (user.credits || 0) + 20;
      }

      await userRef.update(updates);

      await db.collection("orders").add({
        userId,
        type: type === "credits" ? "Credit Top-up" : "Plan Upgrade",
        status: "Paid",
        amount: pi.amount / 100,
        stripePaymentIntentId: pi.id,
        createdAt: new Date().toISOString(),
      });
    }

    return res.status(200).json({ received: true });

  } catch (err: any) {
    console.error("Webhook crash:", err);
    return res.status(200).json({ received: true });
  }
}
