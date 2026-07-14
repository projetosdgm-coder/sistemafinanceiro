import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import { fmtR, fmtP } from '../utils/formatters'
import { calcularCustoFuncionario, calcularCMVReal, calcularDRE, MULT_CLT } from '../utils/calculations'
import { BENCHMARKS } from '../utils/benchmarks'
import Badge from '../components/Badge'
import KpiCard from '../components/KpiCard'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'
import ImportOverlay from '../components/ImportOverlay'
import LancamentoComprovante from './LancamentoComprovante'

const FUNC_FIELDS = [
  { name: 'nome',    label: 'Nome',         type: 'text',   required: true },
  { name: 'cargo',   label: 'Cargo',        type: 'text',   required: true },
  { name: 'regime',  label: 'Regime',       type: 'select', required: true, options: ['CLT','PJ'] },
  { name: 'salario', label: 'Salario Base', type: 'number', required: true, prefix: 'R$' },
]

const LANC_FIELDS = [
  { name: 'descricao', label: 'Descricao', type: 'text',   required: true, placeholder: 'Ex: Motoboy entrega, Comissao, Diaria...' },
  { name: 'valor',     label: 'Valor (R$)', type: 'number', required: true, prefix: 'R$' },
]

const TH = 'px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap'
const TD = 'px-4 py-3 text-sm text-gray-700 dark:text-gray-300 align-middle'

