import { C } from '../styles/tokens'

const CONFIGS = {
  saudavel: { bg: C.verdeL, color: C.verde,  label: '✅ SAUDÁVEL'  },
  atencao:  { bg: '#FFF8E1', color: '#E65100', label: '⚠️ ATENÇÃO'  },
  critico:  { bg: C.vermL,  color: C.verm,   label: '🚨 CRÍTICO'   },
}

export default function Badge({ status }) {
  const cfg = CONFIGS[status] ?? CONFIGS.atencao
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 12,
      background: cfg.bg,
      color: cfg.color,
      fontSize: 11,
      fontWeight: 600,
    }}>
      {cfg.label}
    </span>
  )
}
