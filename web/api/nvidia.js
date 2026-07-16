export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Method not allowed" })
  }

  const apiKey = process.env.NVIDIA_API_KEY || process.env.VITE_NVIDIA_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: "NVIDIA API key is not configured" })
  }

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    })

    const text = await response.text()
    res.status(response.status)
    res.setHeader("Content-Type", response.headers.get("content-type") || "application/json")
    return res.send(text)
  } catch (error) {
    return res.status(502).json({
      error: "Unable to reach NVIDIA API",
      detail: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