export default function CMO({ onNav }) {
  const {
    funcionarios, comprovantes, ingredientes, estoque, dre,
    addFuncionario, updateFuncionario, deleteFuncionario,
    addComprovante, deleteComprovante,
  } = useStore()

  const [modalFunc, setModalFunc]   = useState({ open: false, data: null })
  const [modalLanc, setModalLanc]   = useState(false)
  const [confirmFunc, setConfirmFunc] = useState(null)
  const [confirmLanc, setConfirmLanc] = useState(null)
  const [toast, setToast] = useState('')
  const [importOpen, setImportOpen] = useState(false)

  const cmoLancamentos = useMemo(() => comprovantes.filter(c => c.tipo === 'cmo'), [comprovantes])

  const totalFuncionarios = useMemo(
    () => funcionarios.reduce((s, f) => s + calcularCustoFuncionario(f), 0),
    [funcionarios]
  )
  const totalLancamentos = useMemo(
    () => cmoLancamentos.reduce((s, c) => s + (c.valor || 0), 0),
    [cmoLancamentos]
  )
  const cmo = totalFuncionarios + totalLancamentos

  const cmvReal    = useMemo(() => calcularCMVReal(estoque, ingredientes), [estoque, ingredientes])
  const dreResult  = useMemo(() => calcularDRE(dre, cmvReal, cmo), [dre, cmvReal, cmo])
  const rl         = dreResult.rl || 1
  const cmoPct     = cmo / rl
  const status     = cmoPct <= BENCHMARKS.cmo.ideal ? 'saudavel' : cmoPct <= BENCHMARKS.cmo.atencao ? 'atencao' : 'critico'

  const handleSaveFunc = (data) => {
    const payload = { ...data, salario: parseFloat(data.salario) }
    if (modalFunc.data?.id) {
      updateFuncionario(modalFunc.data.id, payload)
      setToast('Colaborador atualizado!')
    } else {
      addFuncionario({ ...payload, id: `e${Date.now()}` })
      setToast('Colaborador adicionado!')
    }
    setModalFunc({ open: false, data: null })
  }

  const handleSaveLanc = (data) => {
    addComprovante({
      id: `comp_${Date.now()}`,
      tipo: 'cmo',
      descricao: data.descricao,
      valor: parseFloat(data.valor) || 0,
      data: null,
      categoria_nome: 'CMO',
    })
    setModalLanc(false)
    setToast('Lancamento adicionado!')
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">CMO — Custo de Mao de Obra</h2>
        <div className="flex gap-2">
          <button onClick={() => setImportOpen(true)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
            Importar Comprovante
          </button>
          <button onClick={() => setModalLanc(true)}
            className="px-4 py-2 rounded-lg border border-primary text-primary font-bold text-sm hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors cursor-pointer">
            + Lancamento Avulso
          </button>
          <button onClick={() => setModalFunc({ open: true, data: null })}
            className="px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-600 transition-colors cursor-pointer">
            + Novo Colaborador
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total CMO"              value={fmtR(cmo)} />
        <KpiCard label="% Rec. Liquida"         value={fmtP(cmoPct)} sub={<Badge status={status} />} />
        <KpiCard label="Colaboradores"          value={fmtR(totalFuncionarios)} />
        <KpiCard label="Lancamentos Avulsos"    value={fmtR(totalLancamentos)} />
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
        Encargos CLT aplicados: <strong>{fmtP(MULT_CLT - 1)}</strong> sobre o salario base (INSS + FGTS + ferias + 13o + outros). · Benchmark CMO: &lt;= <strong>{fmtP(BENCHMARKS.cmo.ideal)}</strong>
      </div>

      {/* Colaboradores */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <span className="font-semibold text-gray-900 dark:text-white text-sm">Colaboradores</span>
          <span className="text-xs text-gray-400">{fmtR(totalFuncionarios)}</span>
        </div>
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
                const enc   = f.regime === 'CLT' ? f.salario * (MULT_CLT - 1) : 0
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
                      <button onClick={() => setModalFunc({ open: true, data: f })}
                        className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                        Editar
                      </button>
                      <button onClick={() => setConfirmFunc(f.id)}
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
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white" colSpan={5}>Subtotal Colaboradores</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">{fmtR(totalFuncionarios)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Lancamentos Avulsos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <span className="font-semibold text-gray-900 dark:text-white text-sm">Lancamentos Avulsos</span>
            <span className="ml-2 text-xs text-gray-400">motoboy, comissao, diaria, freelancer...</span>
          </div>
          <span className="text-xs text-gray-400">{fmtR(totalLancamentos)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                {['Descricao','Data','Valor',''].map((h, i) => (
                  <th key={i} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cmoLancamentos.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                    Nenhum lancamento avulso. Use <span className="font-semibold text-primary">+ Lancamento Avulso</span> ou lance via comprovante.
                  </td>
                </tr>
              )}
              {cmoLancamentos.map((c, idx) => (
                <tr key={c.id} className={`border-t border-gray-100 dark:border-gray-700 ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/30'}`}>
                  <td className={`${TD} font-medium text-gray-900 dark:text-white`}>{c.descricao || '—'}</td>
                  <td className={TD}>{c.data || '—'}</td>
                  <td className={`${TD} font-bold`}>{fmtR(c.valor || 0)}</td>
                  <td className={TD}>
                    <button onClick={() => setConfirmLanc(c.id)}
                      className="px-3 py-1.5 rounded-md border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs hover:bg-red-100 transition-colors cursor-pointer">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {cmoLancamentos.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-t-2 border-gray-200 dark:border-gray-600">
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white" colSpan={2}>Subtotal Avulsos</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">{fmtR(totalLancamentos)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Total geral */}
      {(funcionarios.length > 0 || cmoLancamentos.length > 0) && (
        <div className="bg-gray-900 dark:bg-gray-950 rounded-xl px-5 py-4 flex items-center justify-between">
          <span className="text-white font-bold text-sm">TOTAL CMO</span>
          <div className="text-right">
            <div className="text-white font-bold text-xl">{fmtR(cmo)}</div>
            <div className="text-gray-400 text-xs">{fmtP(cmoPct)} da Rec. Liquida · <Badge status={status} /></div>
          </div>
        </div>
      )}

      <Modal isOpen={modalFunc.open} title={modalFunc.data ? 'Editar Colaborador' : 'Novo Colaborador'} fields={FUNC_FIELDS} initialData={modalFunc.data} onSave={handleSaveFunc} onClose={() => setModalFunc({ open: false, data: null })} />
      <Modal isOpen={modalLanc} title="Novo Lancamento Avulso" fields={LANC_FIELDS} initialData={null} onSave={handleSaveLanc} onClose={() => setModalLanc(false)} />

      <ConfirmDialog
        isOpen={!!confirmFunc}
        message="Excluir este colaborador?"
        onConfirm={() => { deleteFuncionario(confirmFunc); setConfirmFunc(null); setToast('Colaborador excluido!') }}
        onCancel={() => setConfirmFunc(null)}
      />
      <ConfirmDialog
        isOpen={!!confirmLanc}
        message="Excluir este lancamento?"
        onConfirm={() => { deleteComprovante(confirmLanc); setConfirmLanc(null); setToast('Lancamento excluido!') }}
        onCancel={() => setConfirmLanc(null)}
      />
      <Toast message={toast} onDone={() => setToast('')} />

      <ImportOverlay open={importOpen} onClose={() => setImportOpen(false)}>
        <LancamentoComprovante onNav={(dest) => { setImportOpen(false); onNav?.(dest) }} />
      </ImportOverlay>
    </div>
  )
}
