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

async function chamarAPI(base64, mimeType, prompt, isPDF = false) {
  const res = await fetch('/api/analisar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64, mimeType, prompt, isPDF }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || err.error || `Erro ${res.status}`)
  }
  const data = await res.json()
  const text = data.content?.[0]?.text
  if (!text) throw new Error('IA não retornou resposta')
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('IA não retornou um JSON válido')
  return JSON.parse(match[0])
}

function buildPromptNF(ingredientes) {
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

function buildPromptComprovante() {
  return `Você é especialista em análise de comprovantes de pagamento brasileiros (PIX, boleto, transferência).

Analise este comprovante e extraia as informações do pagamento.

Retorne APENAS um JSON válido neste formato:
{
  "valor": 1500.00,
  "data": "DD/MM/AAAA",
  "descricao": "descrição ou destinatário do pagamento",
  "tipo": "PIX"
}

Regras:
- Use ponto decimal nos valores (sem R$ ou vírgulas)
- tipo pode ser: PIX, boleto, transferência, débito, outros
- Se não encontrar algum campo, use null
- Extraia o valor principal do pagamento (não o saldo da conta)`
}

export async function analisarNF(file, ingredientes) {
  if (isHEIC(file)) file = await converterHEIC(file)
  const isPDF  = file.type === 'application/pdf'
  const base64 = await fileToBase64(file)
  return chamarAPI(base64, isPDF ? 'application/pdf' : file.type, buildPromptNF(ingredientes), isPDF)
}

export async function analisarComprovante(file) {
  if (isHEIC(file)) file = await converterHEIC(file)
  const isPDF  = file.type === 'application/pdf'
  const base64 = await fileToBase64(file)
  return chamarAPI(base64, isPDF ? 'application/pdf' : file.type, buildPromptComprovante(), isPDF)
}
