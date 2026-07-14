import { useMemo, useState } from 'react'
import useStore from '../store/useStore'
import { fmtR } from '../utils/formatters'
import { calcularCustoPrato } from '../utils/calculations'
import KpiCard from '../components/KpiCard'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'
import PageHeader from '../components/PageHeader'

const TH = 'px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap'
const TD = 'px-4 py-3 text-sm text-gray-700 dark:text-gray-300 align-middle'
const INPUT_CLS = 'w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50'
const LABEL_CLS = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5'

const CANAIS = [
  { id: 'salao',    label: 'Salao'    },
  { id: 'delivery', label: 'Delivery' },
  { id: 'ifood',    label: 'iFood'    },
  { id: 'eventos',  label: 'Eventos'  },
]
const canalLabel = (id) => CANAIS.find(c => c.id === id)?.label || id

const PERIODOS = [
  { id: 'dia',           label: 'Dia'          },
  { id: 'semana',        label: 'Semana'       },
  { id: 'mes',           label: 'Mes'          },
  { id: 'personalizado', label: 'Personalizado' },
]

function addDays(iso, n) {
  const dt = new Date(iso + 'T00:00:00')
  dt.setDate(dt.getDate() + n)
  return dt.toISOString().slice(0, 10)
}
function fmtData(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
function labelPeriodo(l) {
  if (l.periodo_tipo === 'dia') return fmtData(l.data_inicio)
  if (l.data_inicio === l.data_fim) return fmtData(l.data_inicio)
  return `${fmtData(l.data_inicio)} a ${fmtData(l.data_fim)}`
}

function LancarVendaModal({ onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10)
  const [canal, setCanal]   = useState('salao')
  const [valor, setValor]   = useState('')
  const [tipo, setTipo]     = useState('dia')
  const [dia, setDia]       = useState(today)
  const [semana, setSemana] = useState(today)
  const [mes, setMes]       = useState(today.slice(0, 7))
  const [ini, setIni]       = useState(today)
  const [fim, setFim]       = useState(today)

  const buildPeriodo = () => {
    if (tipo === 'dia')    return { data_inicio: dia, data_fim: dia }
    if (tipo === 'semana') return { data_inicio: semana, data_fim: addDays(semana, 6) }
    if (tipo === 'mes') {
      const [y, m] = mes.split('-').map(Number)
      const ultimo = new Date(y, m, 0).getDate()
      return { data_inicio: `${mes}-01`, data_fim: `${mes}-${String(ultimo).padStart(2, '0')}` }
    }
    return { data_inicio: ini, data_fim: fim }
  }

  const valorNum = parseFloat(valor) || 0
  const handleSave = () => {
    if (valorNum <= 0) return
    onSave({ canal, valor: valorNum, periodo_tipo: tipo, ...buildPeriodo() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-xl w-[480px] max-w-[90vw] max-h-[90vh] overflow-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Lancar Venda</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none cursor-pointer bg-transparent border-none">×</button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className={LABEL_CLS}>Valor de vendas (R$)</label>
            <input type="number" min={0} step="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" className={INPUT_CLS} autoFocus />
          </div>

          <div>
            <label className={LABEL_CLS}>Canal de venda</label>
            <div className="grid grid-cols-4 gap-2">
              {CANAIS.map(c => (
                <button key={c.id} onClick={() => setCanal(c.id)}
                  className={`py-2 rounded-lg text-sm font-semibold border transition-colors cursor-pointer ${canal === c.id ? 'border-primary bg-orange-50 dark:bg-orange-900/20 text-primary' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Periodo</label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PERIODOS.map(p => (
                <button key={p.id} onClick={() => setTipo(p.id)}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${tipo === p.id ? 'border-primary bg-orange-50 dark:bg-orange-900/20 text-primary' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  {p.label}
                </button>
              ))}
            </div>

            {tipo === 'dia' && (
              <input type="date" value={dia} onChange={e => setDia(e.target.value)} className={INPUT_CLS} />
            )}
            {tipo === 'semana' && (
              <div>
                <input type="date" value={semana} onChange={e => setSemana(e.target.value)} className={INPUT_CLS} />
                <div className="text-xs text-gray-400 mt-1">Semana: {fmtData(semana)} a {fmtData(addDays(semana, 6))}</div>
              </div>
            )}
            {tipo === 'mes' && (
              <input type="month" value={mes} onChange={e => setMes(e.target.value)} className={INPUT_CLS} />
            )}
            {tipo === 'personalizado' && (
              <div className="flex items-center gap-2">
                <input type="date" value={ini} onChange={e => setIni(e.target.value)} className={INPUT_CLS} />
                <span className="text-gray-400 text-sm">a</span>
                <input type="date" value={fim} onChange={e => setFim(e.target.value)} className={INPUT_CLS} />
              </div>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2.5 text-xs text-gray-600 dark:text-gray-300">
            Este valor sera somado a <strong>Receita Bruta ({canalLabel(canal)})</strong> no DRE. Voce ainda pode ajustar manualmente no DRE.
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <button onClick={onClose} className="px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={valorNum <= 0}
            className="px-5 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-600 transition-colors cursor-pointer disabled:opacity-50">
            Lancar venda
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Vendas() {
  const {
    receitas, receitaItens, ingredientes, vendas, updateVenda,
    vendasLancamentos, addVendaLancamento, deleteVendaLancamento, dre, updateDRE,
  } = useStore()
  const [toast, setToast] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  // Faturamento por canal (lancamentos)
  const porCanal = useMemo(() => {
    const acc = { salao: 0, delivery: 0, ifood: 0, eventos: 0 }
    vendasLancamentos.forEach(l => { acc[l.canal] = (acc[l.canal] || 0) + (l.valor || 0) })
    return acc
  }, [vendasLancamentos])
  const totalFat = porCanal.salao + porCanal.delivery + porCanal.ifood + porCanal.eventos

  const lancOrdenados = useMemo(
    () => [...vendasLancamentos].sort((a, b) => (b.data_inicio || '').localeCompare(a.data_inicio || '')),
    [vendasLancamentos]
  )

  // Vendas por prato (para CMV teorico)
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

  const handleSaveLanc = (data) => {
    addVendaLancamento({ id: `vl_${Date.now()}`, ...data })
    updateDRE({ [data.canal]: (dre[data.canal] || 0) + data.valor })
    setModalOpen(false)
    setToast('Venda lancada!')
  }

  const handleDeleteLanc = (l) => {
    deleteVendaLancamento(l.id)
    updateDRE({ [l.canal]: Math.max(0, (dre[l.canal] || 0) - (l.valor || 0)) })
    setConfirm(null)
    setToast('Lancamento removido!')
  }

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-6 max-w-7xl">
      <PageHeader title="Vendas">
        <button onClick={() => setModalOpen(true)}
          className="px-3 py-2 rounded-lg bg-primary text-white font-bold text-xs md:text-sm hover:bg-primary-600 transition-colors cursor-pointer">
          + Lancar Venda
        </button>
      </PageHeader>

      {/* Faturamento por canal */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Faturamento Total" value={fmtR(totalFat)} />
        {CANAIS.map(c => (
          <KpiCard key={c.id} label={c.label} value={fmtR(porCanal[c.id])} />
        ))}
      </div>

      {/* Lancamentos de faturamento */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <span className="font-semibold text-gray-900 dark:text-white text-sm">Lancamentos de Faturamento</span>
          <span className="text-xs text-gray-400 hidden sm:inline">alimenta a Receita Bruta do DRE</span>
        </div>

        {/* Mobile: cards */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
          {lancOrdenados.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              Nenhuma venda lancada. Use <span className="font-semibold text-primary">+ Lancar Venda</span>.
            </div>
          )}
          {lancOrdenados.map(l => (
            <div key={l.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-sm text-gray-900 dark:text-white">{labelPeriodo(l)}</div>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{canalLabel(l.canal)}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{fmtR(l.valor || 0)}</span>
                <button onClick={() => setConfirm(l)}
                  className="px-2.5 py-1.5 rounded-md border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs cursor-pointer">
                  ✕
                </button>
              </div>
            </div>
          ))}
          {lancOrdenados.length > 0 && (
            <div className="px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
              <span className="text-xs font-bold text-gray-900 dark:text-white">TOTAL</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{fmtR(totalFat)}</span>
            </div>
          )}
        </div>

        {/* Desktop: tabela */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                {['Periodo','Canal','Valor',''].map((h, i) => <th key={i} className={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {lancOrdenados.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                  Nenhuma venda lancada. Use <span className="font-semibold text-primary">+ Lancar Venda</span> para registrar o faturamento por canal e periodo.
                </td></tr>
              )}
              {lancOrdenados.map((l, idx) => (
                <tr key={l.id} className={`border-t border-gray-100 dark:border-gray-700 ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/30'}`}>
                  <td className={`${TD} font-medium text-gray-900 dark:text-white`}>{labelPeriodo(l)}</td>
                  <td className={TD}>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{canalLabel(l.canal)}</span>
                  </td>
                  <td className={`${TD} font-bold`}>{fmtR(l.valor || 0)}</td>
                  <td className={TD}>
                    <button onClick={() => setConfirm(l)}
                      className="px-3 py-1.5 rounded-md border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs hover:bg-red-100 transition-colors cursor-pointer">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {lancOrdenados.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-t-2 border-gray-200 dark:border-gray-600">
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white" colSpan={2}>TOTAL</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">{fmtR(totalFat)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Vendas por prato (CMV teorico) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
          <span className="font-semibold text-gray-900 dark:text-white text-sm">Vendas por Prato</span>
          <span className="ml-2 text-xs text-gray-400 hidden sm:inline">quantidades usadas no CMV teorico e na margem</span>
        </div>

        {/* Mobile: cards */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
          {rows.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">Nenhum prato cadastrado.</div>
          )}
          {rows.map(r => (
            <div key={r.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">{r.nome}</div>
                  <div className="text-xs text-gray-400">{r.cat} · {fmtR(r.preco)}</div>
                </div>
                <div className="shrink-0 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Qtd.</div>
                  <input
                    type="number" min={0}
                    key={r.id + r.qtd}
                    defaultValue={r.qtd}
                    onBlur={e => handleQtd(r.id, e.target.value)}
                    className="w-20 px-2 py-1.5 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold text-sm text-center focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-900/40 rounded-lg px-3 py-2">
                <span className="text-gray-500 dark:text-gray-400">Receita <strong className="text-gray-900 dark:text-white">{fmtR(r.recTotal)}</strong></span>
                <span className={`font-bold ${r.margem >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>Margem {fmtR(r.margem)}</span>
              </div>
            </div>
          ))}
          {rows.length > 0 && (
            <div className="px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
              <span className="text-xs font-bold text-gray-900 dark:text-white">TOTAL · {totais.qtd} un</span>
              <span className={`text-sm font-bold ${totais.margem >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{fmtR(totais.margem)}</span>
            </div>
          )}
        </div>

        {/* Desktop: tabela */}
        <div className="overflow-x-auto hidden md:block">
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

      {modalOpen && <LancarVendaModal onClose={() => setModalOpen(false)} onSave={handleSaveLanc} />}
      <ConfirmDialog
        isOpen={!!confirm}
        message="Excluir este lancamento de venda? O valor sera descontado da Receita do DRE."
        onConfirm={() => handleDeleteLanc(confirm)}
        onCancel={() => setConfirm(null)}
      />
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
