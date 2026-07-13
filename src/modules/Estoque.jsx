import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import { C } from '../styles/tokens'
import { fmtR, fmtN } from '../utils/formatters'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'

export default function Estoque() {
  const { estoque, ingredientes, addEstoque, updateEstoque, deleteEstoque } = useStore()
  const [modal, setModal] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState('')

  const ingNoCadastro = ingredientes.filter(
    (i) => !estoque.find((e) => e.ing_id === i.id)
  )
  const ingOptions = ingNoCadastro.map((i) => ({ value: i.id, label: `${i.nome} (${i.un})` }))

  const addFields = [
    { name: 'ing_id',  label: 'Ingrediente', type: 'select', required: true, options: ingOptions },
    { name: 'ei',      label: 'Est. Inicial', type: 'number', default: 0 },
    { name: 'compras', label: 'Compras',      type: 'number', default: 0 },
    { name: 'ef',      label: 'Est. Final',   type: 'number', default: 0 },
  ]

  const rows = useMemo(() =>
    estoque.map((e) => {
      const ing = ingredientes.find((x) => x.id === e.ing_id)
      const consumo = (e.ei || 0) + (e.compras || 0) - (e.ef || 0)
      const custo = consumo * (ing?.preco || 0)
      return { ...e, ing, consumo, custo }
    }).filter((r) => r.ing), [estoque, ingredientes])

  const totalCusto = rows.reduce((s, r) => s + r.custo, 0)

  const handleAdd = (data) => {
    addEstoque({ ing_id: data.ing_id, ei: +data.ei, compras: +data.compras, ef: +data.ef })
    setModal(false)
    setToast('Ingrediente adicionado ao estoque!')
  }

  const handleCell = (ing_id, field, val) => {
    updateEstoque(ing_id, { [field]: parseFloat(val) || 0 })
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>📦 Estoque</h2>
        <button onClick={() => setModal(true)} style={btnPrimary} disabled={ingOptions.length === 0}>
          + Adicionar ao Estoque
        </button>
      </div>

      <div style={{ background: C.branco, borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.cinza }}>
              {['Ingrediente', 'Unid.', 'Est. Inicial', 'Compras', 'Est. Final', 'Consumo', 'Preço Unit.', 'Custo Total', ''].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: C.cinza3 }}>Nenhum item no estoque.</td></tr>
            )}
            {rows.map((r, idx) => (
              <tr key={r.ing_id} style={{ borderTop: `1px solid ${C.cinza2}`, background: idx % 2 === 0 ? C.branco : '#FAFAFA' }}>
                <td style={tdStyle}>{r.ing.nome}</td>
                <td style={tdStyle}>{r.ing.un}</td>
                {['ei', 'compras', 'ef'].map((field) => (
                  <td key={field} style={{ ...tdStyle, width: 110 }}>
                    <input
                      type="number" min={0} step="any"
                      key={r.ing_id + field + r[field]}
                      defaultValue={r[field]}
                      onBlur={(e) => handleCell(r.ing_id, field, e.target.value)}
                      style={inputStyle}
                    />
                  </td>
                ))}
                <td style={tdStyle}>{fmtN(r.consumo)}</td>
                <td style={tdStyle}>{fmtR(r.ing.preco)}</td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{fmtR(r.custo)}</td>
                <td style={tdStyle}>
                  <button onClick={() => setConfirm(r.ing_id)} style={btnDel}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: `2px solid ${C.cinza2}`, background: C.cinza, fontWeight: 700 }}>
                <td style={tdStyle} colSpan={7}><strong>CUSTO TOTAL (CMV Real)</strong></td>
                <td style={tdStyle}><strong>{fmtR(totalCusto)}</strong></td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <Modal
        isOpen={modal}
        title="Adicionar Ingrediente ao Estoque"
        fields={addFields}
        onSave={handleAdd}
        onClose={() => setModal(false)}
      />
      <ConfirmDialog
        isOpen={!!confirm}
        message="Remover este ingrediente do estoque?"
        onConfirm={() => { deleteEstoque(confirm); setConfirm(null); setToast('Removido!') }}
        onCancel={() => setConfirm(null)}
      />
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}

const btnPrimary = { padding: '9px 18px', borderRadius: 6, border: 'none', background: C.amarelo, color: C.preto, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }
const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.cinza3, whiteSpace: 'nowrap' }
const tdStyle = { padding: '10px 16px', fontSize: 13, verticalAlign: 'middle' }
const btnDel  = { padding: '4px 8px', borderRadius: 5, border: `1px solid ${C.vermL}`, background: C.vermL, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }
const inputStyle = {
  width: 90, padding: '6px 8px', borderRadius: 6,
  border: `1.5px solid ${C.azul}`, background: C.azulL,
  color: C.azul, fontWeight: 600, fontSize: 13,
  fontFamily: 'inherit', textAlign: 'center', outline: 'none',
}
