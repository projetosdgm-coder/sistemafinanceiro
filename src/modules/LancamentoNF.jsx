import { useState, useRef, useCallback } from 'react'
import useStore from '../store/useStore'
import { fmtR } from '../utils/formatters'

const UNS  = ['un','kg','g','L','ml','cx','pc','fd','lt','sc']
const ACCEPT = '.jpg,.jpeg,.png,.pdf,.heic,.heif'

// Campos do DRE onde uma compra operacional (nao-CMV) pode ser lancada
const DESPESA_CAMPOS = [
  { campo: 'limpeza',   label: 'Material de Limpeza' },
  { campo: 'outros',    label: 'Outros Custos' },
  { campo: 'manut',     label: 'Manutencao' },
  { campo: 'marketing', label: 'Marketing' },
  { campo: 'pdv',       label: 'Sistema PDV' },
  { campo: 'energia',   label: 'Energia' },
  { campo: 'agua',      label: 'Agua' },
  { campo: 'internet',  label: 'Internet' },
]

const blankItem = (seed = {}) => ({
  nome_nota: seed.nome_nota ?? '',
  nome_limpo: seed.nome_limpo ?? seed.nome_nota ?? '',
  destino: seed.destino === 'despesa' ? 'despesa' : 'cmv',
  dre_campo: seed.dre_campo ?? 'limpeza',
  ing_id: null,
  qtd: seed.qtd ?? 1,
  un: seed.un ?? 'un',
  precoUnit: seed.precoUnit ?? 0,
  precoTotal: seed.precoTotal ?? 0,
  incluir: true,
  nome_novo: seed.nome_novo ?? seed.nome_limpo ?? seed.nome_nota ?? '',
})

