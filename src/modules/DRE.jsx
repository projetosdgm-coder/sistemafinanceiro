import { useMemo, useState } from 'react'
import useStore from '../store/useStore'
import { C } from '../styles/tokens'
import { fmtR, fmtP } from '../utils/formatters'
import { calcularCMVReal, calcularCMO, calcularDRE } from '../utils/calculations'
import Toast from '../components/Toast'
const loadPDF   = () => import('../utils/exportPDF')
const loadExcel = () => import('../utils/exportExcel')

function NumInput({ value, onChange }) {
  return (
    <input
      type="number" min={0} step="any"
      defaultValue={value}
      key={value}
      onBlur={(e) => onChange(parseFloat(e.target.value) || 0)}
      style={{
        width: 130, padding: '5px 8px', borderRadius: 6,
        border: `1.5px solid ${C.azul}`, background: C.azulL,
        color: C.azul, fontWeight: 600, fontSize: 13,
        fontFamily: 'inherit', textAlign: 'right', outline: 'none',
      }}
    />
  )
}

function PctInput({ value, onChange }) {
  return (
    <input
      type="number" min={0} max={1} step="0.001"
      defaultValue={(value * 100).toFixed(1)}
      key={value}
      onBlur={(e) => onChange(parseFloat(e.target.value) / 100 || 0)}
      style={{
        width: 80, padding: '5px 8px', borderRadius: 6,
        border: `1.5px solid ${C.azul}`, background: C.azulL,
        color: C.azul, fontWeight: 600, fontSize: 13,
        fontFamily: 'inherit', textAlign: 'right', outline: 'none',
      }}
    />
  )
}

function Row({ label, value, rl, indent = 0, bold, color, input }) {
  const pct = rl > 0 ? value / rl : 0
  return (
    <tr>
      <td style={{ padding: '8px 16px', fontSize: 13, paddingLeft: 16 + indent * 20, fontWeight: bold ? 700 : 400, color: color || C.preto }}>
        {label}
      </td>
      <td style={{ padding: '8px 16px', fontSize: 13, textAlign: 'right', width: 160 }}>
        {input || null}
      </td>
      <td style={{ padding: '8px 16px', fontSize: 13, textAlign: 'right', fontWeight: bold ? 700 : 400, color: color || C.preto, width: 140 }}>
        {fmtR(value)}
      </td>
      <td style={{ padding: '8px 16px', fontSize: 12, textAlign: 'right', color: C.cinza3, width: 80 }}>
        {rl > 0 ? fmtP(pct) : '—'}
      </td>
    </tr>
  )
}

function Section({ title }) {
  return (
    <tr style={{ background: C.cinza }}>
      <td colSpan={4} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, color: C.cinza3, letterSpacing: 0.5 }}>
        {title}
      </td>
    </tr>
  )
}

