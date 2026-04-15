export const stripeService = {
  async createPaymentIntent(amount: number, metadata: any) {
    console.log(`[StripeService] Creating payment intent: ${amount}`, metadata);

    const response = await fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        metadata,
      }),
    });

    console.log(`[StripeService] Response status: ${response.status}`);

    // 🔥 SAFE JSON HANDLING (fixes your crash)
    const text = await response.text();
    let data: any = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error("JSON parse error:", text);
    }

    if (!response.ok) {
      console.error("[StripeService] Error response:", data);
      throw new Error(data.error || "Failed to create payment intent");
    }

    return data;
  },
};
