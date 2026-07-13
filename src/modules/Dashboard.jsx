import { useMemo } from 'react'
import useStore from '../store/useStore'
import { C } from '../styles/tokens'
import { calcularDRE, calcularCMVReal, calcularCMVTeorico, calcularCMO } from '../utils/calculations'
import { fmtR, fmtP } from '../utils/formatters'
import { BENCHMARKS } from '../utils/benchmarks'
import Badge from '../components/Badge'
const loadExportPDF = () => import('../utils/exportPDF')

function statusBench(v, b) {
  if (b.inv) return v >= b.ideal ? 'saudavel' : v >= b.atencao ? 'atencao' : 'critico'
  return v <= b.ideal ? 'saudavel' : v <= b.atencao ? 'atencao' : 'critico'
}

function KPICard({ label, value, sub }) {
  return (
    <div style={{
      background: C.branco, borderRadius: 10, padding: '20px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', flex: 1, minWidth: 180,
    }}>
      <div style={{ fontSize: 12, color: C.cinza3, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: C.preto }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.cinza3, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function BenchRow({ label, value, benchmark, idx }) {
  const pct = fmtP(value)
  const status = statusBench(value, benchmark)
  return (
    <tr style={{ borderTop: `1px solid ${C.cinza2}`, background: idx % 2 === 0 ? C.branco : '#FAFAFA' }}>
      <td style={{ padding: '10px 16px', fontSize: 13 }}>{label}</td>
      <td style={{ padding: '10px 16px', fontSize: 14, fontWeight: 600 }}>{pct}</td>
      <td style={{ padding: '10px 16px', fontSize: 13, color: C.cinza3 }}>
        {benchmark.inv ? `≥ ${fmtP(benchmark.ideal)}` : `≤ ${fmtP(benchmark.ideal)}`}
      </td>
      <td style={{ padding: '10px 16px' }}><Badge status={status} /></td>
    </tr>
  )
}

export default function Dashboard() {
  const { ingredientes, receitas, receitaItens, vendas, estoque, funcionarios, dre } = useStore()

  const { cmvReal, cmvTeorico, cmo, dreResult } = useMemo(() => {
    const cmvReal = calcularCMVReal(estoque, ingredientes)
    const cmvTeorico = calcularCMVTeorico(receitas, receitaItens, vendas, ingredientes)
    const cmo = calcularCMO(funcionarios)
    const dreResult = calcularDRE(dre, cmvReal, cmo)
    return { cmvReal, cmvTeorico, cmo, dreResult }
  }, [ingredientes, receitas, receitaItens, vendas, estoque, funcionarios, dre])

  const { rb, rl, ebitda, ll } = dreResult
  const rlSafe = rl || 1

  const variancia = rl > 0 ? Math.abs(cmvReal - cmvTeorico) / rl : 0

  const indicadores = [
    { label: BENCHMARKS.cmv.label,       value: cmvReal / rlSafe,    benchmark: BENCHMARKS.cmv },
    { label: BENCHMARKS.cmo.label,       value: cmo / rlSafe,        benchmark: BENCHMARKS.cmo },
    { label: BENCHMARKS.aluguel.label,   value: (dre.aluguel||0) / rlSafe, benchmark: BENCHMARKS.aluguel },
    { label: BENCHMARKS.ebitda.label,    value: ebitda / rlSafe,     benchmark: BENCHMARKS.ebitda },
    { label: BENCHMARKS.ll.label,        value: ll / rlSafe,         benchmark: BENCHMARKS.ll },
    { label: BENCHMARKS.variancia.label, value: variancia,           benchmark: BENCHMARKS.variancia },
  ]

  const store = useStore()

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>📊 Dashboard</h2>
        <button onClick={() => loadExportPDF().then(m => m.exportDashboardPDF(store, store.restaurante))} style={btnExport}>
          📄 Exportar PDF
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <KPICard label="Receita Bruta" value={fmtR(rb)} />
        <KPICard label="Receita Líquida" value={fmtR(rl)} />
        <KPICard label="EBITDA" value={fmtR(ebitda)} sub={`Margem: ${fmtP(ebitda / rlSafe)}`} />
        <KPICard label="Lucro Líquido" value={fmtR(ll)} sub={`Margem: ${fmtP(ll / rlSafe)}`} />
      </div>

      {/* Indicadores */}
      <div style={{ background: C.branco, borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.cinza2}`, fontWeight: 700, fontSize: 15 }}>
          Indicadores vs Benchmark
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.cinza }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.cinza3 }}>INDICADOR</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.cinza3 }}>ATUAL</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.cinza3 }}>IDEAL</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.cinza3 }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {indicadores.map((i, idx) => (
              <BenchRow key={i.label} {...i} idx={idx} />
            ))}
          </tbody>
        </table>
      </div>

      {/* CMV */}
      <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
        <div style={{ background: C.branco, borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', flex: 1 }}>
          <div style={{ fontSize: 12, color: C.cinza3, fontWeight: 600, marginBottom: 8 }}>CMV TEÓRICO (Vendas)</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{fmtR(cmvTeorico)}</div>
          <div style={{ fontSize: 12, color: C.cinza3, marginTop: 4 }}>{fmtP(cmvTeorico / rlSafe)} da Rec. Líquida</div>
        </div>
        <div style={{ background: C.branco, borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', flex: 1 }}>
          <div style={{ fontSize: 12, color: C.cinza3, fontWeight: 600, marginBottom: 8 }}>CMV REAL (Estoque)</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{fmtR(cmvReal)}</div>
          <div style={{ fontSize: 12, color: C.cinza3, marginTop: 4 }}>{fmtP(cmvReal / rlSafe)} da Rec. Líquida</div>
        </div>
        <div style={{ background: C.branco, borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', flex: 1 }}>
          <div style={{ fontSize: 12, color: C.cinza3, fontWeight: 600, marginBottom: 8 }}>VARIÂNCIA (Desperdício)</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{fmtR(Math.abs(cmvReal - cmvTeorico))}</div>
          <div style={{ fontSize: 12, color: C.cinza3, marginTop: 4 }}>{fmtP(variancia)} da Rec. Líquida</div>
        </div>
      </div>
    </div>
  )
}

const btnExport = {
  padding: '8px 16px', borderRadius: 6, border: `1px solid ${C.cinza2}`,
  background: C.branco, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
  fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
}
