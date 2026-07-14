import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { fmtR, fmtP } from './formatters'
import { calcularDRE, calcularCMVReal, calcularCMVTeorico, calcularCMO } from './calculations'
import { BENCHMARKS } from './benchmarks'
import {
  PALETTE, M, RIGHT, sanitizeFilename, money, mesAno,
  drawIdentificacao, drawSectionTitle, drawKpiCards, drawBenchBar,
  drawRodape, statusBench, statusColor,
} from './pdfKit'

const emissaoAgora = () =>
  new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

// ---------- Resumo executivo (KPIs + benchmark) — compartilhado ----------

function kpiCardsFrom(r, cmvReal, cmo, rl) {
  return [
    { label: 'Receita Bruta',   value: money(r.rb) },
    { label: 'Receita Liquida', value: money(r.rl) },
    { label: 'CMV',             value: money(cmvReal), sub: `${fmtP(cmvReal / rl)} da RL` },
    { label: 'CMO',             value: money(cmo),     sub: `${fmtP(cmo / rl)} da RL` },
    { label: 'EBITDA',          value: money(r.ebitda), sub: `Margem ${fmtP(r.ebitda / rl)}`, color: r.ebitda >= 0 ? PALETTE.preto : PALETTE.vermelho },
    { label: 'Lucro Liquido',   value: money(r.ll),     sub: `Margem ${fmtP(r.ll / rl)}`,     color: r.ll >= 0 ? PALETTE.verde : PALETTE.vermelho },
  ]
}

function drawBenchmarkTable(doc, { r, cmvReal, cmvTeorico, cmo, dre, rl, startY }) {
  const linhas = [
    { b: BENCHMARKS.cmv,       atual: cmvReal / rl,                    op: '<=' },
    { b: BENCHMARKS.cmo,       atual: cmo / rl,                        op: '<=' },
    { b: BENCHMARKS.aluguel,   atual: (dre.aluguel || 0) / rl,         op: '<=' },
    { b: BENCHMARKS.ebitda,    atual: r.ebitda / rl,                   op: '>=' },
    { b: BENCHMARKS.ll,        atual: r.ll / rl,                       op: '>=' },
    { b: BENCHMARKS.variancia, atual: Math.abs(cmvReal - cmvTeorico) / rl, op: '<=' },
  ]
  const meta = linhas.map(l => ({ atual: l.atual, ideal: l.b.ideal, status: statusBench(l.atual, l.b) }))
  const body = linhas.map(l => [
    l.b.label,
    fmtP(l.atual),
    `${l.op} ${fmtP(l.b.ideal)}`,
    '',                       // coluna do comparativo (barra desenhada)
    statusBench(l.atual, l.b),
  ])

  autoTable(doc, {
    startY,
    head: [['Indicador', 'Atual', 'Ideal', 'Comparativo', 'Status']],
    body,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 2, textColor: PALETTE.preto },
    headStyles: { fillColor: PALETTE.zebra, textColor: PALETTE.preto, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: PALETTE.zebra },
    columnStyles: {
      0: { cellWidth: 58 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 26 },
      3: { cellWidth: 42 },
      4: { halign: 'center' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 4) {
        data.cell.styles.textColor = statusColor(data.cell.raw)
        data.cell.styles.fontStyle = 'bold'
      }
    },
    didDrawCell(data) {
      if (data.section === 'body' && data.column.index === 3) {
        const m = meta[data.row.index]
        drawBenchBar(doc, data.cell, m.atual, m.ideal, statusColor(m.status))
      }
    },
    margin: { left: M, right: M },
  })
  return doc.lastAutoTable.finalY
}

// ---------- DRE detalhado (itemizado, AV %) ----------