function DropZone({ onFile, title, subtitle, icon }) {
  const [drag, setDrag] = useState(false)
  const ref = useRef()
  const handleDrop = useCallback(e => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]; if (f) onFile(f)
  }, [onFile])
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => ref.current.click()}
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${drag ? 'border-primary bg-primary-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-primary/50'}`}
    >
      <div className="text-5xl mb-3">{icon}</div>
      <div className="font-bold text-gray-800 dark:text-white text-base mb-2">Arraste aqui ou clique para selecionar</div>
      <div className="text-gray-400 dark:text-gray-500 text-sm">{subtitle}</div>
      <input ref={ref} type="file" accept={ACCEPT} onChange={e => e.target.files[0] && onFile(e.target.files[0])} className="hidden" />
    </div>
  )
}

function TelaUpload({ onFile }) {
  return (
    <div className="max-w-lg mx-auto p-8 space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lancamento por Nota ou Comprovante</h2>
      <DropZone onFile={onFile} icon="📎" subtitle="Nota fiscal ou comprovante PIX · JPG · PNG · PDF · HEIC" />
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
        <strong className="text-gray-700 dark:text-gray-300">Como funciona:</strong> A IA le a nota fiscal e identifica os ingredientes automaticamente. Comprou algo no PIX sem nota? Envie o comprovante e detalhe manualmente o que foi comprado antes de importar.
      </div>
    </div>
  )
}

function TelaAnalisando({ fileName }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center p-8">
      <div className="text-5xl animate-spin">⏳</div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Analisando nota fiscal...</h2>
      <p className="text-gray-400 dark:text-gray-500 text-sm">{fileName}</p>
    </div>
  )
}

function TelaConfirmacao({ resultado, itens, setItens, ingredientes, onAddItem, onConfirmar, onCancelar, loading }) {
  const updateItem = (idx, campo, valor) =>
    setItens(prev => prev.map((it, i) => i === idx ? { ...it, [campo]: valor } : it))
  const removeItem = (idx) => setItens(prev => prev.filter((_, i) => i !== idx))
  const incluidos = itens.filter(i => i.incluir)
  const cmvItens = incluidos.filter(i => i.destino !== 'despesa')
  const despesaItens = incluidos.filter(i => i.destino === 'despesa')
  const totalCmv = cmvItens.reduce((s, i) => s + (parseFloat(i.precoTotal) || 0), 0)
  const totalDespesa = despesaItens.reduce((s, i) => s + (parseFloat(i.precoTotal) || 0), 0)
  const total = totalCmv + totalDespesa
  const novos = cmvItens.filter(i => !i.ing_id).length
  const isComprovante = resultado.tipo_doc === 'comprovante'

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Confirmar importacao</h2>
          <div className="text-sm text-gray-400 dark:text-gray-500 flex gap-4">
            {resultado.fornecedor && <span>📍 {resultado.fornecedor}</span>}
            {resultado.data && <span>📅 {resultado.data}</span>}
          </div>
        </div>
        <button onClick={onCancelar} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl bg-transparent border-none cursor-pointer">✕</button>
      </div>

      {isComprovante && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
          <strong>Comprovante de pagamento</strong> — sem itens discriminados. Detalhe abaixo o que foi comprado (ajuste o nome, quantidade e unidade, e divida em varios itens se precisar com <strong>+ Adicionar item</strong>).
        </div>
      )}

      <div className="flex gap-3 flex-wrap items-center">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400">CMV — ingrediente casado</span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">CMV — ingrediente novo</span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">Despesa — vai pro DRE</span>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-600 dark:text-gray-300 flex flex-wrap gap-x-6 gap-y-1">
        <span>🧾 <strong className="text-gray-900 dark:text-white">{fmtR(totalCmv)}</strong> para o estoque (CMV)</span>
        <span>🧽 <strong className="text-gray-900 dark:text-white">{fmtR(totalDespesa)}</strong> em despesas operacionais (DRE)</span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                {['','Item na Nota','Destino','Classificacao','Qtd','Un','Preco Unit.','Total',''].map((h, i) => (
                  <th key={i} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itens.map((item, idx) => {
                const isDespesa = item.destino === 'despesa'
                const rowBg = !item.incluir
                  ? 'opacity-40'
                  : isDespesa
                    ? 'bg-purple-50/40 dark:bg-purple-900/10'
                    : item.ing_id
                      ? 'bg-green-50/30 dark:bg-green-900/10'
                      : 'bg-amber-50/30 dark:bg-amber-900/10'
                return (
                <tr key={idx} className={`border-t border-gray-100 dark:border-gray-700 transition-opacity ${rowBg}`}>
                  <td className="px-3 py-2 w-8 text-center">
                    <input type="checkbox" checked={item.incluir} onChange={e => updateItem(idx,'incluir',e.target.checked)} />
                  </td>
                  <td className="px-3 py-2 max-w-[160px]">
                    <div className="font-semibold text-gray-800 dark:text-gray-200">{item.nome_nota}</div>
                    {item.nome_limpo && item.nome_limpo !== item.nome_nota && (
                      <div className="text-[11px] text-gray-400 dark:text-gray-500">→ {item.nome_limpo}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 w-28">
                    <select value={item.destino} onChange={e => updateItem(idx,'destino',e.target.value)} disabled={!item.incluir}
                      className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs focus:outline-none">
                      <option value="cmv">CMV (Estoque)</option>
                      <option value="despesa">Despesa (DRE)</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 min-w-[170px]">
                    {isDespesa ? (
                      <select value={item.dre_campo} onChange={e => updateItem(idx,'dre_campo',e.target.value)} disabled={!item.incluir}
                        className="w-full px-2 py-1 rounded border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs focus:outline-none">
                        {DESPESA_CAMPOS.map(d => <option key={d.campo} value={d.campo}>{d.label}</option>)}
                      </select>
                    ) : (
                      <>
                        <select value={item.ing_id || '__novo__'}
                          onChange={e => updateItem(idx,'ing_id', e.target.value === '__novo__' ? null : e.target.value)}
                          disabled={!item.incluir}
                          className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs focus:outline-none">
                          <option value="__novo__">+ Novo ingrediente</option>
                          {ingredientes.map(i => <option key={i.id} value={i.id}>{i.nome} ({i.un})</option>)}
                        </select>
                        {!item.ing_id && item.incluir && (
                          <input placeholder="Nome do novo ingrediente" value={item.nome_novo || ''}
                            onChange={e => updateItem(idx,'nome_novo',e.target.value)}
                            className="mt-1 w-full px-2 py-1 rounded border border-primary bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs focus:outline-none" />
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2 w-20">
                    <input type="number" min={0} step="any" value={item.qtd}
                      onChange={e => updateItem(idx,'qtd',parseFloat(e.target.value)||0)}
                      disabled={!item.incluir}
                      className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs text-center focus:outline-none" />
                  </td>
                  <td className="px-3 py-2 w-16">
                    <select value={item.un} onChange={e => updateItem(idx,'un',e.target.value)} disabled={!item.incluir}
                      className="w-full px-1 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs focus:outline-none">
                      {UNS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 w-24">
                    <input type="number" min={0} step="0.01" value={item.precoUnit}
                      onChange={e => {
                        const v = parseFloat(e.target.value)||0
                        updateItem(idx,'precoUnit',v)
                        updateItem(idx,'precoTotal',v*item.qtd)
                      }}
                      disabled={!item.incluir}
                      className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs text-right focus:outline-none" />
                  </td>
                  <td className="px-3 py-2 font-semibold text-gray-900 dark:text-white w-24">{fmtR(item.precoTotal)}</td>
                  <td className="px-3 py-2 w-8 text-center">
                    <button onClick={() => removeItem(idx)} title="Remover linha"
                      className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 text-base leading-none bg-transparent border-none cursor-pointer">✕</button>
                  </td>
                </tr>
              )})}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-t-2 border-gray-200 dark:border-gray-600 font-semibold">
                <td colSpan={6} className="px-3 py-2" />
                <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">Total:</td>
                <td className="px-3 py-2 text-sm font-bold text-green-600 dark:text-green-400">{fmtR(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="px-3 py-2.5 border-t border-gray-100 dark:border-gray-700">
          <button onClick={onAddItem}
            className="px-3 py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:border-primary hover:text-primary transition-colors cursor-pointer">
            + Adicionar item
          </button>
        </div>
      </div>

      {novos > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <strong>{novos} novo{novos > 1 ? 's ingrediente' : ' ingrediente'}</strong> sera criado automaticamente.
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onCancelar} disabled={loading}
          className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50">
          Cancelar
        </button>
        <button onClick={onConfirmar} disabled={loading}
          className="flex-1 px-5 py-2.5 rounded-lg bg-gray-900 dark:bg-primary text-white font-bold text-sm hover:bg-gray-800 dark:hover:bg-primary-600 transition-colors cursor-pointer disabled:opacity-50">
          {loading ? 'Importando...' : `Confirmar e importar ${itens.filter(i=>i.incluir).length} itens`}
        </button>
      </div>
    </div>
  )
}

function TelaSucesso({ stats, onNova, onVerEstoque }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center p-8 max-w-md mx-auto">
      <div className="text-6xl">✅</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nota importada com sucesso!</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full mb-4">
        {[
          { label: 'Itens no estoque', value: stats.importados, cls: 'text-green-600 dark:text-green-400' },
          { label: 'Precos atualizados', value: stats.precos, cls: 'text-blue-600 dark:text-blue-400' },
          { label: 'Novos ingredientes', value: stats.novos, cls: 'text-primary' },
          { label: 'Despesas no DRE', value: fmtR(stats.despesas || 0), cls: 'text-purple-600 dark:text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <div className={`text-xl font-bold ${s.cls}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 w-full">
        <button onClick={onVerEstoque} className="flex-1 px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
          Ver Estoque
        </button>
        <button onClick={onNova} className="flex-1 px-5 py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-600 transition-colors cursor-pointer">
          + Nova Nota
        </button>
      </div>
    </div>
  )
}

