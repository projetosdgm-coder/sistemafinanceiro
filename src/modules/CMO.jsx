import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import { C } from '../styles/tokens'
import { fmtR, fmtP } from '../utils/formatters'
import { calcularCustoFuncionario, calcularCMO, calcularCMVReal, calcularDRE, MULT_CLT } from '../utils/calculations'
import { BENCHMARKS } from '../utils/benchmarks'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'

const FIELDS = [
  { name: 'nome',    label: 'Nome',         type: 'text',   required: true },
  { name: 'cargo',   label: 'Cargo',        type: 'text',   required: true },
  { name: 'regime',  label: 'Regime',       type: 'select', required: true,
    options: ['CLT', 'PJ'] },
  { name: 'salario', label: 'Salário Base', type: 'number', required: true, prefix: 'R$' },
]

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
  const status = cmoPct <= BENCHMARKS.cmo.ideal ? 'saudavel'
    : cmoPct <= BENCHMARKS.cmo.atencao ? 'atencao' : 'critico'

  const handleSave = (data) => {
    const payload = { ...data, salario: parseFloat(data.salario) }
    if (modal.data?.id) {
      updateFuncionario(modal.data.id, payload)
      setToast('Colaborador atualizado!')
    } else {
      addFuncionario({ ...payload, id: `e${Date.now()}` })
      setToast('Colaborador adicionado!')
    }
    setModal({ open: false, data: null })
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>👥 CMO — Custo de Mão de Obra</h2>
        <button onClick={() => setModal({ open: true, data: null })} style={btnPrimary}>
          + Novo Colaborador
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <KPI label="Total CMO" value={fmtR(cmo)} />
        <KPI label="% Rec. Líquida" value={fmtP(cmoPct)} sub={<Badge status={status} />} />
        <KPI label="Ideal do setor" value={`≤ ${fmtP(BENCHMARKS.cmo.ideal)}`} />
        <KPI label="Colaboradores" value={funcionarios.length} />
      </div>

      {/* Nota encargos CLT */}
      <div style={{
        background: '#FFF8E1', border: `1px solid #FFE082`, borderRadius: 8,
        padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#5D4037',
      }}>
        ⚠️ Encargos CLT aplicados: {fmtP(MULT_CLT - 1)} sobre o salário base (INSS + FGTS + férias + 13º + outros).
      </div>

      <div style={{ background: C.branco, borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.cinza }}>
              {['Nome', 'Cargo', 'Regime', 'Salário Base', 'Encargos', 'Custo Total', 'Ações'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {funcionarios.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: C.cinza3 }}>Nenhum colaborador cadastrado.</td></tr>
            )}
            {funcionarios.map((f, idx) => {
              const enc = f.regime === 'CLT' ? f.salario * (MULT_CLT - 1) : 0
              const total = calcularCustoFuncionario(f)
              return (
                <tr key={f.id} style={{ borderTop: `1px solid ${C.cinza2}`, background: idx % 2 === 0 ? C.branco : '#FAFAFA' }}>
                  <td style={tdStyle}>{f.nome}</td>
                  <td style={tdStyle}>{f.cargo}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                      background: f.regime === 'CLT' ? C.azulL : C.verdeL,
                      color: f.regime === 'CLT' ? C.azul : C.verde,
                    }}>{f.regime}</span>
                  </td>
                  <td style={tdStyle}>{fmtR(f.salario)}</td>
                  <td style={{ ...tdStyle, color: C.cinza3 }}>{fmtR(enc)}</td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{fmtR(total)}</td>
                  <td style={{ ...tdStyle, display: 'flex', gap: 6 }}>
                    <button onClick={() => setModal({ open: true, data: f })} style={btnEdit}>✏️ Editar</button>
                    <button onClick={() => setConfirm(f.id)} style={btnDel}>🗑️</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          {funcionarios.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: `2px solid ${C.cinza2}`, background: C.cinza, fontWeight: 700 }}>
                <td style={tdStyle} colSpan={5}><strong>TOTAL CMO</strong></td>
                <td style={tdStyle}><strong>{fmtR(cmo)}</strong></td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <Modal
        isOpen={modal.open}
        title={modal.data ? 'Editar Colaborador' : 'Novo Colaborador'}
        fields={FIELDS}
        initialData={modal.data}
        onSave={handleSave}
        onClose={() => setModal({ open: false, data: null })}
      />
      <ConfirmDialog
        isOpen={!!confirm}
        message="Excluir este colaborador?"
        onConfirm={() => { deleteFuncionario(confirm); setConfirm(null); setToast('Colaborador excluído!') }}
        onCancel={() => setConfirm(null)}
      />
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}

function KPI({ label, value, sub }) {
  return (
    <div style={{ background: C.branco, borderRadius: 10, padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', minWidth: 160 }}>
      <div style={{ fontSize: 12, color: C.cinza3, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

const btnPrimary = { padding: '9px 18px', borderRadius: 6, border: 'none', background: C.amarelo, color: C.preto, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }
const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.cinza3, whiteSpace: 'nowrap' }
const tdStyle = { padding: '10px 16px', fontSize: 13, verticalAlign: 'middle' }
const btnEdit = { padding: '4px 10px', borderRadius: 5, border: `1px solid ${C.cinza2}`, background: C.branco, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }
const btnDel  = { padding: '4px 8px',  borderRadius: 5, border: `1px solid ${C.vermL}`,  background: C.vermL,  cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }
