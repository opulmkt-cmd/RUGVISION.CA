export default async function handler(req, res) {
  const { title, price, imageUrl, attributes, type } = req.body;

  const payload = {
    product: {
      title,
      status: "active",
      variants: [{ price }],
      images: imageUrl ? [{ src: imageUrl }] : [],
    },
  };

  try {
    const response = await fetch(
      `https://${process.env.VITE_SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/products.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token":
            process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    const variantId = `gid://shopify/ProductVariant/${result.product.variants[0].id}`;

    res.json({ variantId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
