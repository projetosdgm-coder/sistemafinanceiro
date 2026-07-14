import { useMemo } from 'react'
import useStore from '../store/useStore'
import { fmtR, fmtP } from '../utils/formatters'
import { calcularCMVReal, calcularCMVTeorico, calcularCMO, calcularDRE, calcularCustoPrato } from '../utils/calculations'
import { BENCHMARKS } from '../utils/benchmarks'
import Badge from '../components/Badge'
const loadExcel = () => import('../utils/exportExcel')

function statusBench(v, b) {
  if (b.inv) return v >= b.ideal ? 'saudavel' : v >= b.atencao ? 'atencao' : 'critico'
  return v <= b.ideal ? 'saudavel' : v <= b.atencao ? 'atencao' : 'critico'
}

const TH = 'px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap'
const TD = 'px-4 py-3 text-sm text-gray-700 dark:text-gray-300 align-middle'

export default function CMV() {
  const store = useStore()
  const { ingredientes, receitas, receitaItens, vendas, estoque, funcionarios, dre } = store

  const { cmvReal, cmvTeorico, rl, variancia } = useMemo(() => {
    const cmvReal = calcularCMVReal(estoque, ingredientes)
    const cmvTeorico = calcularCMVTeorico(receitas, receitaItens, vendas, ingredientes)
    const cmo = calcularCMO(funcionarios)
    const { rl } = calcularDRE(dre, cmvReal, cmo)
    const rlSafe = rl || 1
    return { cmvReal, cmvTeorico, rl: rlSafe, variancia: Math.abs(cmvReal - cmvTeorico) / rlSafe }
  }, [ingredientes, receitas, receitaItens, vendas, estoque, funcionarios, dre])

  const varAbs = Math.abs(cmvReal - cmvTeorico)
  const statusReal = statusBench(cmvReal / rl, BENCHMARKS.cmv)
  const statusVar  = statusBench(variancia, BENCHMARKS.variancia)

  const pratoRows = useMemo(() =>
    receitas.map(r => {
      const custo = calcularCustoPrato(r.id, receitaItens, ingredientes)
      const qtd   = vendas.find(v => v.prato_id === r.id)?.qtd ?? 0
      const total = custo * qtd
      const recTotal = r.preco * qtd
      return { ...r, custo, qtd, total, pct: recTotal > 0 ? total / recTotal : 0 }
    }), [receitas, receitaItens, ingredientes, vendas])

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">CMV — Custo de Mercadoria Vendida</h2>
        <button onClick={() => loadExcel().then(m => m.exportCMVExcel(store))}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
          Exportar Excel
        </button>
      </div>

      {/* Cards comparativo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-5">
          <div className="text-xs font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-2">CMV Teorico</div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{fmtR(cmvTeorico)}</div>
          <div className="text-xs text-blue-400 mt-1">{fmtP(cmvTeorico/rl)} da Rec. Liquida</div>
          <div className="text-xs text-gray-400 mt-2">Calculado pelas fichas tecnicas x vendas</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">CMV Real</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{fmtR(cmvReal)}</div>
          <div className="text-xs text-gray-400 mt-1">{fmtP(cmvReal/rl)} da Rec. Liquida</div>
          <div className="mt-3"><Badge status={statusReal} /></div>
          <div className="text-xs text-gray-400 mt-2">Calculado pelo consumo real de estoque</div>
        </div>
        <div className={`border rounded-xl p-5 ${varAbs > 0 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800' : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800'}`}>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Variancia (Desperdicio)</div>
          <div className={`text-2xl font-bold ${varAbs > 0 ? 'text-primary' : 'text-green-600 dark:text-green-400'}`}>{fmtR(varAbs)}</div>
          <div className="text-xs text-gray-400 mt-1">{fmtP(variancia)} da Rec. Liquida</div>
          <div className="mt-3"><Badge status={statusVar} /></div>
          <div className="text-xs text-gray-400 mt-2">Diferenca entre CMV Real e Teorico</div>
        </div>
      </div>

      {/* Benchmarks */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm px-5 py-4 flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
        <span>Benchmark CMV: <strong className="text-gray-900 dark:text-white">&lt;= {fmtP(BENCHMARKS.cmv.ideal)}</strong> (ideal) · &lt;= {fmtP(BENCHMARKS.cmv.atencao)} (atencao)</span>
        <span>Benchmark Variancia: <strong className="text-gray-900 dark:text-white">&lt;= {fmtP(BENCHMARKS.variancia.ideal)}</strong> (ideal) · &lt;= {fmtP(BENCHMARKS.variancia.atencao)} (atencao)</span>
      </div>

      {/* CMV por prato */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 font-semibold text-gray-900 dark:text-white text-sm">
          CMV por Prato (Teorico)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                {['Prato','Custo Unit.','Qtd. Vendida','CMV Total','Receita Total','% CMV'].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pratoRows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">Nenhum prato cadastrado.</td></tr>
              )}
              {pratoRows.map((r, idx) => (
                <tr key={r.id} className={`border-t border-gray-100 dark:border-gray-700 ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/30'}`}>
                  <td className={`${TD} font-semibold text-gray-900 dark:text-white`}>{r.nome}</td>
                  <td className={TD}>{fmtR(r.custo)}</td>
                  <td className={TD}>{r.qtd}</td>
                  <td className={TD}>{fmtR(r.total)}</td>
                  <td className={TD}>{fmtR(r.preco * r.qtd)}</td>
                  <td className={`${TD} font-bold ${r.pct <= BENCHMARKS.cmv.ideal ? 'text-green-600 dark:text-green-400' : r.pct <= BENCHMARKS.cmv.atencao ? 'text-primary' : 'text-red-600 dark:text-red-400'}`}>
                    {fmtP(r.pct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