export default function DRE() {
  const store = useStore()
  const { dre, ingredientes, estoque, funcionarios, updateDRE } = store
  const [toast, setToast] = useState('')

  const set = (field) => (val) => { updateDRE({ [field]: val }); setToast('DRE atualizada!') }

  const cmvReal = useMemo(() => calcularCMVReal(estoque, ingredientes), [estoque, ingredientes])
  const cmo     = useMemo(() => calcularCMO(funcionarios), [funcionarios])
  const r       = useMemo(() => calcularDRE(dre, cmvReal, cmo), [dre, cmvReal, cmo])
  const rl      = r.rl || 1

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>📑 DRE — Demonstrativo de Resultado</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: C.cinza3 }}>
            Campos em <span style={{ color: C.azul, fontWeight: 700 }}>azul</span> são editáveis
          </span>
          <button onClick={() => loadPDF().then(m => m.exportDREPDF(store, store.restaurante))} style={btnExport}>📄 PDF</button>
          <button onClick={() => loadExcel().then(m => m.exportDREExcel(store))} style={btnExport}>📊 Excel</button>
        </div>
      </div>

      <div style={{ background: C.branco, borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#111', color: C.branco }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700 }}>DESCRIÇÃO</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#888' }}>INPUT</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700 }}>VALOR</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#888' }}>% RL</th>
            </tr>
          </thead>
          <tbody>
            <Section title="RECEITA BRUTA" />
            <Row label="Salão"    value={dre.salao||0}    rl={rl} indent={1} input={<NumInput value={dre.salao||0}    onChange={set('salao')} />} />
            <Row label="Delivery" value={dre.delivery||0} rl={rl} indent={1} input={<NumInput value={dre.delivery||0} onChange={set('delivery')} />} />
            <Row label="iFood"    value={dre.ifood||0}    rl={rl} indent={1} input={<NumInput value={dre.ifood||0}    onChange={set('ifood')} />} />
            <Row label="Eventos"  value={dre.eventos||0}  rl={rl} indent={1} input={<NumInput value={dre.eventos||0}  onChange={set('eventos')} />} />
            <Row label="RECEITA BRUTA TOTAL" value={r.rb} rl={rl} bold color={C.preto} />

            <Section title="DEDUÇÕES" />
            <Row label={`Impostos (${fmtP(dre.imp_pct||0)})`} value={r.rb*(dre.imp_pct||0)} rl={rl} indent={1}
              input={<><PctInput value={dre.imp_pct||0} onChange={set('imp_pct')} /><span style={{ fontSize: 11, color: C.cinza3 }}> %</span></>} />
            <Row label={`Taxas cartão (${fmtP(dre.taxa_pct||0)})`} value={r.rb*(dre.taxa_pct||0)} rl={rl} indent={1}
              input={<><PctInput value={dre.taxa_pct||0} onChange={set('taxa_pct')} /><span style={{ fontSize: 11, color: C.cinza3 }}> %</span></>} />
            <Row label="Devoluções" value={dre.dev||0} rl={rl} indent={1} input={<NumInput value={dre.dev||0} onChange={set('dev')} />} />
            <Row label="TOTAL DEDUÇÕES" value={r.ded} rl={rl} bold color={C.verm} />

            <Row label="RECEITA LÍQUIDA" value={r.rl} rl={rl} bold color={C.preto} />

            <Section title="CMV — CUSTO DE MERCADORIA VENDIDA" />
            <Row label="CMV Real (do estoque)" value={cmvReal} rl={rl} indent={1} />
            <Row label="LUCRO BRUTO" value={r.lb} rl={rl} bold color={r.lb >= 0 ? C.verde : C.verm} />

            <Section title="CMO — CUSTO DE MÃO DE OBRA" />
            <Row label="Total CMO (calculado)" value={cmo} rl={rl} indent={1} />

            <Section title="DESPESAS OPERACIONAIS" />
            {[
              ['aluguel','Aluguel'],['energia','Energia'],['agua','Água'],
              ['internet','Internet'],['marketing','Marketing'],['contabil','Contabilidade'],
              ['manut','Manutenção'],['seguros','Seguros'],['pdv','PDV / Sistema'],
              ['limpeza','Limpeza'],['outros','Outros'],
            ].map(([f, l]) => (
              <Row key={f} label={l} value={dre[f]||0} rl={rl} indent={1}
                input={<NumInput value={dre[f]||0} onChange={set(f)} />} />
            ))}
            <Row label="TOTAL DESPESAS" value={r.desp} rl={rl} bold />

            <Row label="EBITDA" value={r.ebitda} rl={rl} bold color={r.ebitda >= 0 ? C.verde : C.verm} />

            <Section title="AJUSTES ABAIXO DO EBITDA" />
            <Row label="Depreciação"  value={dre.depre||0}    rl={rl} indent={1} input={<NumInput value={dre.depre||0}    onChange={set('depre')} />} />
            <Row label="Juros"        value={dre.juros||0}    rl={rl} indent={1} input={<NumInput value={dre.juros||0}    onChange={set('juros')} />} />
            <Row label="Parcelas"     value={dre.parcelas||0} rl={rl} indent={1} input={<NumInput value={dre.parcelas||0} onChange={set('parcelas')} />} />
            <Row label="IR / CSLL"    value={dre.ir||0}       rl={rl} indent={1} input={<NumInput value={dre.ir||0}       onChange={set('ir')} />} />
            <Row label="TOTAL AJUSTES" value={r.ajustes + (dre.ir||0)} rl={rl} bold />

            <tr style={{ background: r.ll >= 0 ? C.verdeL : C.vermL }}>
              <td colSpan={4} style={{ height: 1, padding: 0 }} />
            </tr>
            <Row label="LUCRO LÍQUIDO" value={r.ll} rl={rl} bold color={r.ll >= 0 ? C.verde : C.verm} />
          </tbody>
        </table>
      </div>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}

const btnExport = {
  padding: '7px 14px', borderRadius: 6, border: `1px solid ${C.cinza2}`,
  background: C.branco, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
}
