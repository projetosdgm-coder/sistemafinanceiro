import { useEffect } from 'react'
import { C } from '../styles/tokens'

export default function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [message])

  if (!message) return null
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 3000,
      background: C.verde, color: C.branco,
      padding: '12px 22px', borderRadius: 8,
      fontWeight: 600, fontSize: 14,
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      animation: 'fadeIn 0.2s ease',
    }}>
      ✅ {message}
    </div>
  )
}
