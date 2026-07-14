import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useStore from '../store/useStore'

function fmtData(iso) {
  try { return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) }
  catch { return iso }
}

async function authToken() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token
}

export default function RestoreModal({ onClose, onDone }) {
  const { userId, loadFromSupabase } = useStore()
  const [lista, setLista] = useState(null)   // null = carregando
  const [sel, setSel] = useState('')
  const [erro, setErro] = useState('')
  const [fase, setFase] = useState('lista')  // lista | confirmar | restaurando

  useEffect(() => {
    (async () => {
      try {
        const t = await authToken()
        const r = await fetch('/api/restore', { headers: { Authorization: `Bearer ${t}` } })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Falha ao listar backups')
        setLista(d.backups || [])
        if (d.backups?.[0]) setSel(d.backups[0].id)
      } catch (e) { setErro(e.message); setLista([]) }
    })()
  }, [])

  const restaurar = async () => {
    setFase('restaurando'); setErro('')
    try {
      const t = await authToken()
      const r = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ snapshotId: sel }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Falha ao restaurar')
      await loadFromSupabase(userId)
      onDone?.(d)
    } catch (e) { setErro(e.message); setFase('confirmar') }
  }

  const selInfo = lista?.find(b => b.id === sel)

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-xl w-[460px] max-w-[90vw] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Restaurar backup</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none cursor-pointer bg-transparent border-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {erro && (
            <div className="px-4 py-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{erro}</div>
          )}

          {lista === null && (
            <div className="text-center py-6 text-sm text-gray-400">Carregando backups...</div>
          )}

          {lista && lista.length === 0 && !erro && (
            <div className="text-center py-6 text-sm text-gray-400">
              Nenhum backup disponivel ainda. O primeiro snapshot roda automaticamente todo dia de madrugada.
            </div>
          )}

          {lista && lista.length > 0 && fase === 'lista' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Escolha o ponto de restauracao</label>
                <select value={sel} onChange={e => setSel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  {lista.map((b, i) => (
                    <option key={b.id} value={b.id}>{fmtData(b.created_at)}{i === 0 ? ' (mais recente)' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                A restauracao <strong>substitui todos os seus dados atuais</strong> pelos do backup selecionado. Nao da para desfazer.
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={onClose} className="px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button onClick={() => setFase('confirmar')} className="px-5 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-600 transition-colors cursor-pointer">
                  Continuar
                </button>
              </div>
            </>
          )}

          {fase === 'confirmar' && (
            <>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Confirmar restauracao para o backup de <strong className="text-gray-900 dark:text-white">{fmtData(selInfo?.created_at)}</strong>?
                Seus dados atuais serao <strong>apagados e substituidos</strong>.
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setFase('lista')} className="px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                  Voltar
                </button>
                <button onClick={restaurar} className="px-5 py-2 rounded-lg bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors cursor-pointer">
                  Sim, restaurar
                </button>
              </div>
            </>
          )}

          {fase === 'restaurando' && (
            <div className="text-center py-6 flex flex-col items-center gap-3">
              <div className="text-4xl animate-spin">⏳</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Restaurando seus dados...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
