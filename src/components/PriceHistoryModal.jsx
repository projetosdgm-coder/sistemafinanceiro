import { useMemo } from 'react'
import useStore from '../store/useStore'
import { fmtR, fmtP } from '../utils/formatters'

export default function PriceHistoryModal({ ingrediente, onClose }) {
  const { precosHistorico } = useStore()

  const pontos = useMemo(() =>
    precosHistorico
      .filter(p => p.ing_id === ingrediente.id)
      .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || '')),
    [precosHistorico, ingrediente.id])

  const precos = pontos.map(p => p.preco || 0)
  const min = precos.length ? Math.min(...precos) : 0
  const max = precos.length ? Math.max(...precos) : 0
  const primeiro = precos[0] || 0
  const atual = ingrediente.preco || 0
  const variacao = primeiro > 0 ? (atual - primeiro) / primeiro : 0

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-xl w-[460px] max-w-full max-h-[90vh] overflow-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Historico de preco</h3>
            <div className="text-xs text-gray-400">{ingrediente.nome} · por {ingrediente.un}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none cursor-pointer bg-transparent border-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {pontos.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">
              Ainda sem historico. Cada mudanca de preco (edicao manual ou importacao de nota) passa a ser registrada aqui.
            </div>
          ) : (
            <>
              {/* Resumo */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { l: 'Menor', v: fmtR(min), c: 'text-green-600 dark:text-green-400' },
                  { l: 'Atual', v: fmtR(atual), c: 'text-gray-900 dark:text-white' },
                  { l: 'Maior', v: fmtR(max), c: 'text-red-600 dark:text-red-400' },
                ].map(x => (
                  <div key={x.l} className="bg-gray-50 dark:bg-gray-900/40 rounded-lg py-2">
                    <div className="text-[10px] uppercase tracking-wider text-gray-400">{x.l}</div>
                    <div className={`text-sm font-bold ${x.c}`}>{x.v}</div>
                  </div>
                ))}
              </div>
              {pontos.length > 1 && (
                <div className={`text-center text-sm font-semibold ${variacao > 0 ? 'text-red-600 dark:text-red-400' : variacao < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                  {variacao > 0 ? '▲' : variacao < 0 ? '▼' : ''} {fmtP(Math.abs(variacao))} desde o primeiro registro
                </div>
              )}

              {/* Mini grafico de barras */}
              <div className="flex items-end gap-1 h-20 px-1">
                {pontos.map((p, i) => {
                  const h = max > 0 ? Math.max(6, (p.preco / max) * 100) : 6
                  return (
                    <div key={p.id || i} className="flex-1 bg-primary/80 rounded-t" style={{ height: `${h}%` }} title={`${fmtR(p.preco)} · ${p.data || ''}`} />
                  )
                })}
              </div>

              {/* Lista */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-52 overflow-auto">
                {[...pontos].reverse().map((p, i) => (
                  <div key={p.id || i} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">{p.data || '—'}</span>
                      {p.fornecedor && <span className="text-xs text-gray-400 ml-2">{p.fornecedor}</span>}
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{fmtR(p.preco)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
