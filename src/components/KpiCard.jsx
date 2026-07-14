export default function KpiCard({ label, value, sub, icon, negative = false }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-none">
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-orange-900/30 flex items-center justify-center text-primary shrink-0">
            {icon}
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold leading-none ${negative ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}
