import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import { C } from '../styles/tokens'
import { fmtR, fmtP } from '../utils/formatters'
import { calcularCustoPrato } from '../utils/calculations'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'

const PRATO_FIELDS = [
  { name: 'nome',  label: 'Nome do Prato', type: 'text',   required: true },
  { name: 'cat',   label: 'Categoria',     type: 'text',   required: true },
  { name: 'preco', label: 'Preço de Venda',type: 'number', required: true, prefix: 'R$' },
]

export default function FichaTecnica() {
  const { receitas, receitaItens, ingredientes,
          addReceita, updateReceita, deleteReceita,
          addReceitaItem, updateReceitaItem, deleteReceitaItem } = useStore()

  const [pratModal, setPratModal] = useState({ open: false, data: null })
  const [ingModal, setIngModal] = useState({ open: false, prato_id: null })
  const [expanded, setExpanded] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState('')

  const ingOptions = ingredientes.map((i) => ({ value: i.id, label: `${i.nome} (${i.un})` }))

  const ingFields = [
    { name: 'ing_id', label: 'Ingrediente', type: 'select', required: true, options: ingOptions },
    { name: 'qtd',    label: 'Quantidade',  type: 'number', required: true },
  ]

  const handleSavePrato = (data) => {
    if (pratModal.data?.id) {
      updateReceita(pratModal.data.id, data)
      setToast('Prato atualizado!')
    } else {
      addReceita({ ...data, id: `r${Date.now()}` })
      setToast('Prato adicionado!')
    }
    setPratModal({ open: false, data: null })
  }

  const handleSaveIng = (data) => {
    const existing = receitaItens.find(
      (x) => x.prato_id === ingModal.prato_id && x.ing_id === data.ing_id
    )
    if (existing) {
      updateReceitaItem(ingModal.prato_id, data.ing_id, { qtd: parseFloat(data.qtd) })
    } else {
      addReceitaItem({ prato_id: ingModal.prato_id, ing_id: data.ing_id, qtd: parseFloat(data.qtd) })
    }
    setToast('Ingrediente salvo!')
    setIngModal({ open: false, prato_id: null })
  }

  const handleDeletePrato = () => {
    deleteReceita(confirm.id)
    setConfirm(null)
    if (expanded === confirm.id) setExpanded(null)
    setToast('Prato excluído!')
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>📋 Ficha Técnica</h2>
        <button onClick={() => setPratModal({ open: true, data: null })} style={btnPrimary}>
          + Novo Prato
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {receitas.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: C.cinza3 }}>Nenhum prato cadastrado.</div>
        )}
        {receitas.map((prato) => {
          const custo = calcularCustoPrato(prato.id, receitaItens, ingredientes)
          const margem = prato.preco > 0 ? (prato.preco - custo) / prato.preco : 0
          const itens = receitaItens.filter((x) => x.prato_id === prato.id)
          const isOpen = expanded === prato.id

          return (
            <div key={prato.id} style={{
              background: C.branco, borderRadius: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden',
            }}>
              {/* Header do prato */}
              <div style={{
                display: 'flex', alignItems: 'center', padding: '14px 20px',
                cursor: 'pointer', gap: 16,
              }} onClick={() => setExpanded(isOpen ? null : prato.id)}>
                <span style={{ fontSize: 18 }}>{isOpen ? '▼' : '▶'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{prato.nome}</div>
                  <div style={{ fontSize: 12, color: C.cinza3 }}>{prato.cat}</div>
                </div>
                <div style={{ textAlign: 'right', marginRight: 16 }}>
                  <div style={{ fontSize: 12, color: C.cinza3 }}>Custo</div>
                  <div style={{ fontWeight: 700 }}>{fmtR(custo)}</div>
                </div>
                <div style={{ textAlign: 'right', marginRight: 16 }}>
                  <div style={{ fontSize: 12, color: C.cinza3 }}>Venda</div>
                  <div style={{ fontWeight: 700, color: C.verde }}>{fmtR(prato.preco)}</div>
                </div>
                <div style={{ textAlign: 'right', marginRight: 16 }}>
                  <div style={{ fontSize: 12, color: C.cinza3 }}>Margem</div>
                  <div style={{ fontWeight: 700, color: margem >= 0.5 ? C.verde : C.laranja }}>
                    {fmtP(margem)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setPratModal({ open: true, data: prato })} style={btnEdit}>✏️</button>
                  <button onClick={() => setConfirm({ id: prato.id, nome: prato.nome })} style={btnDel}>🗑️</button>
                </div>
              </div>

              {/* Ingredientes do prato */}
              {isOpen && (
                <div style={{ borderTop: `1px solid ${C.cinza2}`, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.cinza3 }}>INGREDIENTES</span>
                    <button onClick={() => setIngModal({ open: true, prato_id: prato.id })} style={btnSecondary}>
                      + Adicionar Ingrediente
                    </button>
                  </div>
                  {itens.length === 0 && (
                    <div style={{ fontSize: 13, color: C.cinza3 }}>Nenhum ingrediente adicionado.</div>
                  )}
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    {itens.length > 0 && (
                      <thead>
                        <tr style={{ background: C.cinza }}>
                          {['Ingrediente', 'Unid.', 'Qtd.', 'Preço Unit.', 'Custo', ''].map((h) => (
                            <th key={h} style={thStyle}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {itens.map((item) => {
                        const ing = ingredientes.find((x) => x.id === item.ing_id)
                        if (!ing) return null
                        const custoItem = ing.preco * item.qtd
                        return (
                          <tr key={item.ing_id} style={{ borderTop: `1px solid ${C.cinza2}` }}>
                            <td style={tdStyle}>{ing.nome}</td>
                            <td style={tdStyle}>{ing.un}</td>
                            <td style={tdStyle}>{item.qtd}</td>
                            <td style={tdStyle}>{fmtR(ing.preco)}</td>
                            <td style={tdStyle}>{fmtR(custoItem)}</td>
                            <td style={tdStyle}>
                              <button
                                onClick={() => { deleteReceitaItem(prato.id, item.ing_id); setToast('Removido!') }}
                                style={btnDel}
                              >🗑️</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Modal
        isOpen={pratModal.open}
        title={pratModal.data ? 'Editar Prato' : 'Novo Prato'}
        fields={PRATO_FIELDS}
        initialData={pratModal.data}
        onSave={handleSavePrato}
        onClose={() => setPratModal({ open: false, data: null })}
      />
      <Modal
        isOpen={ingModal.open}
        title="Adicionar Ingrediente ao Prato"
        fields={ingFields}
        onSave={handleSaveIng}
        onClose={() => setIngModal({ open: false, prato_id: null })}
      />
      <ConfirmDialog
        isOpen={!!confirm}
        message={`Excluir o prato "${confirm?.nome}"? Esta ação removerá todos os ingredientes da ficha.`}
        onConfirm={handleDeletePrato}
        onCancel={() => setConfirm(null)}
      />
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}

const btnPrimary  = { padding: '9px 18px', borderRadius: 6, border: 'none', background: C.amarelo, color: C.preto, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }
const btnSecondary = { padding: '6px 14px', borderRadius: 6, border: `1px solid ${C.cinza2}`, background: C.branco, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }
const btnEdit = { padding: '4px 10px', borderRadius: 5, border: `1px solid ${C.cinza2}`, background: C.branco, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }
const btnDel  = { padding: '4px 8px',  borderRadius: 5, border: `1px solid ${C.vermL}`,  background: C.vermL,  cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }
const thStyle = { padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.cinza3 }
const tdStyle = { padding: '9px 12px', fontSize: 13 }
