export default async function handler(req, res) {
  // Marcador de versao/health — permite confirmar qual codigo esta no ar
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, version: 'analisar-v4', ts: Date.now() })
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key nao configurada no servidor' })
  }

  const { base64, mimeType, prompt, isPDF, maxTokens } = req.body
  if (!base64 || !prompt) {
    return res.status(400).json({ error: 'Dados incompletos' })
  }

  const payloadMB = (base64.length * 0.75 / 1_000_000).toFixed(2)
  console.log(`[analisar] recebido ${payloadMB}MB · isPDF=${!!isPDF} · mime=${mimeType}`)

  const bloco = isPDF
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
    : { type: 'image',    source: { type: 'base64', media_type: mimeType || 'image/jpeg', data: base64 } }

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  }
  if (isPDF) headers['anthropic-beta'] = 'pdfs-2024-09-25'

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens || 2048,
        messages: [{ role: 'user', content: [bloco, { type: 'text', text: prompt }] }],
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(response.status).json(data)
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
