import { useMemo } from "react"
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine,
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, Activity, FileDown } from "lucide-react"
import useStore from "../store/useStore"
import KpiCard from "../components/KpiCard"
import SectionCard from "../components/SectionCard"
import Badge from "../components/Badge"
import { calcularDRE, calcularCMVReal, calcularCMVTeorico, calcularCMO } from "../utils/calculations"
import { fmtR, fmtP } from "../utils/formatters"
import { BENCHMARKS } from "../utils/benchmarks"

const loadPDF = () => import("../utils/exportPDF")

function statusBench(v, b) {
  if (b.inv) return v >= b.ideal ? "saudavel" : v >= b.atencao ? "atencao" : "critico"
  return v <= b.ideal ? "saudavel" : v <= b.atencao ? "atencao" : "critico"
}

const PIE_RECEITA_COLORS = ["#F97316", "#FB923C", "#FDBA74", "#FED7AA"]
const PIE_CUSTO_COLORS   = ["#DC2626", "#D97706", "#6B7280", "#16A34A"]

function PctTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-sm">
      <div className="font-semibold text-gray-800 dark:text-white">{name}</div>
      <div className="text-gray-600 dark:text-gray-400">{fmtR(value)}</div>
    </div>
  )
}

function BenchTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <div className="font-semibold mb-1 text-gray-800 dark:text-white">{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.fill }} className="flex gap-2">
          <span>{p.name}:</span><span>{fmtP(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const store = useStore()
  const { ingredientes, receitas, receitaItens, vendas, estoque, funcionarios, dre } = store

  const { cmvReal, cmvTeorico, cmo, r } = useMemo(() => {
    const cmvReal   = calcularCMVReal(estoque, ingredientes)
    const cmvTeorico = calcularCMVTeorico(receitas, receitaItens, vendas, ingredientes)
    const cmo       = calcularCMO(funcionarios)
    const r         = calcularDRE(dre, cmvReal, cmo)
    return { cmvReal, cmvTeorico, cmo, r }
  }, [ingredientes, receitas, receitaItens, vendas, estoque, funcionarios, dre])

  const rlSafe    = r.rl || 1
  const variancia = r.rl > 0 ? Math.abs(cmvReal - cmvTeorico) / r.rl : 0

  /* --- Chart data --- */
  const receitaData = [
    { name: "Salao",    value: dre.salao    || 0 },
    { name: "Delivery", value: dre.delivery || 0 },
    { name: "iFood",    value: dre.ifood    || 0 },
    { name: "Eventos",  value: dre.eventos  || 0 },
  ].filter(d => d.value > 0)

  const lucroVal = Math.max(r.ll, 0)
  const custoData = [
    { name: "CMV",        value: cmvReal },
    { name: "CMO",        value: cmo     },
    { name: "Despesas Op.", value: r.desp },
    { name: "Lucro",      value: lucroVal },
  ].filter(d => d.value > 0)

  const benchData = [
    { name: "CMV",       atual: cmvReal / rlSafe, ideal: BENCHMARKS.cmv.ideal,     inv: false },
    { name: "CMO",       atual: cmo / rlSafe,     ideal: BENCHMARKS.cmo.ideal,     inv: false },
    { name: "Aluguel",   atual: (dre.aluguel||0) / rlSafe, ideal: BENCHMARKS.aluguel.ideal, inv: false },
    { name: "EBITDA",    atual: r.ebitda / rlSafe, ideal: BENCHMARKS.ebitda.ideal, inv: true  },
    { name: "Liq.",      atual: r.ll / rlSafe,     ideal: BENCHMARKS.ll.ideal,     inv: true  },
  ]

  const hasData = r.rb > 0

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        <button
          onClick={() => loadPDF().then(m => m.exportDashboardPDF(store, store.restaurante))}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <FileDown size={15} /> Exportar PDF
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Receita Bruta"
          value={fmtR(r.rb)}
          icon={<DollarSign size={16} />}
        />
        <KpiCard
          label="Receita Liquida"
          value={fmtR(r.rl)}
          sub={r.rb > 0 ? `${fmtP(r.rl/r.rb)} da bruta` : undefined}
          icon={<TrendingUp size={16} />}
        />
        <KpiCard
          label="EBITDA"
          value={fmtR(r.ebitda)}
          sub={`Margem: ${fmtP(r.ebitda/rlSafe)}`}
          negative={r.ebitda < 0}
          icon={<Activity size={16} />}
        />
        <KpiCard
          label="Lucro Liquido"
          value={fmtR(r.ll)}
          sub={`Margem: ${fmtP(r.ll/rlSafe)}`}
          negative={r.ll < 0}
          icon={<TrendingDown size={16} />}
        />
      </div>

      {/* Charts row */}
      {hasData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Donut: Receita Bruta */}
          {receitaData.length > 0 && (
            <SectionCard title="Composicao da Receita Bruta">
              <div className="p-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={receitaData}
                      cx="50%" cy="50%"
                      innerRadius="55%" outerRadius="80%"
                      dataKey="value" paddingAngle={2}
                    >
                      {receitaData.map((_, i) => (
                        <Cell key={i} fill={PIE_RECEITA_COLORS[i % PIE_RECEITA_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PctTooltip />} />
                    <Legend iconType="circle" iconSize={8}
                      formatter={v => <span className="text-xs text-gray-600 dark:text-gray-400">{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          )}

          {/* Donut: Distribuicao de Custos */}
          {custoData.length > 0 && (
            <SectionCard title="Distribuicao de Custos vs Lucro">
              <div className="p-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={custoData}
                      cx="50%" cy="50%"
                      innerRadius="55%" outerRadius="80%"
                      dataKey="value" paddingAngle={2}
                    >
                      {custoData.map((_, i) => (
                        <Cell key={i} fill={PIE_CUSTO_COLORS[i % PIE_CUSTO_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PctTooltip />} />
                    <Legend iconType="circle" iconSize={8}
                      formatter={v => <span className="text-xs text-gray-600 dark:text-gray-400">{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-10 text-center">
          <div className="text-4xl mb-3">📊</div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            Preencha a DRE com as receitas do mes para visualizar os graficos.
          </div>
        </div>
      )}

      {/* Benchmark bar chart */}
      <SectionCard title="Indicadores vs Benchmark (% Rec. Liquida)">
        <div className="p-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={benchData} layout="vertical" margin={{ left: 56, right: 24, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
              <XAxis type="number" tickFormatter={v => fmtP(v)} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={52} />
              <Tooltip content={<BenchTooltip />} />
              <Legend iconSize={8}
                formatter={v => <span className="text-xs text-gray-600 dark:text-gray-400">{v}</span>}
              />
              <Bar name="Atual"  dataKey="atual"  fill="#F97316" radius={[0, 3, 3, 0]} barSize={10} />
              <Bar name="Ideal"  dataKey="ideal"  fill="#D1D5DB" radius={[0, 3, 3, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* Benchmark table */}
      <SectionCard title="Status dos Indicadores">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                {["INDICADOR","ATUAL","IDEAL","STATUS"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: BENCHMARKS.cmv.label,       v: cmvReal/rlSafe,               b: BENCHMARKS.cmv       },
                { label: BENCHMARKS.cmo.label,       v: cmo/rlSafe,                   b: BENCHMARKS.cmo       },
                { label: BENCHMARKS.aluguel.label,   v: (dre.aluguel||0)/rlSafe,      b: BENCHMARKS.aluguel   },
                { label: BENCHMARKS.ebitda.label,    v: r.ebitda/rlSafe,              b: BENCHMARKS.ebitda    },
                { label: BENCHMARKS.ll.label,        v: r.ll/rlSafe,                  b: BENCHMARKS.ll        },
                { label: BENCHMARKS.variancia.label, v: variancia,                    b: BENCHMARKS.variancia },
              ].map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900/30"}>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{row.label}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-white">{fmtP(row.v)}</td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                    {row.b.inv ? `>= ${fmtP(row.b.ideal)}` : `<= ${fmtP(row.b.ideal)}`}
                  </td>
                  <td className="px-4 py-2.5"><Badge status={statusBench(row.v, row.b)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* CMV boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "CMV TEORICO (Vendas)",    v: cmvTeorico,                    sub: `${fmtP(cmvTeorico/rlSafe)} da Rec. Liq.` },
          { label: "CMV REAL (Estoque)",      v: cmvReal,                       sub: `${fmtP(cmvReal/rlSafe)} da Rec. Liq.` },
          { label: "VARIANCIA (Desperdicio)", v: Math.abs(cmvReal-cmvTeorico),  sub: `${fmtP(variancia)} da Rec. Liq.` },
        ].map(({ label, v, sub }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{label}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{fmtR(v)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</div>
          </div>
        ))}
      </div>

    </div>
  )
}
