import { analyzeComplexity } from "../../lib/gemini";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const result = await analyzeComplexity(prompt);

    res.json(result);
  } catch (error: any) {
    console.error("Analyze Error:", error);
    res.status(500).json({ error: error.message });
  }
}
