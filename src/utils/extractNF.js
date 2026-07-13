function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function converterHEIC(file) {
  const heic2any = (await import('heic2any')).default
  const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })
  const resultado = Array.isArray(blob) ? blob[0] : blob
  return new File([resultado], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' })
}

function isHEIC(file) {
  return (
    file.type === 'image/heic' || file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')
  )
}

function buildPrompt(ingredientes) {
  const lista = ingredientes
    .map(i => `  ${i.id}: "${i.nome}" (${i.un}) — R$ ${i.preco.toFixed(2)}`)
    .join('\n')

  return `Você é especialista em análise de notas fiscais para restaurantes brasileiros.

INGREDIENTES JÁ CADASTRADOS NO SISTEMA:
${lista}

Analise esta nota fiscal e extraia todos os itens comprados.
Para cada item, tente encontrar a melhor correspondência na lista acima pelo nome.

Retorne APENAS um JSON válido neste formato:
{
  "fornecedor": "nome do fornecedor ou vazio",
  "data": "DD/MM/AAAA ou vazio",
  "itens": [
    {
      "nome_nota": "nome exato como aparece na nota",
      "ing_id": "id do ingrediente correspondente ou null",
      "qtd": 10.5,
      "un": "kg",
      "precoUnit": 5.90,
      "precoTotal": 61.95
    }
  ]
}

Regras:
- Converta gramas→kg (500g = qtd:0.5, un:"kg") e ml→L
- Ignore impostos, descontos e totais gerais
- Se não encontrar correspondência pelo nome, deixe ing_id como null
- Use ponto decimal nos números (sem R$ ou vírgulas)`
}

// ── Google Gemini (GRATUITO) ──────────────────────────────────────────────────
async function analisarGemini(file, apiKey, ingredientes) {
  // Gemini suporta HEIC nativamente — sem conversão necessária
  const mimeType = isHEIC(file)
    ? 'image/heic'
    : file.type || 'application/octet-stream'

  const base64 = await fileToBase64(file)
  const prompt  = buildPrompt(ingredientes)

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: prompt },
          ],
        }],
        generationConfig: { temperature: 0.1 },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Erro ${res.status} na API Gemini`)
  }

  const data = await res.json()
  const text  = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini não retornou resposta')
  const match = text.match(/\{[\s\S]*\}/)
  return JSON.parse(match ? match[0] : text)
}

// ── Anthropic Claude (Pago) ───────────────────────────────────────────────────
async function analisarAnthropic(file, apiKey, ingredientes) {
  if (isHEIC(file)) file = await converterHEIC(file)

  const isPDF   = file.type === 'application/pdf'
  const base64  = await fileToBase64(file)
  const prompt  = buildPrompt(ingredientes)

  const mediaType  = isPDF ? 'application/pdf' : file.type
  const bloco = isPDF
    ? { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64 } }
    : { type: 'image',    source: { type: 'base64', media_type: mediaType, data: base64 } }

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  }
  if (isPDF) headers['anthropic-beta'] = 'pdfs-2024-09-25'

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: [bloco, { type: 'text', text: prompt }] }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Erro ${res.status} na API Anthropic`)
  }

  const data  = await res.json()
  const text  = data.content[0].text
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Claude não retornou um JSON válido')
  return JSON.parse(match[0])
}

// ── Exportação principal ──────────────────────────────────────────────────────
export async function analisarNF(file, apiKey, apiProvider, ingredientes) {
  if (apiProvider === 'gemini') {
    return analisarGemini(file, apiKey, ingredientes)
  }
  return analisarAnthropic(file, apiKey, ingredientes)
}
