export default async function handler(req, res) {
  const { image } = req.body;

  try {
    const formData = new URLSearchParams();
    formData.append("image", image.split(",")[1]);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();
    res.json({ url: result.data.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
