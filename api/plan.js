export default async function handler(req, res) {
  try {
    const { goal, system } = req.body;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        max_tokens: 1000,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Project goal: ${goal}` }
        ],
      }),
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
