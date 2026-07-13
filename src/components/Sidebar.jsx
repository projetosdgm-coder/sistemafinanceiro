import { useState, useRef } from 'react'
import { C } from '../styles/tokens'
import useStore from '../store/useStore'

const ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',      icon: '📊' },
  { id: 'ingredientes', label: 'Ingredientes',   icon: '🧂' },
  { id: 'ficha',        label: 'Ficha Técnica',  icon: '📋' },
  { id: 'vendas',       label: 'Vendas',         icon: '🛒' },
  { id: 'estoque',      label: 'Estoque',        icon: '📦' },
  { id: 'cmo',          label: 'CMO',            icon: '👥' },
  { id: 'cmv',          label: 'CMV',            icon: '📉' },
  { id: 'dre',          label: 'DRE',            icon: '📑' },
  { id: 'nf',           label: 'Nota Fiscal IA', icon: '🧾', destaque: true },
]

export default function Sidebar({ active, onNav }) {
  const { restaurante, setRestaurante, exportBackup, importBackup } = useStore()
  const [editingNome, setEditingNome] = useState(false)
  const [nomeTemp, setNomeTemp] = useState(restaurante)
  const fileRef = useRef()

  const handleNomeSave = () => {
    setRestaurante(nomeTemp.trim() || 'Meu Restaurante')
    setEditingNome(false)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (file) importBackup(file)
    e.target.value = ''
  }

  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: C.sidebar,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo + Nome do restaurante */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #2a2a2a' }}>
        <div style={{ color: C.amarelo, fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>
          ALPHA
        </div>
        <div style={{ color: C.cinza3, fontSize: 11, marginTop: 2, marginBottom: 10 }}>
          Sistema Financeiro
        </div>

        {editingNome ? (
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              autoFocus
              value={nomeTemp}
              onChange={(e) => setNomeTemp(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleNomeSave(); if (e.key === 'Escape') setEditingNome(false) }}
              style={{
                flex: 1, padding: '4px 6px', borderRadius: 4, border: `1px solid ${C.amarelo}`,
                background: '#222', color: C.branco, fontSize: 11, fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button onClick={handleNomeSave} style={btnSmall('#1B5E20')}>✓</button>
            <button onClick={() => setEditingNome(false)} style={btnSmall('#333')}>✕</button>
          </div>
        ) : (
          <button
            onClick={() => { setNomeTemp(restaurante); setEditingNome(true) }}
            title="Clique para editar"
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: '#888', fontSize: 11, fontFamily: 'inherit', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 4, width: '100%',
            }}
          >
            <span style={{ color: C.branco, fontWeight: 500, fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {restaurante}
            </span>
            <span style={{ fontSize: 10, color: '#555', flexShrink: 0 }}>✏️</span>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {ITEMS.map((item) => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px',
                background: isActive ? '#222222' : 'transparent',
                border: 'none',
                borderLeft: isActive ? `3px solid ${C.amarelo}` : '3px solid transparent',
                color: isActive ? C.branco : item.destaque ? C.amarelo : C.cinza3,
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid #2a2a2a' }}>

        {/* Backup */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: '#555', fontSize: 10, marginBottom: 5, fontWeight: 600, letterSpacing: 0.5 }}>
            BACKUP
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={exportBackup}
              title="Exportar backup JSON"
              style={btnFooter('#1a2a1a', '#4CAF50')}
            >
              ⬇ Exportar
            </button>
            <button
              onClick={() => fileRef.current.click()}
              title="Importar backup JSON"
              style={btnFooter('#1a1a2a', '#5C9BF5')}
            >
              ⬆ Importar
            </button>
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </div>
        </div>

        <div style={{ color: '#333', fontSize: 10 }}>v2.0 · Sistema Financeiro Alpha</div>
      </div>
    </aside>
  )
}

const btnSmall = (bg) => ({
  padding: '4px 7px', borderRadius: 4, border: 'none', background: bg,
  color: C.branco, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
})

const btnFooter = (bg, color) => ({
  flex: 1, padding: '6px 4px', borderRadius: 5,
  border: `1px solid ${color}33`,
  background: bg, color, fontSize: 11,
  cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
})
