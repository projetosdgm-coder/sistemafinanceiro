import { utils as xlsxUtils, writeFile } from 'xlsx'
import { fmtR, fmtP } from './formatters'
import { calcularDRE, calcularCMVReal, calcularCMVTeorico, calcularCMO, calcularCustoPrato } from './calculations'

function wb(sheets) {
  const workbook = xlsxUtils.book_new()
  sheets.forEach(({ name, data }) => {
    const ws = xlsxUtils.aoa_to_sheet(data)
    xlsxUtils.book_append_sheet(workbook, ws, name)
  })
  return workbook
}

export function exportDREExcel(store) {
  const { ingredientes, estoque, funcionarios, dre } = store
  const cmvReal = calcularCMVReal(estoque, ingredientes)
  const cmo     = calcularCMO(funcionarios)
  const r       = calcularDRE(dre, cmvReal, cmo)
  const rl      = r.rl || 1

  const data = [
    ['DRE — Demonstrativo de Resultado', '', '', ''],
    [''],
    ['Descrição', 'Valor (R$)', '% Rec. Líquida', ''],
    ['RECEITA BRUTA', '', '', ''],
    ['  Salão',          dre.salao||0,    fmtP((dre.salao||0)/rl)],
    ['  Delivery',       dre.delivery||0, fmtP((dre.delivery||0)/rl)],
    ['  iFood',          dre.ifood||0,    fmtP((dre.ifood||0)/rl)],
    ['  Eventos',        dre.eventos||0,  fmtP((dre.eventos||0)/rl)],
    ['RECEITA BRUTA TOTAL', r.rb, fmtP(r.rb/rl)],
    ['TOTAL DEDUÇÕES',   r.ded, fmtP(r.ded/rl)],
    ['RECEITA LÍQUIDA',  r.rl,  '100,0%'],
    [''],
    ['CMV REAL',         cmvReal, fmtP(cmvReal/rl)],
    ['LUCRO BRUTO',      r.lb,   fmtP(r.lb/rl)],
    [''],
    ['CMO',              cmo,    fmtP(cmo/rl)],
    [''],
    ['DESPESAS OPERACIONAIS', '', ''],
    ['  Aluguel',        dre.aluguel||0,   fmtP((dre.aluguel||0)/rl)],
    ['  Energia',        dre.energia||0,   fmtP((dre.energia||0)/rl)],
    ['  Água',           dre.agua||0,      fmtP((dre.agua||0)/rl)],
    ['  Internet',       dre.internet||0,  fmtP((dre.internet||0)/rl)],
    ['  Marketing',      dre.marketing||0, fmtP((dre.marketing||0)/rl)],
    ['  Contabilidade',  dre.contabil||0,  fmtP((dre.contabil||0)/rl)],
    ['  Manutenção',     dre.manut||0,     fmtP((dre.manut||0)/rl)],
    ['  Seguros',        dre.seguros||0,   fmtP((dre.seguros||0)/rl)],
    ['  PDV/Sistema',    dre.pdv||0,       fmtP((dre.pdv||0)/rl)],
    ['  Limpeza',        dre.limpeza||0,   fmtP((dre.limpeza||0)/rl)],
    ['  Outros',         dre.outros||0,    fmtP((dre.outros||0)/rl)],
    ['TOTAL DESPESAS',   r.desp,  fmtP(r.desp/rl)],
    [''],
    ['EBITDA',           r.ebitda, fmtP(r.ebitda/rl)],
    [''],
    ['  Depreciação',    dre.depre||0,    fmtP((dre.depre||0)/rl)],
    ['  Juros',          dre.juros||0,    fmtP((dre.juros||0)/rl)],
    ['  Parcelas',       dre.parcelas||0, fmtP((dre.parcelas||0)/rl)],
    ['  IR/CSLL',        dre.ir||0,       fmtP((dre.ir||0)/rl)],
    [''],
    ['LUCRO LÍQUIDO',    r.ll,    fmtP(r.ll/rl)],
  ]

  const workbook = wb([{ name: 'DRE', data }])
  writeFile(workbook, 'DRE_Alpha.xlsx')
}

export function exportCMVExcel(store) {
  const { ingredientes, receitas, receitaItens, vendas, estoque, funcionarios, dre } = store
  const cmvReal    = calcularCMVReal(estoque, ingredientes)
  const cmvTeorico = calcularCMVTeorico(receitas, receitaItens, vendas, ingredientes)
  const cmo        = calcularCMO(funcionarios)
  const { rl }     = calcularDRE(dre, cmvReal, cmo)
  const rlSafe     = rl || 1

  // Análise por prato
  const pratoRows = receitas.map((r) => {
    const custo    = calcularCustoPrato(r.id, receitaItens, ingredientes)
    const qtd      = vendas.find((v) => v.prato_id === r.id)?.qtd ?? 0
    const cmvTotal = custo * qtd
    const recTotal = r.preco * qtd
    const pct      = recTotal > 0 ? cmvTotal / recTotal : 0
    return [r.nome, r.cat, fmtR(custo), qtd, fmtR(cmvTotal), fmtR(recTotal), fmtP(pct)]
  })

  // Análise de estoque
  const estoqueRows = estoque.map((e) => {
    const ing     = ingredientes.find((x) => x.id === e.ing_id)
    if (!ing) return null
    const consumo = (e.ei||0) + (e.compras||0) - (e.ef||0)
    const custo   = consumo * ing.preco
    return [ing.nome, ing.un, e.ei||0, e.compras||0, e.ef||0, consumo, fmtR(ing.preco), fmtR(custo)]
  }).filter(Boolean)

  const data = [
    ['CMV — Análise de Custo de Mercadoria', '', '', '', '', '', ''],
    [''],
    ['RESUMO', '', ''],
    ['CMV Teórico (fichas × vendas)', fmtR(cmvTeorico), fmtP(cmvTeorico/rlSafe)],
    ['CMV Real (estoque)',            fmtR(cmvReal),     fmtP(cmvReal/rlSafe)],
    ['Variância (desperdício)',       fmtR(Math.abs(cmvReal-cmvTeorico)), fmtP(Math.abs(cmvReal-cmvTeorico)/rlSafe)],
    [''],
    ['CMV POR PRATO', '', '', '', '', '', ''],
    ['Prato', 'Categoria', 'Custo Unit.', 'Qtd. Vendida', 'CMV Total', 'Receita Total', '% CMV'],
    ...pratoRows,
    [''],
    ['CONSUMO DE ESTOQUE', '', '', '', '', '', ''],
    ['Ingrediente', 'Unid.', 'Est. Inicial', 'Compras', 'Est. Final', 'Consumo', 'Preço Unit.', 'Custo Total'],
    ...estoqueRows,
  ]

  const workbook = wb([{ name: 'CMV', data }])
  writeFile(workbook, 'CMV_Alpha.xlsx')
}
