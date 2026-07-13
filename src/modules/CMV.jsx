import { useMemo } from 'react'
import useStore from '../store/useStore'
import { C } from '../styles/tokens'
import { fmtR, fmtP } from '../utils/formatters'
import {
  calcularCMVReal, calcularCMVTeorico, calcularCMO,
  calcularDRE, calcularCustoPrato,
} from '../utils/calculations'
import { BENCHMARKS } from '../utils/benchmarks'
import Badge from '../components/Badge'
const loadExcel = () => import('../utils/exportExcel')

function statusBench(v, b) {
  if (b.inv) return v >= b.ideal ? 'saudavel' : v >= b.atencao ? 'atencao' : 'critico'
  return v <= b.ideal ? 'saudavel' : v <= b.atencao ? 'atencao' : 'critico'
}

export default function CMV() {
  const { ingredientes, receitas, receitaItens, vendas, estoque, funcionarios, dre } = useStore()

  const { cmvReal, cmvTeorico, rl, variancia } = useMemo(() => {
    const cmvReal = calcularCMVReal(estoque, ingredientes)
    const cmvTeorico = calcularCMVTeorico(receitas, receitaItens, vendas, ingredientes)
    const cmo = calcularCMO(funcionarios)
    const { rl } = calcularDRE(dre, cmvReal, cmo)
    const rlSafe = rl || 1
    const variancia = Math.abs(cmvReal - cmvTeorico) / rlSafe
    return { cmvReal, cmvTeorico, rl: rlSafe, variancia }
  }, [ingredientes, receitas, receitaItens, vendas, estoque, funcionarios, dre])

  const cmvRealPct = cmvReal / rl
  const cmvTeoPct  = cmvTeorico / rl
  const varAbs     = Math.abs(cmvReal - cmvTeorico)
  const statusReal = statusBench(cmvRealPct, BENCHMARKS.cmv)
  const statusVar  = statusBench(variancia, BENCHMARKS.variancia)

  const store = useStore()

  const pratoRows = useMemo(() =>
    receitas.map((r) => {
      const custo = calcularCustoPrato(r.id, receitaItens, ingredientes)
      const qtd   = vendas.find((v) => v.prato_id === r.id)?.qtd ?? 0
      const total = custo * qtd
      const recTotal = r.preco * qtd
      const pct   = recTotal > 0 ? total / recTotal : 0
      return { ...r, custo, qtd, total, pct }
    }), [receitas, receitaItens, ingredientes, vendas])

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>📉 CMV — Custo de Mercadoria Vendida</h2>
        <button onClick={() => loadExcel().then(m => m.exportCMVExcel(store))} style={btnExport}>📊 Exportar Excel</button>
      </div>

      {/* Cards de comparação */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <Card
          label="CMV Teórico"
          value={fmtR(cmvTeorico)}
          sub={`${fmtP(cmvTeoPct)} da Rec. Líquida`}
          note="Calculado pelas fichas técnicas × vendas"
          color={C.azul}
          bg={C.azulL}
        />
        <Card
          label="CMV Real"
          value={fmtR(cmvReal)}
          sub={`${fmtP(cmvRealPct)} da Rec. Líquida`}
          note="Calculado pelo consumo real de estoque"
          badge={<Badge status={statusReal} />}
          color={C.preto}
          bg={C.branco}
        />
        <Card
          label="Variância (Desperdício)"
          value={fmtR(varAbs)}
          sub={`${fmtP(variancia)} da Rec. Líquida`}
          note="Diferença entre CMV Real e Teórico"
          badge={<Badge status={statusVar} />}
          color={varAbs > 0 ? C.laranja : C.verde}
          bg={varAbs > 0 ? '#FFF3E0' : C.verdeL}
        />
      </div>

      {/* Benchmark */}
      <div style={{
        background: C.branco, borderRadius: 10, padding: '16px 20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 24,
        fontSize: 13, color: C.cinza3,
        display: 'flex', gap: 32, flexWrap: 'wrap',
      }}>
        <span>Benchmark CMV: <strong style={{ color: C.preto }}>≤ {fmtP(BENCHMARKS.cmv.ideal)}</strong> (ideal) · ≤ {fmtP(BENCHMARKS.cmv.atencao)} (atenção)</span>
        <span>Benchmark Variância: <strong style={{ color: C.preto }}>≤ {fmtP(BENCHMARKS.variancia.ideal)}</strong> (ideal) · ≤ {fmtP(BENCHMARKS.variancia.atencao)} (atenção)</span>
      </div>

      {/* CMV por prato */}
      <div style={{ background: C.branco, borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.cinza2}`, fontWeight: 700, fontSize: 15 }}>
          CMV por Prato (Teórico)
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.cinza }}>
              {['Prato', 'Custo Unit.', 'Qtd. Vendida', 'CMV Total', 'Receita Total', '% CMV'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pratoRows.map((r, idx) => (
              <tr key={r.id} style={{ borderTop: `1px solid ${C.cinza2}`, background: idx % 2 === 0 ? C.branco : '#FAFAFA' }}>
                <td style={tdStyle}><strong>{r.nome}</strong></td>
                <td style={tdStyle}>{fmtR(r.custo)}</td>
                <td style={tdStyle}>{r.qtd}</td>
                <td style={tdStyle}>{fmtR(r.total)}</td>
                <td style={tdStyle}>{fmtR(r.preco * r.qtd)}</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: r.pct <= BENCHMARKS.cmv.ideal ? C.verde : r.pct <= BENCHMARKS.cmv.atencao ? C.laranja : C.verm }}>
                  {fmtP(r.pct)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Card({ label, value, sub, note, badge, color, bg }) {
  return (
    <div style={{ background: bg, borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', flex: 1, minWidth: 200 }}>
      <div style={{ fontSize: 12, color: C.cinza3, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: C.cinza3, marginTop: 4 }}>{sub}</div>
      {badge && <div style={{ marginTop: 8 }}>{badge}</div>}
      {note && <div style={{ fontSize: 11, color: C.cinza3, marginTop: 6 }}>{note}</div>}
    </div>
  )
}

const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.cinza3, whiteSpace: 'nowrap' }
const tdStyle = { padding: '10px 16px', fontSize: 13 }
const btnExport = {
  padding: '8px 16px', borderRadius: 6, border: `1px solid ${C.cinza2}`,
  background: C.branco, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
}
