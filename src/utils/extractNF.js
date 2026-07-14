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

// Redimensiona/comprime imagens grandes (fotos de celular) para nao estourar
// o limite de payload do endpoint (~4.5MB no Vercel). Mantem o texto legivel.
async function comprimirImagem(file, maxDim = 2200, quality = 0.82) {
  if (!file.type.startsWith('image/')) return file

  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })
  const img = await new Promise((resolve, reject) => {
    const im = new Image()
    im.onload = () => resolve(im)
    im.onerror = reject
    im.src = dataUrl
  })

  const escala = Math.min(1, maxDim / Math.max(img.width, img.height))
  // Ja pequena e leve: nao mexe
  if (escala === 1 && file.size < 3.5 * 1024 * 1024) return file

  const w = Math.max(1, Math.round(img.width * escala))
  const h = Math.max(1, Math.round(img.height * escala))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)

  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!blob) return file
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
}

async function chamarAPI(base64, mimeType, prompt, isPDF = false, maxTokens = 2048) {
  const res = await fetch('/api/analisar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64, mimeType, prompt, isPDF, maxTokens }),
  })
  if (!res.ok) {
    if (res.status === 413) {
      throw new Error('Arquivo muito grande. Tente uma foto com menos resolucao ou um PDF mais leve.')
    }
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || err.error || `Erro ${res.status}`)
  }
  const data = await res.json()
  const text = data.content?.[0]?.text
  if (!text) throw new Error('IA nao retornou resposta')
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('IA nao retornou um JSON valido')
  return JSON.parse(match[0])
}

function buildPromptNF(ingredientes) {
  const lista = ingredientes
    .map(i => `  ${i.id}: "${i.nome}" (${i.un}) — R$ ${i.preco.toFixed(2)}`)
    .join('\n')

  return `Voce e especialista em analise de documentos de compra para restaurantes brasileiros.

O documento pode ser uma NOTA FISCAL (com itens discriminados) OU um COMPROVANTE DE PAGAMENTO (PIX, transferencia, boleto), que nao lista produtos.

INGREDIENTES JA CADASTRADOS NO SISTEMA:
${lista}

Analise o documento e extraia os itens comprados.
Para cada item, tente encontrar a melhor correspondencia na lista acima pelo nome.

Retorne APENAS um JSON valido neste formato:
{
  "tipo_doc": "nota" ou "comprovante",
  "fornecedor": "nome do fornecedor/destinatario ou vazio",
  "data": "DD/MM/AAAA ou vazio",
  "itens": [
    {
      "nome_nota": "nome exato como aparece no documento",
      "ing_id": "id do ingrediente correspondente ou null",
      "qtd": 10.5,
      "un": "kg",
      "precoUnit": 5.90,
      "precoTotal": 61.95
    }
  ]
}

Regras:
- Se for NOTA FISCAL: extraia todos os itens. Converta gramas para kg (500g = qtd:0.5, un:"kg") e ml para L. Ignore impostos, descontos e totais gerais.
- Se for COMPROVANTE DE PAGAMENTO (sem itens discriminados): retorne UM UNICO item representando o pagamento inteiro, com nome_nota = descricao/destinatario do pagamento, ing_id: null, qtd: 1, un: "un", precoUnit e precoTotal = valor total pago. O usuario vai detalhar depois o que foi comprado.
- Se nao encontrar correspondencia pelo nome, deixe ing_id como null
- Use ponto decimal nos numeros (sem R$ ou virgulas)`
}

function buildPromptComprovante() {
  return `Voce e especialista em analise de comprovantes de pagamento brasileiros (PIX, boleto, transferencia).

Analise este comprovante e extraia as informacoes do pagamento.

Retorne APENAS um JSON valido neste formato:
{
  "valor": 1500.00,
  "data": "DD/MM/AAAA",
  "descricao": "descricao ou destinatario do pagamento",
  "tipo": "PIX"
}

Regras:
- Use ponto decimal nos valores (sem R$ ou virgulas)
- tipo pode ser: PIX, boleto, transferencia, debito, outros
- Se nao encontrar algum campo, use null
- Extraia o valor principal do pagamento (nao o saldo da conta)`
}

function buildPromptFicha() {
  return `Voce e especialista em fichas tecnicas de restaurantes brasileiros.

Analise esta imagem de ficha tecnica e extraia TODOS os pratos com seus ingredientes.

Retorne APENAS um JSON valido neste formato:
{
  "pratos": [
    {
      "nome": "American Cheddar",
      "categoria": "Hamburgueres",
      "ingredientes": [
        { "nome": "Blend Angus", "qtd": 160, "un": "g" },
        { "nome": "Pao de Hamburguer", "qtd": 1, "un": "un" },
        { "nome": "Queijo Cheddar", "qtd": 40, "un": "g" },
        { "nome": "Maionese da Casa", "qtd": 20, "un": "g" }
      ]
    }
  ]
}

Regras:
- Extraia TODOS os pratos visiveis na imagem, sem excecao
- Unidades: "g" para gramas, "ml" para mililitros, "un" para unidades/fatias/pecas, "L" para litros
- Converta: "160g" = qtd:160, un:"g" | "2 fatias" = qtd:2, un:"un" | "1 colher rasa (20g)" = qtd:20, un:"g"
- "Coroa Pao" + "Base Pao" = 1 ingrediente "Pao de Hamburguer" (qtd:1, un:"un")
- Ignore instrucoes de montagem como "cruzadas sobre a carne", "selado na grelha", "zig zag"
- Nomes simples e padronizados: "Bacon Fatiado", "Queijo Cheddar", "Blend Angus", "Maionese da Casa"
- categoria: infira pelo tipo ("Hamburgueres", "Frangos", "Kids", "Combos", "Acompanhamentos")
- Nao inclua preco (nao esta na ficha)`
}

export async function analisarNF(file, ingredientes) {
  if (isHEIC(file)) file = await converterHEIC(file)
  file = await comprimirImagem(file)
  const isPDF  = file.type === 'application/pdf'
  const base64 = await fileToBase64(file)
  return chamarAPI(base64, isPDF ? 'application/pdf' : file.type, buildPromptNF(ingredientes), isPDF)
}

export async function analisarComprovante(file) {
  if (isHEIC(file)) file = await converterHEIC(file)
  file = await comprimirImagem(file)
  const isPDF  = file.type === 'application/pdf'
  const base64 = await fileToBase64(file)
  return chamarAPI(base64, isPDF ? 'application/pdf' : file.type, buildPromptComprovante(), isPDF)
}

export async function analisarFichaTecnica(file) {
  if (isHEIC(file)) file = await converterHEIC(file)
  file = await comprimirImagem(file)
  const isPDF  = file.type === 'application/pdf'
  const base64 = await fileToBase64(file)
  return chamarAPI(base64, isPDF ? 'application/pdf' : file.type, buildPromptFicha(), isPDF, 4096)
}
