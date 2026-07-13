import { C } from '../styles/tokens'

export default function ConfirmDialog({ isOpen, message, onConfirm, onCancel }) {
  if (!isOpen) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: C.branco, borderRadius: 10, padding: 28,
        width: 360, maxWidth: '90vw',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
        <p style={{ fontSize: 15, marginBottom: 24, color: C.preto }}>
          {message ?? 'Tem certeza que deseja excluir este registro?'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onCancel} style={{
            padding: '8px 24px', borderRadius: 6, border: `1px solid ${C.cinza2}`,
            background: C.branco, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
          }}>
            Cancelar
          </button>
          <button onClick={onConfirm} style={{
            padding: '8px 24px', borderRadius: 6, border: 'none',
            background: C.verm, color: C.branco, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
          }}>
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}
