import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { fmtR, fmtP } from './formatters'
import { calcularDRE, calcularCMVReal, calcularCMVTeorico, calcularCMO, calcularCustoPrato } from './calculations'
import { BENCHMARKS } from './benchmarks'

function header(doc, restaurante, titulo) {
  doc.setFillColor(17, 17, 17)
  doc.rect(0, 0, 210, 22, 'F')
  doc.setTextColor(255, 193, 7)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('SISTEMA FINANCEIRO', 14, 10)
  doc.setTextColor(200, 200, 200)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Gestão de Restaurante', 14, 15)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(titulo, 105, 10, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(restaurante || 'Restaurante', 105, 16, { align: 'center' })
  const hoje = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  doc.setTextColor(200, 200, 200)
  doc.setFontSize(8)
  doc.text(hoje, 196, 10, { align: 'right' })
  doc.setTextColor(17, 17, 17)
}

function statusBench(v, b) {
  if (b.inv) return v >= b.ideal ? 'SAUDÁVEL' : v >= b.atencao ? 'ATENÇÃO' : 'CRÍTICO'
  return v <= b.ideal ? 'SAUDÁVEL' : v <= b.atencao ? 'ATENÇÃO' : 'CRÍTICO'
}

function cellColor(status) {
  if (status === 'SAUDÁVEL') return [27, 94, 32]
  if (status === 'ATENÇÃO')  return [230, 81, 0]
  return [183, 28, 28]
}

export function exportDashboardPDF(store, restaurante) {
  const { ingredientes, receitas, receitaItens, vendas, estoque, funcionarios, dre } = store
  const cmvReal   = calcularCMVReal(estoque, ingredientes)
  const cmvTeorico = calcularCMVTeorico(receitas, receitaItens, vendas, ingredientes)
  const cmo        = calcularCMO(funcionarios)
  const r          = calcularDRE(dre, cmvReal, cmo)
  const rl         = r.rl || 1

  const doc = new jsPDF()
  header(doc, restaurante, 'Dashboard — Resumo Executivo')

  // KPIs
  let y = 32
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('INDICADORES FINANCEIROS', 14, y)
  y += 6

  const kpis = [
    ['Receita Bruta',   fmtR(r.rb)],
    ['Receita Líquida', fmtR(r.rl)],
    ['EBITDA',          `${fmtR(r.ebitda)} (${fmtP(r.ebitda / rl)})`],
    ['Lucro Líquido',   `${fmtR(r.ll)} (${fmtP(r.ll / rl)})`],
    ['CMV Real',        `${fmtR(cmvReal)} (${fmtP(cmvReal / rl)})`],
    ['CMO',             `${fmtR(cmo)} (${fmtP(cmo / rl)})`],
  ]

  autoTable(doc, {
    startY: y,
    head: [['Indicador', 'Valor']],
    body: kpis,
    theme: 'grid',
    headStyles: { fillColor: [17, 17, 17], textColor: [255, 193, 7], fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  })

  // Benchmarks
  y = doc.lastAutoTable.finalY + 10
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('INDICADORES vs BENCHMARK', 14, y)
  y += 2

  const benchRows = [
    [BENCHMARKS.cmv.label,       fmtP(cmvReal/rl),              `≤ ${fmtP(BENCHMARKS.cmv.ideal)}`,       statusBench(cmvReal/rl, BENCHMARKS.cmv)],
    [BENCHMARKS.cmo.label,       fmtP(cmo/rl),                  `≤ ${fmtP(BENCHMARKS.cmo.ideal)}`,       statusBench(cmo/rl, BENCHMARKS.cmo)],
    [BENCHMARKS.aluguel.label,   fmtP((dre.aluguel||0)/rl),     `≤ ${fmtP(BENCHMARKS.aluguel.ideal)}`,   statusBench((dre.aluguel||0)/rl, BENCHMARKS.aluguel)],
    [BENCHMARKS.ebitda.label,    fmtP(r.ebitda/rl),             `≥ ${fmtP(BENCHMARKS.ebitda.ideal)}`,    statusBench(r.ebitda/rl, BENCHMARKS.ebitda)],
    [BENCHMARKS.ll.label,        fmtP(r.ll/rl),                 `≥ ${fmtP(BENCHMARKS.ll.ideal)}`,        statusBench(r.ll/rl, BENCHMARKS.ll)],
    [BENCHMARKS.variancia.label, fmtP(Math.abs(cmvReal-cmvTeorico)/rl), `≤ ${fmtP(BENCHMARKS.variancia.ideal)}`, statusBench(Math.abs(cmvReal-cmvTeorico)/rl, BENCHMARKS.variancia)],
  ]

  autoTable(doc, {
    startY: y,
    head: [['Indicador', 'Atual', 'Ideal', 'Status']],
    body: benchRows,
    theme: 'grid',
    headStyles: { fillColor: [17, 17, 17], textColor: [255, 193, 7], fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } },
    didDrawCell(data) {
      if (data.section === 'body' && data.column.index === 3) {
        const status = data.cell.raw
        const [r, g, b] = cellColor(status)
        data.cell.styles.textColor = [r, g, b]
        data.cell.styles.fontStyle = 'bold'
      }
    },
    margin: { left: 14, right: 14 },
  })

  doc.save('Dashboard.pdf')
}

