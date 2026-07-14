import { useMemo, useState } from 'react'
import useStore from '../store/useStore'
import { fmtR } from '../utils/formatters'
import { calcularCustoPrato } from '../utils/calculations'
import Toast from '../components/Toast'

const TH = 'px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap'
const TD = 'px-4 py-3 text-sm text-gray-700 dark:text-gray-300 align-middle'

export default function Vendas() {
  const { receitas, receitaItens, ingredientes, vendas, updateVenda } = useStore()
  const [toast, setToast] = useState('')

  const rows = useMemo(() =>
    receitas.map(r => {
      const custo = calcularCustoPrato(r.id, receitaItens, ingredientes)
      const qtd = vendas.find(v => v.prato_id === r.id)?.qtd ?? 0
      const recTotal = r.preco * qtd
      const custoTotal = custo * qtd
      const margem = recTotal - custoTotal
      return { ...r, custo, qtd, recTotal, custoTotal, margem }
    }), [receitas, receitaItens, ingredientes, vendas])

  const totais = rows.reduce((s, r) => ({
    qtd: s.qtd + r.qtd,
    recTotal: s.recTotal + r.recTotal,
    custoTotal: s.custoTotal + r.custoTotal,
    margem: s.margem + r.margem,
  }), { qtd: 0, recTotal: 0, custoTotal: 0, margem: 0 })

  const handleQtd = (prato_id, val) => {
    updateVenda(prato_id, Math.max(0, parseInt(val) || 0))
    setToast('Quantidade salva!')
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vendas do Periodo</h2>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                {['Prato','Categoria','Preco Venda','Custo Unit.','Qtd. Vendida','Receita Total','Custo Total','Margem'].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">Nenhum prato cadastrado.</td></tr>
              )}
              {rows.map((r, idx) => (
                <tr key={r.id} className={`border-t border-gray-100 dark:border-gray-700 ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/30'}`}>
                  <td className={`${TD} font-semibold text-gray-900 dark:text-white`}>{r.nome}</td>
                  <td className={TD}>{r.cat}</td>
                  <td className={TD}>{fmtR(r.preco)}</td>
                  <td className={TD}>{fmtR(r.custo)}</td>
                  <td className={TD}>
                    <input
                      type="number" min={0}
                      key={r.id + r.qtd}
                      defaultValue={r.qtd}
                      onBlur={e => handleQtd(r.id, e.target.value)}
                      className="w-24 px-2 py-1.5 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold text-sm text-center focus:outline-none"
                    />
                  </td>
                  <td className={TD}>{fmtR(r.recTotal)}</td>
                  <td className={TD}>{fmtR(r.custoTotal)}</td>
                  <td className={`${TD} font-bold ${r.margem >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {fmtR(r.margem)}
                  </td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-t-2 border-gray-200 dark:border-gray-600 font-semibold">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white" colSpan={4}>TOTAL</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{totais.qtd}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{fmtR(totais.recTotal)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{fmtR(totais.custoTotal)}</td>
                  <td className={`px-4 py-3 text-sm font-bold ${totais.margem >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {fmtR(totais.margem)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
