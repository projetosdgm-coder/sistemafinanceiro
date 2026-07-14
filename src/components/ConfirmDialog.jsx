export default function ConfirmDialog({ isOpen, message, onConfirm, onCancel }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-7 w-[360px] max-w-[90vw] shadow-2xl text-center">
        <div className="text-4xl mb-4">🗑️</div>
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-6 leading-relaxed">
          {message ?? 'Tem certeza que deseja excluir este registro?'}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} className="px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
            Cancelar
          </button>
          <button onClick={onConfirm} className="px-5 py-2 rounded-lg bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors cursor-pointer">
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}
