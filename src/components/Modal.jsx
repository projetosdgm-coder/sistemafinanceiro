import { useState, useEffect } from 'react'
import { C } from '../styles/tokens'
import InputField from './InputField'

export default function Modal({ isOpen, title, fields, initialData, onSave, onClose }) {
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      const defaults = {}
      fields?.forEach((f) => {
        defaults[f.name] = initialData?.[f.name] ?? f.default ?? ''
      })
      setForm(defaults)
      setErrors({})
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const set = (name, value) => setForm((p) => ({ ...p, [name]: value }))

  const validate = () => {
    const errs = {}
    fields?.forEach((f) => {
      if (f.required && !form[f.name] && form[f.name] !== 0) {
        errs[f.name] = 'Campo obrigatório'
      }
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const parsed = {}
    fields?.forEach((f) => {
      parsed[f.name] = f.type === 'number' ? parseFloat(form[f.name]) || 0 : form[f.name]
    })
    onSave(parsed)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: C.branco, borderRadius: 10, width: 480, maxWidth: '90vw',
        maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: `1px solid ${C.cinza2}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
            color: C.cinza3, lineHeight: 1,
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {fields?.map((f) => (
            <InputField
              key={f.name}
              label={f.label}
              type={f.type || 'text'}
              value={form[f.name] ?? ''}
              onChange={(v) => set(f.name, v)}
              required={f.required}
              error={errors[f.name]}
              options={f.options}
              placeholder={f.placeholder}
              prefix={f.prefix}
              suffix={f.suffix}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: `1px solid ${C.cinza2}`,
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button onClick={onClose} style={{
            padding: '8px 20px', borderRadius: 6, border: `1px solid ${C.cinza2}`,
            background: C.branco, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
          }}>
            Cancelar
          </button>
          <button onClick={handleSave} style={{
            padding: '8px 20px', borderRadius: 6, border: 'none',
            background: C.amarelo, color: C.preto, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
          }}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