export default function LancamentoNF({ onNav }) {
  const store = useStore()
  const { ingredientes, estoque, dre, updateIngrediente, updateEstoque, addIngrediente, addEstoque, updateDRE } = store

  const [status, setStatus] = useState('upload')
  const [file, setFile] = useState(null)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState(null)
  const [itens, setItens] = useState([])
  const [stats, setStats] = useState({ importados: 0, precos: 0, novos: 0, despesas: 0 })
  const [loadingConfirm, setLoadingConfirm] = useState(false)

  const handleFile = async (f) => {
    setErro(''); setFile(f); setStatus('analisando')
    try {
      const { analisarNF } = await import('../utils/extractNF')
      const res = await analisarNF(f, ingredientes)
      setResultado(res)
      const mapped = (res.itens || []).map(item => blankItem(item))
      // Comprovante sem itens lidos: garante ao menos uma linha para o usuario detalhar
      setItens(mapped.length ? mapped : [blankItem()])
      setStatus('confirmando')
    } catch (e) { setErro(e.message); setStatus('upload') }
  }

  const handleConfirmar = () => {
    setLoadingConfirm(true)
    let importados = 0, precos = 0, novos = 0
    const despesaAcc = {}   // campo do DRE -> soma
    itens.filter(i => i.incluir).forEach(item => {
      // Item de despesa operacional: soma no campo do DRE, nao vai pro estoque
      if (item.destino === 'despesa') {
        const campo = item.dre_campo || 'outros'
        despesaAcc[campo] = (despesaAcc[campo] || 0) + (parseFloat(item.precoTotal) || 0)
        return
      }
      // Item de CMV: vai para estoque/ingredientes
      if (item.ing_id) {
        const ing = ingredientes.find(x => x.id === item.ing_id)
        if (ing && Math.abs(ing.preco - item.precoUnit) > 0.005) { updateIngrediente(item.ing_id, { preco: item.precoUnit, forn: resultado.fornecedor || ing.forn }); precos++ }
        const est = estoque.find(x => x.ing_id === item.ing_id)
        if (est) updateEstoque(item.ing_id, { compras: (est.compras || 0) + item.qtd })
        else addEstoque({ ing_id: item.ing_id, ei: 0, compras: item.qtd, ef: 0 })
        importados++
      } else {
        const novoId = `i${Date.now()}${Math.floor(Math.random()*1000)}`
        addIngrediente({ id: novoId, nome: (item.nome_novo || item.nome_limpo || item.nome_nota).trim(), cat: 'Outros', un: item.un, preco: item.precoUnit, forn: resultado.fornecedor || '' })
        addEstoque({ ing_id: novoId, ei: 0, compras: item.qtd, ef: 0 })
        importados++; novos++
      }
    })
    // Aplica as despesas no DRE (uma vez por campo)
    let despesasTotal = 0
    Object.entries(despesaAcc).forEach(([campo, val]) => {
      updateDRE({ [campo]: (parseFloat(dre[campo]) || 0) + val })
      despesasTotal += val
    })
    setStats({ importados, precos, novos, despesas: despesasTotal })
    setLoadingConfirm(false)
    setStatus('sucesso')
  }

  const resetar = () => { setFile(null); setResultado(null); setItens([]); setErro(''); setStatus('upload') }

  return (
    <div className="min-h-full">
      {erro && (
        <div className="mx-6 mt-6 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {erro}
        </div>
      )}
      {status === 'upload'      && <TelaUpload onFile={handleFile} />}
      {status === 'analisando'  && <TelaAnalisando fileName={file?.name} />}
      {status === 'confirmando' && <TelaConfirmacao resultado={resultado} itens={itens} setItens={setItens} ingredientes={ingredientes} onAddItem={() => setItens(prev => [...prev, blankItem()])} onConfirmar={handleConfirmar} onCancelar={resetar} loading={loadingConfirm} />}
      {status === 'sucesso'     && <TelaSucesso stats={stats} onNova={resetar} onVerEstoque={() => onNav('estoque')} />}
    </div>
  )
}
