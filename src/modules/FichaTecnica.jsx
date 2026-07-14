import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import { fmtR, fmtP } from '../utils/formatters'
import { calcularCustoPrato } from '../utils/calculations'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'
import ImportOverlay from '../components/ImportOverlay'
import LancamentoFichaTecnica from './LancamentoFichaTecnica'

const PRATO_FIELDS = [
  { name: 'nome',  label: 'Nome do Prato',  type: 'text',   required: true },
  { name: 'cat',   label: 'Categoria',      type: 'text',   required: true },
  { name: 'preco', label: 'Preco de Venda', type: 'number', required: true, prefix: 'R$' },
]

const TH = 'px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap'
const TD = 'px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 align-middle'

export default function FichaTecnica({ onNav }) {
  const { receitas, receitaItens, ingredientes,
          addReceita, updateReceita, deleteReceita,
          addReceitaItem, updateReceitaItem, deleteReceitaItem } = useStore()

  const [pratModal, setPratModal] = useState({ open: false, data: null })
  const [ingModal, setIngModal] = useState({ open: false, prato_id: null })
  const [expanded, setExpanded] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState('')
  const [importOpen, setImportOpen] = useState(false)

  const ingOptions = ingredientes.map(i => ({ value: i.id, label: `${i.nome} (${i.un})` }))
  const ingFields = [
    { name: 'ing_id', label: 'Ingrediente', type: 'select', required: true, options: ingOptions },
    { name: 'qtd',    label: 'Quantidade',  type: 'number', required: true },
  ]

  const handleSavePrato = (data) => {
    if (pratModal.data?.id) { updateReceita(pratModal.data.id, data); setToast('Prato atualizado!') }
    else { addReceita({ ...data, id: `r${Date.now()}` }); setToast('Prato adicionado!') }
    setPratModal({ open: false, data: null })
  }

  const handleSaveIng = (data) => {
    const existing = receitaItens.find(x => x.prato_id === ingModal.prato_id && x.ing_id === data.ing_id)
    if (existing) updateReceitaItem(ingModal.prato_id, data.ing_id, { qtd: parseFloat(data.qtd) })
    else addReceitaItem({ prato_id: ingModal.prato_id, ing_id: data.ing_id, qtd: parseFloat(data.qtd) })
    setToast('Ingrediente salvo!')
    setIngModal({ open: false, prato_id: null })
  }

  const handleDeletePrato = () => {
    deleteReceita(confirm.id)
    if (expanded === confirm.id) setExpanded(null)
    setConfirm(null)
    setToast('Prato excluido!')
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ficha Tecnica</h2>
        <div className="flex gap-2">
          <button onClick={() => setImportOpen(true)}
            className="px-4 py-2 rounded-lg border border-primary text-primary font-bold text-sm hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors cursor-pointer">
            Importar por IA
          </button>
          <button onClick={() => setPratModal({ open: true, data: null })}
            className="px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-600 transition-colors cursor-pointer">
            + Novo Prato
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {receitas.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">Nenhum prato cadastrado.</div>
        )}
        {receitas.map(prato => {
          const custo = calcularCustoPrato(prato.id, receitaItens, ingredientes)
          const margem = prato.preco > 0 ? (prato.preco - custo) / prato.preco : 0
          const itens = receitaItens.filter(x => x.prato_id === prato.id)
          const isOpen = expanded === prato.id

          return (
            <div key={prato.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div
                className="flex items-center px-5 py-4 cursor-pointer gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => setExpanded(isOpen ? null : prato.id)}
              >
                <span className="text-gray-400 dark:text-gray-500 text-sm w-4">{isOpen ? '▼' : '▶'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 dark:text-white text-sm">{prato.nome}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{prato.cat}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-400">Custo</div>
                  <div className="font-bold text-sm text-gray-900 dark:text-white">{fmtR(custo)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-400">Venda</div>
                  <div className="font-bold text-sm text-green-600 dark:text-green-400">{fmtR(prato.preco)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-400">Margem</div>
                  <div className={`font-bold text-sm ${margem >= 0.5 ? 'text-green-600 dark:text-green-400' : 'text-primary'}`}>
                    {fmtP(margem)}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setPratModal({ open: true, data: prato })}
                    className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                    Editar
                  </button>
                  <button onClick={() => setConfirm({ id: prato.id, nome: prato.nome })}
                    className="px-3 py-1.5 rounded-md border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs hover:bg-red-100 transition-colors cursor-pointer">
                    Excluir
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ingredientes</span>
                    <button onClick={() => setIngModal({ open: true, prato_id: prato.id })}
                      className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                      + Adicionar Ingrediente
                    </button>
                  </div>
                  {itens.length === 0 && (
                    <div className="text-sm text-gray-400 dark:text-gray-500 py-2">Nenhum ingrediente adicionado.</div>
                  )}
                  {itens.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-900/50">
                            {['Ingrediente','Unid.','Qtd.','Preco Unit.','Custo',''].map(h => (
                              <th key={h} className={TH}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {itens.map(item => {
                            const ing = ingredientes.find(x => x.id === item.ing_id)
                            if (!ing) return null
                            const custoItem = ing.preco * item.qtd
                            return (
                              <tr key={item.ing_id} className="border-t border-gray-100 dark:border-gray-700">
                                <td className={TD}>{ing.nome}</td>
                                <td className={TD}>{ing.un}</td>
                                <td className={TD}>{item.qtd}</td>
                                <td className={TD}>{fmtR(ing.preco)}</td>
                                <td className={TD}>{fmtR(custoItem)}</td>
                                <td className={TD}>
                                  <button
                                    onClick={() => { deleteReceitaItem(prato.id, item.ing_id); setToast('Removido!') }}
                                    className="px-2 py-1 rounded border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-500 text-xs hover:bg-red-100 transition-colors cursor-pointer">
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Modal isOpen={pratModal.open} title={pratModal.data ? 'Editar Prato' : 'Novo Prato'} fields={PRATO_FIELDS} initialData={pratModal.data} onSave={handleSavePrato} onClose={() => setPratModal({ open: false, data: null })} />
      <Modal isOpen={ingModal.open} title="Adicionar Ingrediente ao Prato" fields={ingFields} onSave={handleSaveIng} onClose={() => setIngModal({ open: false, prato_id: null })} />
      <ConfirmDialog
        isOpen={!!confirm}
        message={`Excluir o prato "${confirm?.nome}"? Esta acao removera todos os ingredientes da ficha.`}
        onConfirm={handleDeletePrato}
        onCancel={() => setConfirm(null)}
      />
      <Toast message={toast} onDone={() => setToast('')} />

      <ImportOverlay open={importOpen} onClose={() => setImportOpen(false)}>
        <LancamentoFichaTecnica onNav={(dest) => { setImportOpen(false); onNav?.(dest) }} />
      </ImportOverlay>
    </div>
  )
}
