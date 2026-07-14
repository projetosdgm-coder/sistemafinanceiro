import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import { fmtR } from '../utils/formatters'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'
import PageHeader from '../components/PageHeader'

const FIELDS = [
  { name: 'nome',  label: 'Nome',       type: 'text',   required: true },
  { name: 'cat',   label: 'Categoria',  type: 'text',   required: true, placeholder: 'ex: Proteinas' },
  { name: 'un',    label: 'Unidade',    type: 'select', required: true, options: ['kg','un','L','g','ml','cx','pct'] },
  { name: 'preco', label: 'Preco (R$)', type: 'number', required: true, prefix: 'R$' },
  { name: 'forn',  label: 'Fornecedor', type: 'text' },
]

const TH = 'px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap'
const TD = 'px-4 py-3 text-sm text-gray-700 dark:text-gray-300 align-middle'

export default function Ingredientes() {
  const { ingredientes, addIngrediente, updateIngrediente, deleteIngrediente } = useStore()
  const [modal, setModal] = useState({ open: false, data: null })
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState('')
  const [busca, setBusca] = useState('')

  const filtrados = useMemo(() =>
    ingredientes.filter(i =>
      i.nome.toLowerCase().includes(busca.toLowerCase()) ||
      i.cat?.toLowerCase().includes(busca.toLowerCase())
    ), [ingredientes, busca])

  const handleSave = (data) => {
    if (modal.data?.id) {
      updateIngrediente(modal.data.id, data)
      setToast('Ingrediente atualizado!')
    } else {
      addIngrediente({ ...data, id: `i${Date.now()}` })
      setToast('Ingrediente adicionado!')
    }
    setModal({ open: false, data: null })
  }

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-6 max-w-7xl">
      <PageHeader title="Ingredientes">
        <button onClick={() => setModal({ open: true, data: null })} className="px-3 py-2 rounded-lg bg-primary text-white font-bold text-xs md:text-sm hover:bg-primary-600 transition-colors cursor-pointer">
          + Novo Ingrediente
        </button>
      </PageHeader>

      <input
        value={busca}
        onChange={e => setBusca(e.target.value)}
        placeholder="Buscar por nome ou categoria..."
        className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 w-full md:w-72"
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">

        {/* Mobile: cards */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
          {filtrados.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">Nenhum ingrediente encontrado.</div>
          )}
          {filtrados.map(ing => (
            <div key={ing.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">{ing.nome}</div>
                <div className="text-xs text-gray-400 truncate">{ing.cat}{ing.forn ? ` · ${ing.forn}` : ''}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right mr-1">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{fmtR(ing.preco)}</div>
                  <div className="text-[10px] text-gray-400">por {ing.un}</div>
                </div>
                <button onClick={() => setModal({ open: true, data: ing })}
                  className="px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs cursor-pointer">
                  Editar
                </button>
                <button onClick={() => setConfirm(ing.id)}
                  className="px-2.5 py-1.5 rounded-md border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs cursor-pointer">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: tabela */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                {['Nome','Categoria','Unidade','Preco Unit.','Fornecedor','Acoes'].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">Nenhum ingrediente encontrado.</td></tr>
              )}
              {filtrados.map((ing, idx) => (
                <tr key={ing.id} className={`border-t border-gray-100 dark:border-gray-700 ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/30'}`}>
                  <td className={`${TD} font-medium text-gray-900 dark:text-white`}>{ing.nome}</td>
                  <td className={TD}>{ing.cat}</td>
                  <td className={TD}>{ing.un}</td>
                  <td className={TD}>{fmtR(ing.preco)}</td>
                  <td className={TD}>{ing.forn || '—'}</td>
                  <td className={`${TD} flex gap-2`}>
                    <button onClick={() => setModal({ open: true, data: ing })} className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                      Editar
                    </button>
                    <button onClick={() => setConfirm(ing.id)} className="px-3 py-1.5 rounded-md border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700">
          {filtrados.length} ingrediente(s)
        </div>
      </div>

      <Modal
        isOpen={modal.open}
        title={modal.data ? 'Editar Ingrediente' : 'Novo Ingrediente'}
        fields={FIELDS}
        initialData={modal.data}
        onSave={handleSave}
        onClose={() => setModal({ open: false, data: null })}
      />
      <ConfirmDialog
        isOpen={!!confirm}
        onConfirm={() => { deleteIngrediente(confirm); setConfirm(null); setToast('Ingrediente excluido!') }}
        onCancel={() => setConfirm(null)}
      />
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
