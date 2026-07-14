import useStore, { mesCorrente } from '../store/useStore'

const MESES = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function label(mes) {
  const [y, m] = mes.split('-').map(Number)
  return `${MESES[m - 1]} ${y}`
}
function shift(mes, delta) {
  const [y, m] = mes.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function MonthSelector() {
  const { mesAtual, setMes } = useStore()
  const atual = mesCorrente()

  return (
    <div className="flex items-center justify-center gap-1 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-3 py-2">
      <button
        onClick={() => setMes(shift(mesAtual, -1))}
        aria-label="Mes anterior"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
      >
        ‹
      </button>

      <div className="min-w-[150px] text-center">
        <div className="text-sm font-bold text-gray-900 dark:text-white capitalize">{label(mesAtual)}</div>
        {mesAtual !== atual && (
          <button onClick={() => setMes(atual)} className="text-[11px] text-primary hover:underline cursor-pointer bg-transparent border-none">
            voltar para o mes atual
          </button>
        )}
      </div>

      <button
        onClick={() => setMes(shift(mesAtual, 1))}
        aria-label="Proximo mes"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
      >
        ›
      </button>
    </div>
  )
}