function drawDREDetalhado(doc, { dre, cmvReal, cmo, r, rl, startY }) {
  const av = (v) => fmtP(v / rl)
  const pctImp = dre.imp_pct || 0
  const pctTaxa = dre.taxa_pct || 0

  // Cada linha: { tipo, label, valor(number|null), avStr }
  const L = []
  const push = (tipo, label, valor = null, avStr = null) => L.push({ tipo, label, valor, avStr })

  push('section', 'Receita Bruta')
  push('item', 'Salao',    dre.salao || 0,    av(dre.salao || 0))
  push('item', 'Delivery', dre.delivery || 0, av(dre.delivery || 0))
  push('item', 'iFood',    dre.ifood || 0,    av(dre.ifood || 0))
  push('item', 'Eventos',  dre.eventos || 0,  av(dre.eventos || 0))
  push('subtotal', '(=) Receita Bruta Total', r.rb, av(r.rb))

  push('section', '(-) Deducoes sobre Vendas')
  push('item', `Impostos sobre vendas (${fmtP(pctImp)})`, r.rb * pctImp, av(r.rb * pctImp))
  push('item', `Taxas de cartao (${fmtP(pctTaxa)})`,      r.rb * pctTaxa, av(r.rb * pctTaxa))
  push('item', 'Devolucoes', dre.dev || 0, av(dre.dev || 0))
  push('subtotal', '(=) Receita Liquida', r.rl, '100,0%')

  push('section', '(-) CMV — Custo de Mercadoria Vendida')
  push('item', 'CMV Real (consumo de estoque)', cmvReal, av(cmvReal))
  push('subtotal', '(=) Lucro Bruto', r.lb, av(r.lb))

  push('section', '(-) CMO — Custo de Mao de Obra')
  push('item', 'CMO total (colaboradores + avulsos)', cmo, av(cmo))

  push('section', '(-) Despesas Operacionais')
  const DESP = [
    ['aluguel', 'Aluguel'], ['energia', 'Energia eletrica'], ['agua', 'Agua'],
    ['internet', 'Internet / Telefone'], ['marketing', 'Marketing'], ['contabil', 'Contabilidade'],
    ['manut', 'Manutencao'], ['seguros', 'Seguros'], ['pdv', 'PDV / Sistema'],
    ['limpeza', 'Material de limpeza'], ['outros', 'Outros custos'],
  ]
  DESP.forEach(([f, lab]) => push('item', lab, dre[f] || 0, av(dre[f] || 0)))
  push('subtotal', 'Total Despesas Operacionais', r.desp, av(r.desp))

  push('subtotal', '(=) EBITDA', r.ebitda, av(r.ebitda))

  push('section', '(-) Ajustes e Resultado Financeiro')
  push('item', 'Depreciacao', dre.depre || 0, av(dre.depre || 0))
  push('item', 'Juros', dre.juros || 0, av(dre.juros || 0))
  push('item', 'Parcelas / Financiamentos', dre.parcelas || 0, av(dre.parcelas || 0))
  push('item', 'Imposto de Renda (IR / CSLL)', dre.ir || 0, av(dre.ir || 0))
  push('final', '(=) Lucro Liquido', r.ll, av(r.ll))

  const meta = L
  const body = L.map(x => [
    x.tipo === 'item' ? `    ${x.label}` : x.label,
    x.valor === null ? '' : money(x.valor),
    x.avStr === null ? '' : x.avStr,
  ])

  autoTable(doc, {
    startY,
    head: [['Descricao', 'Valor (R$)', 'AV %']],
    body,
    theme: 'plain',
    showHead: 'everyPage',
    styles: { fontSize: 8.5, cellPadding: { top: 1.4, bottom: 1.4, left: 2, right: 2 }, textColor: PALETTE.preto },
    headStyles: { fillColor: PALETTE.laranja, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 118 },
      1: { halign: 'right', cellWidth: 40 },
      2: { halign: 'right', cellWidth: 24 },
    },
    didParseCell(data) {
      if (data.section !== 'body') return
      const m = meta[data.row.index]
      if (!m) return
      if (m.tipo === 'section') {
        data.cell.styles.textColor = PALETTE.laranja
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fontSize = 8.5
      }
      if (m.tipo === 'subtotal') {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = PALETTE.cinzaClaro
      }
      if (m.tipo === 'final') {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fontSize = 10
        data.cell.styles.fillColor = r.ll >= 0 ? PALETTE.verdeBg : PALETTE.vermelhoBg
        data.cell.styles.textColor = r.ll >= 0 ? PALETTE.verde : PALETTE.vermelho
      }
      // valores negativos em vermelho (coluna Valor)
      if (data.column.index === 1 && typeof m.valor === 'number' && m.valor < 0 && m.tipo !== 'final') {
        data.cell.styles.textColor = PALETTE.vermelho
      }
    },
    didDrawCell(data) {
      if (data.section !== 'body') return
      const m = meta[data.row.index]
      if ((m?.tipo === 'subtotal' || m?.tipo === 'final') && data.column.index === 0) {
        doc.setDrawColor(...PALETTE.borda)
        doc.setLineWidth(0.3)
        doc.line(M, data.cell.y, RIGHT, data.cell.y)
      }
    },
    margin: { left: M, right: M },
  })
  return doc.lastAutoTable.finalY
}