export function exportDREPDF(store, restaurante) {
  const { ingredientes, estoque, funcionarios, dre } = store
  const cmvReal = calcularCMVReal(estoque, ingredientes)
  const cmo     = calcularCMO(funcionarios)
  const r       = calcularDRE(dre, cmvReal, cmo)
  const rl      = r.rl || 1

  const doc = new jsPDF()
  header(doc, restaurante, 'DRE — Demonstrativo de Resultado')

  const rows = [
    ['RECEITA BRUTA', '', '', ''],
    ['  Salão',                  fmtR(dre.salao||0),   fmtP((dre.salao||0)/rl),   ''],
    ['  Delivery',               fmtR(dre.delivery||0),fmtP((dre.delivery||0)/rl),''],
    ['  iFood',                  fmtR(dre.ifood||0),   fmtP((dre.ifood||0)/rl),   ''],
    ['  Eventos',                fmtR(dre.eventos||0), fmtP((dre.eventos||0)/rl), ''],
    ['RECEITA BRUTA TOTAL',      fmtR(r.rb),  fmtP(r.rb/rl),  ''],
    ['DEDUÇÕES',                 fmtR(r.ded), fmtP(r.ded/rl), ''],
    ['RECEITA LÍQUIDA',          fmtR(r.rl),  '100,0%',        ''],
    ['CMV (Custo Mercadoria)',    fmtR(cmvReal),fmtP(cmvReal/rl),''],
    ['LUCRO BRUTO',              fmtR(r.lb),  fmtP(r.lb/rl),  ''],
    ['CMO (Mão de Obra)',        fmtR(cmo),   fmtP(cmo/rl),   ''],
    ['DESPESAS OPERACIONAIS',    fmtR(r.desp),fmtP(r.desp/rl),''],
    ['EBITDA',                   fmtR(r.ebitda),fmtP(r.ebitda/rl),''],
    ['AJUSTES (Depre./Juros/Parcelas)', fmtR(r.ajustes+( dre.ir||0)), fmtP((r.ajustes+(dre.ir||0))/rl), ''],
    ['LUCRO LÍQUIDO',            fmtR(r.ll),  fmtP(r.ll/rl),  ''],
  ]

  const bold = new Set(['RECEITA BRUTA TOTAL','RECEITA LÍQUIDA','LUCRO BRUTO','EBITDA','LUCRO LÍQUIDO'])
  const sections = new Set(['RECEITA BRUTA','DEDUÇÕES','CMV (Custo Mercadoria)','CMO (Mão de Obra)','DESPESAS OPERACIONAIS','AJUSTES (Depre./Juros/Parcelas)'])

  autoTable(doc, {
    startY: 30,
    head: [['Descrição', 'Valor (R$)', '% RL', '']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [17, 17, 17], textColor: [255, 193, 7] },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    didParseCell(data) {
      if (data.section !== 'body') return
      const label = data.row.raw[0]
      if (bold.has(label)) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [240, 240, 240]
      }
      if (sections.has(label)) {
        data.cell.styles.fillColor = [17, 17, 17]
        data.cell.styles.textColor = [255, 193, 7]
        data.cell.styles.fontStyle = 'bold'
      }
      if (label === 'LUCRO LÍQUIDO') {
        data.cell.styles.fillColor = r.ll >= 0 ? [232, 245, 233] : [255, 235, 238]
        data.cell.styles.textColor = r.ll >= 0 ? [27, 94, 32] : [183, 28, 28]
      }
    },
    margin: { left: 14, right: 14 },
  })

  doc.save('DRE.pdf')
}
