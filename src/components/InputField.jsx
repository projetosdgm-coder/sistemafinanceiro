import { C } from '../styles/tokens'

export default function InputField({
  label, value, onChange, type = 'text', prefix, suffix,
  required, error, disabled, options, placeholder,
}) {
  const isSelect = type === 'select'
  const base = {
    width: '100%',
    padding: '8px 10px',
    border: `1.5px solid ${disabled ? C.cinza2 : C.azul}`,
    borderRadius: 6,
    background: disabled ? C.cinza : C.azulL,
    color: disabled ? C.preto : C.azul,
    fontSize: 14,
    fontFamily: 'inherit',
    fontWeight: 500,
    outline: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: C.cinza3 }}>
          {label}{required && <span style={{ color: C.verm }}> *</span>}
        </label>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {prefix && <span style={{ fontSize: 13, color: C.cinza3 }}>{prefix}</span>}
        {isSelect ? (
          <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={base}>
            {options?.map((o) => (
              <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(type === 'number' ? e.target.value : e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            step={type === 'number' ? 'any' : undefined}
            min={type === 'number' ? 0 : undefined}
            style={base}
          />
        )}
        {suffix && <span style={{ fontSize: 13, color: C.cinza3 }}>{suffix}</span>}
      </div>
      {error && <span style={{ fontSize: 11, color: C.verm }}>{error}</span>}
    </div>
  )
}