// ---------- Anexos ----------

function drawAnexos(doc, { dre, cmvReal, cmvTeorico, r, rl }) {
  let y = drawSectionTitle(doc, 'Anexo I — Composicao da Receita Bruta', 20)
  const rb = r.rb || 1
  const compBody = [
    ['Salao',    money(dre.salao || 0),    fmtP((dre.salao || 0) / rb)],
    ['Delivery', money(dre.delivery || 0), fmtP((dre.delivery || 0) / rb)],
    ['iFood',    money(dre.ifood || 0),    fmtP((dre.ifood || 0) / rb)],
    ['Eventos',  money(dre.eventos || 0),  fmtP((dre.eventos || 0) / rb)],
  ]
  autoTable(doc, {
    startY: y,
    head: [['Canal', 'Valor', '% da Receita Bruta']],
    body: compBody,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1.8, textColor: PALETTE.preto },
    headStyles: { fillColor: PALETTE.zebra, textColor: PALETTE.preto, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: PALETTE.zebra },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    margin: { left: M, right: M },
  })

  y = doc.lastAutoTable.finalY + 10
  y = drawSectionTitle(doc, 'Anexo II — CMV: Teorico x Real', y)
  const variancia = Math.abs(cmvReal - cmvTeorico)
  const cmvBody = [
    ['CMV Teorico (fichas x vendas)', money(cmvTeorico), fmtP(cmvTeorico / rl)],
    ['CMV Real (consumo de estoque)', money(cmvReal),    fmtP(cmvReal / rl)],
    ['Variancia (desperdicio)',       money(variancia),  fmtP(variancia / rl)],
  ]
  autoTable(doc, {
    startY: y,
    head: [['Indicador', 'Valor', '% da Receita Liquida']],
    body: cmvBody,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1.8, textColor: PALETTE.preto },
    headStyles: { fillColor: PALETTE.zebra, textColor: PALETTE.preto, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: PALETTE.zebra },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    margin: { left: M, right: M },
  })

  y = doc.lastAutoTable.finalY + 10
  y = drawSectionTitle(doc, 'Glossario', y)
  const glossario = [
    ['CMV', 'Custo da Mercadoria Vendida — insumos consumidos para preparar os pratos.'],
    ['CMO', 'Custo de Mao de Obra — salarios, encargos e pagamentos de pessoal.'],
    ['EBITDA', 'Resultado operacional antes de juros, impostos, depreciacao e amortizacao.'],
    ['Receita Liquida', 'Receita Bruta menos deducoes (impostos, taxas e devolucoes).'],
    ['Variancia', 'Diferenca entre CMV Real e Teorico; indica desperdicio ou perda.'],
    ['Analise Vertical (AV %)', 'Peso de cada linha sobre a Receita Liquida.'],
  ]
  doc.setFontSize(8.5)
  glossario.forEach(([termo, def]) => {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...PALETTE.preto)
    doc.text(`${termo}:`, M, y)
    const tw = doc.getTextWidth(`${termo}: `)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...PALETTE.cinza)
    const linhas = doc.splitTextToSize(def, RIGHT - M - tw)
    doc.text(linhas, M + tw, y)
    y += Math.max(5, linhas.length * 4.4)
  })

  // Observacoes
  y += 4
  y = drawSectionTitle(doc, 'Observacoes', y)
  doc.setDrawColor(...PALETTE.borda)
  doc.setLineWidth(0.3)
  doc.roundedRect(M, y, RIGHT - M, 30, 1.5, 1.5)
}

