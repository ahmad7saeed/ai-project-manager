export default async function handler(req, res) {
  const { goal } = req.body;
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
        { role: "system", content: req.body.system },
        { role: "user", content: `Project goal: ${goal}` }
      ],
    }),
  });
  const data = await response.json();
  res.status(200).json(data);
}
