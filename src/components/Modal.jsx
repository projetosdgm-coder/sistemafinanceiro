import { useState, useEffect } from 'react'
import InputField from './InputField'

export default function Modal({ isOpen, title, fields, initialData, onSave, onClose }) {
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      const defaults = {}
      fields?.forEach(f => { defaults[f.name] = initialData?.[f.name] ?? f.default ?? '' })
      setForm(defaults)
      setErrors({})
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const set = (name, value) => setForm(p => ({ ...p, [name]: value }))

  const validate = () => {
    const errs = {}
    fields?.forEach(f => {
      if (f.required && !form[f.name] && form[f.name] !== 0) errs[f.name] = 'Campo obrigatorio'
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const parsed = {}
    fields?.forEach(f => { parsed[f.name] = f.type === 'number' ? parseFloat(form[f.name]) || 0 : form[f.name] })
    onSave(parsed)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl w-[480px] max-w-[90vw] max-h-[90vh] overflow-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none cursor-pointer bg-transparent border-none">×</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          {fields?.map(f => (
            <InputField
              key={f.name}
              label={f.label}
              type={f.type || 'text'}
              value={form[f.name] ?? ''}
              onChange={v => set(f.name, v)}
              required={f.required}
              error={errors[f.name]}
              options={f.options}
              placeholder={f.placeholder}
              prefix={f.prefix}
              suffix={f.suffix}
            />
          ))}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <button onClick={onClose} className="px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-600 transition-colors cursor-pointer">
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
