export const LLM_MODELS = {
  FAST: "meta/llama-3.1-8b-instruct",       // ~300ms — real-time fraud co-pilot
  POWERFUL: "meta/llama-3.3-70b-instruct",   // ~2s — tie-breaker judge & summaries
}

function parseJsonContent(content) {
  if (!content) return {}
  const cleaned = String(content)
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim()
  return JSON.parse(cleaned)
}

async function _call(messages, modelKey, timeout = 8000) {
  const controller = new AbortController()
  const timerId = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch("/api/nvidia", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LLM_MODELS[modelKey] || LLM_MODELS.FAST,
        messages,
        temperature: 0.2,
        max_tokens: 400,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    })
    clearTimeout(timerId)
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`NVIDIA ${res.status}: ${txt}`)
    }
    const data = await res.json()
    const content = data.choices[0].message?.content || data.choices[0].delta?.content || "{}"
    return parseJsonContent(content)
  } catch (err) {
    clearTimeout(timerId)
    throw err
  }
}

/** Fast 8B model — fraud co-pilot for real-time transaction analysis */
export async function callLlamaFast(messages) {
  return _call(messages, "FAST", 8000)
}

/** Powerful 70B model — tie-breaker judge & detailed summaries */
export async function callLlamaPowerful(messages) {
  return _call(messages, "POWERFUL", 20000)
}

// Legacy export kept for backward compatibility
export async function callNvidiaGLM(messages) {
  return _call(messages, "FAST", 10000)
}
