export default function InputField({
  label, value, onChange, type = 'text', prefix, suffix,
  required, error, disabled, options, placeholder,
}) {
  const isSelect = type === 'select'
  const inputCls = [
    'w-full px-3 py-2 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors',
    disabled
      ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
      : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  ].join(' ')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {label}{required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <div className="flex items-center gap-2">
        {prefix && <span className="text-sm text-gray-400 shrink-0">{prefix}</span>}
        {isSelect ? (
          <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} className={inputCls}>
            {options?.map(o => (
              <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            step={type === 'number' ? 'any' : undefined}
            min={type === 'number' ? 0 : undefined}
            className={inputCls}
          />
        )}
        {suffix && <span className="text-sm text-gray-400 shrink-0">{suffix}</span>}
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
