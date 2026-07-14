import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import { fmtR, fmtN } from '../utils/formatters'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'
import ImportOverlay from '../components/ImportOverlay'
import PageHeader from '../components/PageHeader'
import LancamentoNF from './LancamentoNF'

const TH = 'px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap'
const TD = 'px-4 py-3 text-sm text-gray-700 dark:text-gray-300 align-middle'
const NUM_INPUT = 'w-24 px-2 py-1.5 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold text-sm text-center focus:outline-none'

export default function Estoque({ onNav }) {
  const { estoque, ingredientes, addEstoque, updateEstoque, deleteEstoque } = useStore()
  const [modal, setModal] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState('')
  const [importOpen, setImportOpen] = useState(false)

  const ingNoCadastro = ingredientes.filter(i => !estoque.find(e => e.ing_id === i.id))
  const ingOptions = ingNoCadastro.map(i => ({ value: i.id, label: `${i.nome} (${i.un})` }))

  const addFields = [
    { name: 'ing_id',  label: 'Ingrediente', type: 'select', required: true, options: ingOptions },
    { name: 'ei',      label: 'Est. Inicial', type: 'number', default: 0 },
    { name: 'compras', label: 'Compras',      type: 'number', default: 0 },
    { name: 'ef',      label: 'Est. Final',   type: 'number', default: 0 },
  ]

  const rows = useMemo(() =>
    estoque.map(e => {
      const ing = ingredientes.find(x => x.id === e.ing_id)
      const consumo = (e.ei || 0) + (e.compras || 0) - (e.ef || 0)
      const custo = consumo * (ing?.preco || 0)
      return { ...e, ing, consumo, custo }
    }).filter(r => r.ing), [estoque, ingredientes])

  const totalCusto = rows.reduce((s, r) => s + r.custo, 0)

  const handleAdd = (data) => {
    addEstoque({ ing_id: data.ing_id, ei: +data.ei, compras: +data.compras, ef: +data.ef })
    setModal(false)
    setToast('Ingrediente adicionado ao estoque!')
  }

  const handleCell = (ing_id, field, val) => updateEstoque(ing_id, { [field]: parseFloat(val) || 0 })

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-6 max-w-7xl">
      <PageHeader title="Estoque">
        <button onClick={() => setImportOpen(true)}
          className="px-3 py-2 rounded-lg border border-primary text-primary font-bold text-xs md:text-sm hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors cursor-pointer">
          Importar Nota / Comprovante
        </button>
        <button onClick={() => setModal(true)} disabled={ingOptions.length === 0}
          className="px-3 py-2 rounded-lg bg-primary text-white font-bold text-xs md:text-sm hover:bg-primary-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          + Adicionar ao Estoque
        </button>
      </PageHeader>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">

        {/* Mobile: cards */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
          {rows.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">Nenhum item no estoque.</div>
          )}
          {rows.map(r => (
            <div key={r.ing_id} className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">{r.ing.nome}</div>
                  <div className="text-xs text-gray-400">{r.ing.un} · {fmtR(r.ing.preco)}/un</div>
                </div>
                <button onClick={() => setConfirm(r.ing_id)}
                  className="shrink-0 px-2.5 py-1.5 rounded-md border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs cursor-pointer">
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[['ei', 'Est. Inicial'], ['compras', 'Compras'], ['ef', 'Est. Final']].map(([field, label]) => (
                  <div key={field}>
                    <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 text-center">{label}</div>
                    <input
                      type="number" min={0} step="any"
                      key={r.ing_id + field + r[field]}
                      defaultValue={r[field]}
                      onBlur={e => handleCell(r.ing_id, field, e.target.value)}
                      className="w-full px-1 py-1.5 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold text-sm text-center focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-900/40 rounded-lg px-3 py-2">
                <span className="text-gray-500 dark:text-gray-400">Consumo: <strong className="text-gray-900 dark:text-white">{fmtN(r.consumo)}</strong></span>
                <span className="text-gray-500 dark:text-gray-400">Custo: <strong className="text-gray-900 dark:text-white">{fmtR(r.custo)}</strong></span>
              </div>
            </div>
          ))}
          {rows.length > 0 && (
            <div className="px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
              <span className="text-xs font-bold text-gray-900 dark:text-white">CUSTO TOTAL (CMV Real)</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{fmtR(totalCusto)}</span>
            </div>
          )}
        </div>

        {/* Desktop: tabela */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                {['Ingrediente','Unid.','Est. Inicial','Compras','Est. Final','Consumo','Preco Unit.','Custo Total',''].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">Nenhum item no estoque.</td></tr>
              )}
              {rows.map((r, idx) => (
                <tr key={r.ing_id} className={`border-t border-gray-100 dark:border-gray-700 ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/30'}`}>
                  <td className={`${TD} font-medium text-gray-900 dark:text-white`}>{r.ing.nome}</td>
                  <td className={TD}>{r.ing.un}</td>
                  {['ei','compras','ef'].map(field => (
                    <td key={field} className={TD}>
                      <input
                        type="number" min={0} step="any"
                        key={r.ing_id + field + r[field]}
                        defaultValue={r[field]}
                        onBlur={e => handleCell(r.ing_id, field, e.target.value)}
                        className={NUM_INPUT}
                      />
                    </td>
                  ))}
                  <td className={TD}>{fmtN(r.consumo)}</td>
                  <td className={TD}>{fmtR(r.ing.preco)}</td>
                  <td className={`${TD} font-bold text-gray-900 dark:text-white`}>{fmtR(r.custo)}</td>
                  <td className={TD}>
                    <button onClick={() => setConfirm(r.ing_id)} className="px-3 py-1.5 rounded-md border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-t-2 border-gray-200 dark:border-gray-600">
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white" colSpan={7}>CUSTO TOTAL (CMV Real)</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">{fmtR(totalCusto)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <Modal isOpen={modal} title="Adicionar Ingrediente ao Estoque" fields={addFields} onSave={handleAdd} onClose={() => setModal(false)} />
      <ConfirmDialog
        isOpen={!!confirm}
        message="Remover este ingrediente do estoque?"
        onConfirm={() => { deleteEstoque(confirm); setConfirm(null); setToast('Removido!') }}
        onCancel={() => setConfirm(null)}
      />
      <Toast message={toast} onDone={() => setToast('')} />

      <ImportOverlay open={importOpen} onClose={() => setImportOpen(false)}>
        <LancamentoNF onNav={(dest) => { setImportOpen(false); onNav?.(dest) }} />
      </ImportOverlay>
    </div>
  )
}
