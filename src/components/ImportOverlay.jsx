export default function ImportOverlay({ open, onClose, children }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/50 md:p-6"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-4xl bg-gray-50 dark:bg-gray-950 md:rounded-2xl shadow-2xl min-h-full md:min-h-0 md:my-auto md:self-center">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 text-lg cursor-pointer bg-transparent border-none"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}
