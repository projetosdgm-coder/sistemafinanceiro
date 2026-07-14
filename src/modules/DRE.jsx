import { useMemo, useState } from 'react'
import useStore from '../store/useStore'
import { fmtR, fmtP } from '../utils/formatters'
import { calcularCMVReal, calcularCMO, calcularDRE } from '../utils/calculations'
import Toast from '../components/Toast'
import ImportOverlay from '../components/ImportOverlay'
import LancamentoComprovante from './LancamentoComprovante'
const loadPDF   = () => import('../utils/exportPDF')
const loadExcel = () => import('../utils/exportExcel')

const NUM_CLS = 'w-24 md:w-32 px-2 py-1.5 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold text-xs md:text-sm text-right focus:outline-none'
const PCT_CLS = 'w-16 md:w-20 px-2 py-1.5 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold text-xs md:text-sm text-right focus:outline-none'

function NumInput({ value, onChange }) {
  const display = value ? +parseFloat(value).toFixed(2) : 0
  return (
    <input type="number" min={0} step="0.01" defaultValue={display} key={display}
      onBlur={e => onChange(parseFloat(e.target.value) || 0)}
      className={NUM_CLS}
    />
  )
}

function PctInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 justify-end">
      <input type="number" min={0} max={1} step="0.001" defaultValue={(value * 100).toFixed(1)} key={value}
        onBlur={e => onChange(parseFloat(e.target.value) / 100 || 0)}
        className={PCT_CLS}
      />
      <span className="text-xs text-gray-400">%</span>
    </div>
  )
}

function SectionRow({ title }) {
  return (
    <tr className="bg-gray-50 dark:bg-gray-900/50">
      <td colSpan={4} className="px-2 md:px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</td>
    </tr>
  )
}

function Row({ label, value, rlCalc, rlReal, indent = 0, bold, positive, negative, input }) {
  const pct = rlCalc > 0 ? value / rlCalc : 0
  const colorCls = negative
    ? 'text-red-600 dark:text-red-400'
    : positive
    ? 'text-green-600 dark:text-green-400'
    : bold ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'

  return (
    <tr className="border-t border-gray-100 dark:border-gray-700">
      <td className={`px-2 md:px-4 py-2 text-xs md:text-sm ${bold ? 'font-bold' : ''} ${colorCls}`} style={{ paddingLeft: 8 + indent * 12 }}>
        {label}
      </td>
      <td className="px-2 md:px-4 py-2 text-right w-28 md:w-44">{input || null}</td>
      <td className={`px-2 md:px-4 py-2 text-xs md:text-sm text-right w-24 md:w-36 whitespace-nowrap ${bold ? 'font-bold' : ''} ${colorCls}`}>{fmtR(value)}</td>
      <td className="hidden sm:table-cell px-2 md:px-4 py-2 text-xs text-right text-gray-400 dark:text-gray-500 w-20">{rlReal > 0 ? fmtP(pct) : '—'}</td>
    </tr>
  )
}

