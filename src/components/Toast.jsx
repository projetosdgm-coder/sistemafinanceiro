import { useEffect } from 'react'

export default function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [message])

  if (!message) return null
  return (
    <div className="fixed bottom-7 right-7 z-[3000] bg-green-600 text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-lg">
      ✅ {message}
    </div>
  )
}
