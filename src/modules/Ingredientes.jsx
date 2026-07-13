import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import { C } from '../styles/tokens'
import { fmtR } from '../utils/formatters'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'

const FIELDS = [
  { name: 'nome',  label: 'Nome',        type: 'text',   required: true },
  { name: 'cat',   label: 'Categoria',   type: 'text',   required: true, placeholder: 'ex: Proteínas' },
  { name: 'un',    label: 'Unidade',     type: 'select', required: true,
    options: ['kg', 'un', 'L', 'g', 'ml', 'cx', 'pct'] },
  { name: 'preco', label: 'Preço (R$)',  type: 'number', required: true, prefix: 'R$' },
  { name: 'forn',  label: 'Fornecedor',  type: 'text' },
]

export default function Ingredientes() {
  const { ingredientes, addIngrediente, updateIngrediente, deleteIngrediente } = useStore()
  const [modal, setModal] = useState({ open: false, data: null })
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState('')
  const [busca, setBusca] = useState('')

  const filtrados = useMemo(() =>
    ingredientes.filter((i) =>
      i.nome.toLowerCase().includes(busca.toLowerCase()) ||
      i.cat?.toLowerCase().includes(busca.toLowerCase())
    ), [ingredientes, busca])

  const handleSave = (data) => {
    if (modal.data?.id) {
      updateIngrediente(modal.data.id, data)
      setToast('Ingrediente atualizado!')
    } else {
      addIngrediente({ ...data, id: `i${Date.now()}` })
      setToast('Ingrediente adicionado!')
    }
    setModal({ open: false, data: null })
  }

  const handleDelete = () => {
    deleteIngrediente(confirm)
    setConfirm(null)
    setToast('Ingrediente excluído!')
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>🧂 Ingredientes</h2>
        <button onClick={() => setModal({ open: true, data: null })} style={btnPrimary}>
          + Novo Ingrediente
        </button>
      </div>

      {/* Busca */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou categoria..."
          style={{
            padding: '8px 14px', borderRadius: 6, border: `1px solid ${C.cinza2}`,
            fontSize: 13, width: 280, fontFamily: 'inherit', outline: 'none',
          }}
        />
      </div>

      {/* Tabela */}
      <div style={{ background: C.branco, borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.cinza }}>
              {['Nome', 'Categoria', 'Unidade', 'Preço Unit.', 'Fornecedor', 'Ações'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: C.cinza3 }}>Nenhum ingrediente encontrado.</td></tr>
            )}
            {filtrados.map((ing, idx) => (
              <tr key={ing.id} style={{ borderTop: `1px solid ${C.cinza2}`, background: idx % 2 === 0 ? C.branco : '#FAFAFA' }}>
                <td style={tdStyle}>{ing.nome}</td>
                <td style={tdStyle}>{ing.cat}</td>
                <td style={tdStyle}>{ing.un}</td>
                <td style={tdStyle}>{fmtR(ing.preco)}</td>
                <td style={tdStyle}>{ing.forn || '—'}</td>
                <td style={{ ...tdStyle, display: 'flex', gap: 6 }}>
                  <button onClick={() => setModal({ open: true, data: ing })} style={btnEdit}>✏️ Editar</button>
                  <button onClick={() => setConfirm(ing.id)} style={btnDel}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.cinza2}`, fontSize: 12, color: C.cinza3 }}>
          {filtrados.length} ingrediente(s)
        </div>
      </div>

      <Modal
        isOpen={modal.open}
        title={modal.data ? 'Editar Ingrediente' : 'Novo Ingrediente'}
        fields={FIELDS}
        initialData={modal.data}
        onSave={handleSave}
        onClose={() => setModal({ open: false, data: null })}
      />
      <ConfirmDialog
        isOpen={!!confirm}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}

const btnPrimary = {
  padding: '9px 18px', borderRadius: 6, border: 'none',
  background: C.amarelo, color: C.preto, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
}
const thStyle = {
  padding: '10px 16px', textAlign: 'left', fontSize: 12,
  fontWeight: 600, color: C.cinza3, whiteSpace: 'nowrap',
}
const tdStyle = { padding: '10px 16px', fontSize: 13, verticalAlign: 'middle' }
const btnEdit = {
  padding: '4px 10px', borderRadius: 5, border: `1px solid ${C.cinza2}`,
  background: C.branco, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
}
const btnDel = {
  padding: '4px 8px', borderRadius: 5, border: `1px solid ${C.vermL}`,
  background: C.vermL, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
}