export default function DRE({ onNav }) {
  const store = useStore()
  const { dre, ingredientes, estoque, funcionarios, comprovantes, updateDRE } = store
  const [toast, setToast] = useState('')
  const [importOpen, setImportOpen] = useState(false)

  const set = (field) => (val) => { updateDRE({ [field]: val }); setToast('DRE atualizada!') }

  const cmvReal = useMemo(() => calcularCMVReal(estoque, ingredientes), [estoque, ingredientes])
  const cmo     = useMemo(() => calcularCMO(funcionarios, comprovantes), [funcionarios, comprovantes])
  const r       = useMemo(() => calcularDRE(dre, cmvReal, cmo), [dre, cmvReal, cmo])
  const rlCalc  = r.rl || 1   // para divisao sem zero
  const rlReal  = r.rl        // para mostrar '—' quando sem receita

  const rl = { rlCalc, rlReal }

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-6 max-w-5xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">DRE — Demonstrativo de Resultado</h2>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <span className="hidden md:inline text-xs text-gray-400">Campos em <span className="text-blue-500 font-bold">azul</span> sao editaveis</span>
          <button onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs md:text-sm font-semibold rounded-lg border border-primary text-primary hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors cursor-pointer">
            Importar Comprovante
          </button>
          <button onClick={() => loadPDF().then(m => m.exportDREPDF(store, store.restaurante))}
            className="flex items-center gap-2 px-3 py-1.5 text-xs md:text-sm font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
            PDF
          </button>
          <button onClick={() => loadExcel().then(m => m.exportDREExcel(store))}
            className="flex items-center gap-2 px-3 py-1.5 text-xs md:text-sm font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
            Excel
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-900 dark:bg-gray-950">
                <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-bold text-white">DESCRICAO</th>
                <th className="px-2 md:px-4 py-3 text-right text-xs font-semibold text-gray-400 w-28 md:w-44">INPUT</th>
                <th className="px-2 md:px-4 py-3 text-right text-xs md:text-sm font-bold text-white w-24 md:w-36">VALOR</th>
                <th className="hidden sm:table-cell px-2 md:px-4 py-3 text-right text-xs font-semibold text-gray-400 w-20">% RL</th>
              </tr>
            </thead>
            <tbody>
              <SectionRow title="RECEITA BRUTA" />
              <Row label="Salao"    value={dre.salao||0}    {...rl} indent={1} input={<NumInput value={dre.salao||0}    onChange={set('salao')} />} />
              <Row label="Delivery" value={dre.delivery||0} {...rl} indent={1} input={<NumInput value={dre.delivery||0} onChange={set('delivery')} />} />
              <Row label="iFood"    value={dre.ifood||0}    {...rl} indent={1} input={<NumInput value={dre.ifood||0}    onChange={set('ifood')} />} />
              <Row label="Eventos"  value={dre.eventos||0}  {...rl} indent={1} input={<NumInput value={dre.eventos||0}  onChange={set('eventos')} />} />
              <Row label="RECEITA BRUTA TOTAL" value={r.rb} {...rl} bold />

              <SectionRow title="DEDUCOES" />
              <Row label={`Impostos (${fmtP(dre.imp_pct||0)})`} value={r.rb*(dre.imp_pct||0)} {...rl} indent={1} input={<PctInput value={dre.imp_pct||0} onChange={set('imp_pct')} />} />
              <Row label={`Taxas cartao (${fmtP(dre.taxa_pct||0)})`} value={r.rb*(dre.taxa_pct||0)} {...rl} indent={1} input={<PctInput value={dre.taxa_pct||0} onChange={set('taxa_pct')} />} />
              <Row label="Devolucoes" value={dre.dev||0} {...rl} indent={1} input={<NumInput value={dre.dev||0} onChange={set('dev')} />} />
              <Row label="TOTAL DEDUCOES" value={r.ded} {...rl} bold negative />

              <Row label="RECEITA LIQUIDA" value={r.rl} {...rl} bold />

              <SectionRow title="CMV — CUSTO DE MERCADORIA VENDIDA" />
              <Row label="CMV Real (do estoque)" value={cmvReal} {...rl} indent={1} />
              <Row label="LUCRO BRUTO" value={r.lb} {...rl} bold positive={r.lb >= 0} negative={r.lb < 0} />

              <SectionRow title="CMO — CUSTO DE MAO DE OBRA" />
              <Row label="Total CMO (calculado)" value={cmo} {...rl} indent={1} />

              <SectionRow title="DESPESAS OPERACIONAIS" />
              {[
                ['aluguel','Aluguel'],['energia','Energia'],['agua','Agua'],
                ['internet','Internet'],['marketing','Marketing'],['contabil','Contabilidade'],
                ['manut','Manutencao'],['seguros','Seguros'],['pdv','PDV / Sistema'],
                ['limpeza','Limpeza'],['outros','Outros'],
              ].map(([f, l]) => (
                <Row key={f} label={l} value={dre[f]||0} {...rl} indent={1} input={<NumInput value={dre[f]||0} onChange={set(f)} />} />
              ))}
              <Row label="TOTAL DESPESAS" value={r.desp} {...rl} bold />

              <Row label="EBITDA" value={r.ebitda} {...rl} bold positive={r.ebitda >= 0} negative={r.ebitda < 0} />

              <SectionRow title="AJUSTES ABAIXO DO EBITDA" />
              <Row label="Depreciacao"  value={dre.depre||0}    {...rl} indent={1} input={<NumInput value={dre.depre||0}    onChange={set('depre')} />} />
              <Row label="Juros"        value={dre.juros||0}    {...rl} indent={1} input={<NumInput value={dre.juros||0}    onChange={set('juros')} />} />
              <Row label="Parcelas"     value={dre.parcelas||0} {...rl} indent={1} input={<NumInput value={dre.parcelas||0} onChange={set('parcelas')} />} />
              <Row label="IR / CSLL"    value={dre.ir||0}       {...rl} indent={1} input={<NumInput value={dre.ir||0}       onChange={set('ir')} />} />
              <Row label="TOTAL AJUSTES" value={r.ajustes + (dre.ir||0)} {...rl} bold />

              <tr className={r.ll >= 0 ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'}>
                <td colSpan={4} className="h-1 p-0" />
              </tr>
              <Row label="LUCRO LIQUIDO" value={r.ll} {...rl} bold positive={r.ll >= 0} negative={r.ll < 0} />
            </tbody>
          </table>
        </div>
      </div>

      <Toast message={toast} onDone={() => setToast('')} />

      <ImportOverlay open={importOpen} onClose={() => setImportOpen(false)}>
        <LancamentoComprovante onNav={(dest) => { setImportOpen(false); onNav?.(dest) }} />
      </ImportOverlay>
    </div>
  )
}
