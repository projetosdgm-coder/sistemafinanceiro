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

// Renderiza a imagem num JPEG com o lado maior limitado a `dim` e qualidade `q`.
function renderJpeg(img, dim, q) {
  const escala = Math.min(1, dim / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * escala))
  const h = Math.max(1, Math.round(img.height * escala))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'          // fundo branco (PNGs com transparencia)
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', q))
}

// Comprime imagens grandes ate caberem no limite de payload do endpoint
// (~4.5MB no Vercel; base64 infla ~33%, entao miramos <= 2.8MB de arquivo).
// Reduz qualidade primeiro e, se preciso, encolhe a dimensao — em loop.
// maxDim 1568 = lado maior que a IA usa internamente; acima disso ela reduz
// de qualquer forma, entao nao ha perda de legibilidade e o payload fica menor.
async function comprimirImagem(file, { maxDim = 1568, maxBytes = 2_800_000 } = {}) {
  if (!file.type.startsWith('image/')) return file
  // Arquivo pequeno e ja dentro da dimensao alvo: nao mexe
  if (file.size <= 800_000) return file

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

  let dim = Math.min(maxDim, Math.max(img.width, img.height))
  let q = 0.82
  let blob = await renderJpeg(img, dim, q)

  // Enquanto ultrapassar o alvo, baixa qualidade; esgotada, encolhe a dimensao
  let guarda = 0
  while (blob && blob.size > maxBytes && guarda < 12) {
    guarda++
    if (q > 0.5) q = +(q - 0.12).toFixed(2)
    else { dim = Math.round(dim * 0.82); q = 0.7 }
    if (dim < 800) break
    blob = await renderJpeg(img, dim, q)
  }

  if (!blob) return file
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
}

// Limite de payload do endpoint no Vercel e ~4.5MB. base64 e uma string;
// barramos no cliente com folga (4MB) para dar mensagem clara antes do 413.
const MAX_BASE64_CHARS = 4_000_000

async function chamarAPI(base64, mimeType, prompt, isPDF = false, maxTokens = 2048) {
  if (base64.length > MAX_BASE64_CHARS) {
    const mb = (base64.length * 0.75 / 1_000_000).toFixed(1)
    throw new Error(
      isPDF
        ? `PDF muito grande (~${mb}MB). Exporte em resolucao menor ou envie como imagem (JPG/PNG) — imagens sao otimizadas automaticamente.`
        : `Imagem muito grande (~${mb}MB) mesmo apos otimizacao. Tente uma foto com menos resolucao.`
    )
  }

  const res = await fetch('/api/analisar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64, mimeType, prompt, isPDF, maxTokens }),
  })
  if (!res.ok) {
    if (res.status === 413) {
      throw new Error('Arquivo muito grande para o servidor. Tente uma foto com menos resolucao ou um PDF mais leve.')
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

Analise o documento e extraia os itens comprados. Para cada item:
1) LIMPE O NOME (nome_limpo): expanda abreviacoes e escreva o nome comum do produto, sem marca, codigo ou gramatura. Exemplos:
   - "OLEO SOJA VITAL U900" -> "Oleo de Soja"
   - "LAV LOUCAS ODD 500ML" -> "Lava-loucas"
   - "BISC MAIZ KODILA 112" -> "Biscoito Maizena"
   - "SAB NIVEA 85 AVEIA" -> "Sabonete"
   - "AGUA SANIT YPE 2L" -> "Agua Sanitaria"
2) CLASSIFIQUE O DESTINO (destino):
   - "cmv": insumo usado no preparo dos pratos (alimentos, bebidas, temperos, ingredientes em geral). Vai para o estoque.
   - "despesa": item de consumo da operacao que NAO entra no prato (produtos de limpeza, higiene e descartaveis: sabonete, agua sanitaria, saco de lixo, detergente, papel toalha, luvas, etc.). Vira custo operacional no DRE.
3) Se destino for "despesa", sugira dre_campo: "limpeza" para produtos de limpeza/higiene/descartaveis; caso contrario "outros".
4) Se destino for "cmv", tente casar com a lista acima (ing_id); senao ing_id: null.

Retorne APENAS um JSON valido neste formato:
{
  "tipo_doc": "nota" ou "comprovante",
  "fornecedor": "nome do fornecedor/destinatario ou vazio",
  "data": "DD/MM/AAAA ou vazio",
  "itens": [
    {
      "nome_nota": "nome exato como aparece no documento",
      "nome_limpo": "Oleo de Soja",
      "destino": "cmv",
      "dre_campo": null,
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
- Se for COMPROVANTE DE PAGAMENTO (sem itens discriminados): retorne UM UNICO item com nome_nota = descricao/destinatario, nome_limpo igual, destino "cmv", ing_id null, qtd 1, un "un", precoUnit e precoTotal = valor total pago. O usuario detalha depois.
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