// ---------- Export: DRE ----------

export function exportDREPDF(store, restaurante) {
  const { ingredientes, receitas, receitaItens, vendas, estoque, funcionarios, comprovantes, dre } = store
  const cmvReal    = calcularCMVReal(estoque, ingredientes)
  const cmvTeorico = calcularCMVTeorico(receitas, receitaItens, vendas, ingredientes)
  const cmo        = calcularCMO(funcionarios, comprovantes)   // inclui avulsos, igual a tela do DRE
  const r          = calcularDRE(dre, cmvReal, cmo)
  const rl         = r.rl || 1

  const periodo = mesAno()
  const doc = new jsPDF()

  // Pagina 1 — identificacao + resumo executivo
  let y = drawIdentificacao(doc, {
    restaurante, titulo: 'Demonstrativo de Resultado do Exercicio (DRE)',
    periodo, emissao: emissaoAgora(),
  })
  y = drawSectionTitle(doc, 'Resumo Executivo', y)
  y = drawKpiCards(doc, kpiCardsFrom(r, cmvReal, cmo, rl), y) + 6
  y = drawSectionTitle(doc, 'Indicadores vs Benchmark', y)
  drawBenchmarkTable(doc, { r, cmvReal, cmvTeorico, cmo, dre, rl, startY: y })

  // Pagina 2 — DRE detalhado
  doc.addPage()
  y = drawSectionTitle(doc, 'DRE Detalhado', 20)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...PALETTE.cinza)
  doc.text('AV % = Analise Vertical, calculada sobre a Receita Liquida.', M, y)
  drawDREDetalhado(doc, { dre, cmvReal, cmo, r, rl, startY: y + 4 })

  // Pagina 3 — anexos
  doc.addPage()
  drawAnexos(doc, { dre, cmvReal, cmvTeorico, r, rl })

  drawRodape(doc, { restaurante, periodo })

  const mm = String(new Date().getMonth() + 1).padStart(2, '0')
  const aaaa = new Date().getFullYear()
  doc.save(`DRE_${sanitizeFilename(restaurante)}_${mm}-${aaaa}.pdf`)
}

// ---------- Export: Dashboard (resumo mais curto) ----------

export function exportDashboardPDF(store, restaurante) {
  const { ingredientes, receitas, receitaItens, vendas, estoque, funcionarios, comprovantes, dre } = store
  const cmvReal    = calcularCMVReal(estoque, ingredientes)
  const cmvTeorico = calcularCMVTeorico(receitas, receitaItens, vendas, ingredientes)
  const cmo        = calcularCMO(funcionarios, comprovantes)
  const r          = calcularDRE(dre, cmvReal, cmo)
  const rl         = r.rl || 1

  const periodo = mesAno()
  const doc = new jsPDF()

  let y = drawIdentificacao(doc, {
    restaurante, titulo: 'Dashboard — Resumo Executivo',
    periodo, emissao: emissaoAgora(),
  })
  y = drawSectionTitle(doc, 'Indicadores Financeiros', y)
  y = drawKpiCards(doc, kpiCardsFrom(r, cmvReal, cmo, rl), y) + 6
  y = drawSectionTitle(doc, 'Indicadores vs Benchmark', y)
  drawBenchmarkTable(doc, { r, cmvReal, cmvTeorico, cmo, dre, rl, startY: y })

  drawRodape(doc, { restaurante, periodo })

  const mm = String(new Date().getMonth() + 1).padStart(2, '0')
  const aaaa = new Date().getFullYear()
  doc.save(`Resumo_${sanitizeFilename(restaurante)}_${mm}-${aaaa}.pdf`)
}
