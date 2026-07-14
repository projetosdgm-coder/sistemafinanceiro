// Helpers de desenho para os relatorios PDF (jsPDF).
// Identidade: fundo branco, acento laranja, texto preto/cinza. Sem blocos pretos.
import { fmtR } from './formatters'

export const PALETTE = {
  laranja:    [249, 115, 22],   // #F97316
  preto:      [17, 17, 17],     // #111111
  cinza:      [107, 114, 128],  // #6B7280
  zebra:      [250, 250, 250],  // #FAFAFA
  cinzaClaro: [240, 240, 240],  // subtotais
  borda:      [229, 231, 235],  // #E5E7EB
  verde:      [22, 163, 74],    // #16A34A
  ambar:      [245, 158, 11],   // #F59E0B
  vermelho:   [220, 38, 38],    // #DC2626
  verdeBg:    [232, 245, 233],
  vermelhoBg: [255, 235, 238],
}

export const M = 14                 // margem esquerda/direita
export const RIGHT = 210 - M        // 196
export const PAGE_H = 297

// Remove acentos e espacos para nome de arquivo
export function sanitizeFilename(s) {
  return String(s || 'restaurante')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'restaurante'
}

// Formata dinheiro; negativos entre parenteses
export function money(v) {
  const n = v || 0
  return n < 0 ? `(${fmtR(Math.abs(n))})` : fmtR(n)
}

export function mesAno(date = new Date()) {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

// Cabecalho de identificacao (fundo branco + acento laranja). Retorna o Y util.
export function drawIdentificacao(doc, { restaurante, titulo, periodo, emissao, cnpj, regime, logo }) {
  doc.setTextColor(...PALETTE.preto)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(restaurante || 'Restaurante', M, 19)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  doc.setTextColor(...PALETTE.cinza)
  doc.text(titulo, M, 25.5)

  // Logo CostChef (lockup preto 1024x331) no canto superior direito, proporcao original
  let yInfo = 14
  if (logo) {
    const w = 34, h = w * (331 / 1024)
    doc.addImage(logo, 'PNG', RIGHT - w, 6, w, h)
    yInfo = 22
  }

  doc.setFontSize(8.5)
  doc.text(`Periodo de referencia: ${periodo}`, RIGHT, yInfo, { align: 'right' })
  doc.text(`Emitido em: ${emissao}`, RIGHT, yInfo + 4.5, { align: 'right' })

  const cnpjTxt = cnpj ? `CNPJ: ${cnpj}` : 'CNPJ: ____________________'
  const regTxt = regime ? `Regime Tributario: ${regime}` : 'Regime Tributario: ____________________'
  doc.setFontSize(8.5)
  doc.setTextColor(...PALETTE.cinza)
  doc.text(cnpjTxt, M, 31)
  doc.text(regTxt, M + 70, 31)

  doc.setDrawColor(...PALETTE.laranja)
  doc.setLineWidth(0.8)
  doc.line(M, 34, RIGHT, 34)
  return 41
}

// Titulo de secao: caixa alta + linha laranja fina abaixo. Retorna Y util.
export function drawSectionTitle(doc, texto, y) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...PALETTE.preto)
  doc.text(texto.toUpperCase(), M, y)
  doc.setDrawColor(...PALETTE.laranja)
  doc.setLineWidth(0.5)
  doc.line(M, y + 1.8, RIGHT, y + 1.8)
  return y + 7.5
}

// Cards de KPI desenhados com retangulo de borda fina. Retorna Y util.
export function drawKpiCards(doc, cards, startY) {
  const gap = 4, cols = 3
  const W = (RIGHT - M - gap * (cols - 1)) / cols
  const H = 19
  cards.forEach((c, i) => {
    const col = i % cols, row = Math.floor(i / cols)
    const x = M + col * (W + gap)
    const y = startY + row * (H + gap)
    doc.setDrawColor(...PALETTE.borda)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, W, H, 1.5, 1.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...PALETTE.cinza)
    doc.text(c.label.toUpperCase(), x + 4, y + 6)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12.5)
    doc.setTextColor(...(c.color || PALETTE.preto))
    doc.text(c.value, x + 4, y + 12.5)

    if (c.sub) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...PALETTE.cinza)
      doc.text(c.sub, x + 4, y + 16.8)
    }
  })
  return startY + Math.ceil(cards.length / cols) * (H + gap)
}

// Barra horizontal (atual vs marca do ideal) desenhada com rect. Sem lib de grafico.
export function drawBenchBar(doc, cell, atual, ideal, cor) {
  const x = cell.x + 2
  const w = cell.width - 4
  const midY = cell.y + cell.height / 2
  const escala = Math.max(atual, ideal, 0.0001) * 1.6
  // trilho
  doc.setFillColor(...PALETTE.borda)
  doc.rect(x, midY - 1.1, w, 2.2, 'F')
  // preenchimento (atual)
  const fillW = Math.max(0, Math.min(w, w * (atual / escala)))
  doc.setFillColor(...cor)
  doc.rect(x, midY - 1.1, fillW, 2.2, 'F')
  // marca do ideal
  const tickX = x + Math.min(w, w * (ideal / escala))
  doc.setDrawColor(...PALETTE.preto)
  doc.setLineWidth(0.4)
  doc.line(tickX, midY - 2.2, tickX, midY + 2.2)
}

// Rodape em todas as paginas: restaurante+periodo | aviso | Pagina X de Y
export function drawRodape(doc, { restaurante, periodo }) {
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setDrawColor(...PALETTE.borda)
    doc.setLineWidth(0.2)
    doc.line(M, PAGE_H - 14, RIGHT, PAGE_H - 14)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...PALETTE.cinza)
    doc.text(`${restaurante || 'Restaurante'} · ${periodo}`, M, PAGE_H - 9.5)
    doc.text('Documento gerado automaticamente — nao substitui escrituracao contabil oficial.', 105, PAGE_H - 9.5, { align: 'center' })
    doc.text(`Pagina ${i} de ${total}`, RIGHT, PAGE_H - 9.5, { align: 'right' })
  }
}

export function statusBench(v, b) {
  if (b.inv) return v >= b.ideal ? 'SAUDAVEL' : v >= b.atencao ? 'ATENCAO' : 'CRITICO'
  return v <= b.ideal ? 'SAUDAVEL' : v <= b.atencao ? 'ATENCAO' : 'CRITICO'
}

export function statusColor(status) {
  if (status === 'SAUDAVEL') return PALETTE.verde
  if (status === 'ATENCAO')  return PALETTE.ambar
  return PALETTE.vermelho
}
