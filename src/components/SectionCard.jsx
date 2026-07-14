export default function SectionCard({ title, children, action, className = "" }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
          <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{title}</span>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
