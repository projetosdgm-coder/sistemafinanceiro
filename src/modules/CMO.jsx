import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import { fmtR, fmtP } from '../utils/formatters'
import { calcularCustoFuncionario, calcularCMO, calcularCMVReal, calcularDRE, MULT_CLT } from '../utils/calculations'
import { BENCHMARKS } from '../utils/benchmarks'
import Badge from '../components/Badge'
import KpiCard from '../components/KpiCard'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'

const FIELDS = [
  { name: 'nome',    label: 'Nome',         type: 'text',   required: true },
  { name: 'cargo',   label: 'Cargo',        type: 'text',   required: true },
  { name: 'regime',  label: 'Regime',       type: 'select', required: true, options: ['CLT','PJ'] },
  { name: 'salario', label: 'Salario Base', type: 'number', required: true, prefix: 'R$' },
]

const TH = 'px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap'
const TD = 'px-4 py-3 text-sm text-gray-700 dark:text-gray-300 align-middle'

export default function CMO() {
  const { funcionarios, ingredientes, estoque, dre, addFuncionario, updateFuncionario, deleteFuncionario } = useStore()
  const [modal, setModal] = useState({ open: false, data: null })
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState('')

  const cmo = useMemo(() => calcularCMO(funcionarios), [funcionarios])
  const cmvReal = useMemo(() => calcularCMVReal(estoque, ingredientes), [estoque, ingredientes])
  const dreResult = useMemo(() => calcularDRE(dre, cmvReal, cmo), [dre, cmvReal, cmo])
  const rl = dreResult.rl || 1
  const cmoPct = cmo / rl
  const status = cmoPct <= BENCHMARKS.cmo.ideal ? 'saudavel' : cmoPct <= BENCHMARKS.cmo.atencao ? 'atencao' : 'critico'

  const handleSave = (data) => {
    const payload = { ...data, salario: parseFloat(data.salario) }
    if (modal.data?.id) { updateFuncionario(modal.data.id, payload); setToast('Colaborador atualizado!') }
    else { addFuncionario({ ...payload, id: `e${Date.now()}` }); setToast('Colaborador adicionado!') }
    setModal({ open: false, data: null })
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">CMO — Custo de Mao de Obra</h2>
        <button onClick={() => setModal({ open: true, data: null })}
          className="px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-600 transition-colors cursor-pointer">
          + Novo Colaborador
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total CMO"       value={fmtR(cmo)} />
        <KpiCard label="% Rec. Liquida"  value={fmtP(cmoPct)} sub={<Badge status={status} />} />
        <KpiCard label="Ideal do setor"  value={`<= ${fmtP(BENCHMARKS.cmo.ideal)}`} />
        <KpiCard label="Colaboradores"   value={funcionarios.length} />
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
        Encargos CLT aplicados: <strong>{fmtP(MULT_CLT - 1)}</strong> sobre o salario base (INSS + FGTS + ferias + 13o + outros).
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                {['Nome','Cargo','Regime','Salario Base','Encargos','Custo Total','Acoes'].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {funcionarios.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">Nenhum colaborador cadastrado.</td></tr>
              )}
              {funcionarios.map((f, idx) => {
                const enc = f.regime === 'CLT' ? f.salario * (MULT_CLT - 1) : 0
                const total = calcularCustoFuncionario(f)
                return (
                  <tr key={f.id} className={`border-t border-gray-100 dark:border-gray-700 ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/30'}`}>
                    <td className={`${TD} font-medium text-gray-900 dark:text-white`}>{f.nome}</td>
                    <td className={TD}>{f.cargo}</td>
                    <td className={TD}>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${f.regime === 'CLT' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
                        {f.regime}
                      </span>
                    </td>
                    <td className={TD}>{fmtR(f.salario)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 align-middle">{fmtR(enc)}</td>
                    <td className={`${TD} font-bold text-gray-900 dark:text-white`}>{fmtR(total)}</td>
                    <td className={`${TD} flex gap-2`}>
                      <button onClick={() => setModal({ open: true, data: f })}
                        className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                        Editar
                      </button>
                      <button onClick={() => setConfirm(f.id)}
                        className="px-3 py-1.5 rounded-md border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs hover:bg-red-100 transition-colors cursor-pointer">
                        Excluir
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {funcionarios.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-t-2 border-gray-200 dark:border-gray-600">
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white" colSpan={5}>TOTAL CMO</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">{fmtR(cmo)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <Modal isOpen={modal.open} title={modal.data ? 'Editar Colaborador' : 'Novo Colaborador'} fields={FIELDS} initialData={modal.data} onSave={handleSave} onClose={() => setModal({ open: false, data: null })} />
      <ConfirmDialog
        isOpen={!!confirm}
        message="Excluir este colaborador?"
        onConfirm={() => { deleteFuncionario(confirm); setConfirm(null); setToast('Colaborador excluido!') }}
        onCancel={() => setConfirm(null)}
      />
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
