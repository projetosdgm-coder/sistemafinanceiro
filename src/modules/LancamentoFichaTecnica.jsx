import { useState, useRef } from 'react'
import useStore from '../store/useStore'
import { analisarFichaTecnica } from '../utils/extractNF'

function uid() { return crypto.randomUUID() }

function norm(s) {
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, '').trim()
}

function encontrarMatch(nome, lista) {
  const n = norm(nome)
  return lista.find(ing => { const e = norm(ing.nome); return e === n || e.includes(n) || n.includes(e) }) || null
}

function converterQtd(qtd, deUn, paraUn) {
  if (!deUn || !paraUn || deUn === paraUn) return qtd
  if (deUn === 'g'  && paraUn === 'kg') return +(qtd / 1000).toFixed(4)
  if (deUn === 'kg' && paraUn === 'g')  return +(qtd * 1000).toFixed(4)
  if (deUn === 'ml' && paraUn === 'L')  return +(qtd / 1000).toFixed(4)
  if (deUn === 'L'  && paraUn === 'ml') return +(qtd * 1000).toFixed(4)
  return qtd
}

function StatusBadge({ status, matchNome }) {
  const cfg = {
    existente: { cls: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400', label: 'ja existe' },
    novo:      { cls: 'bg-primary-50 dark:bg-orange-900/20 text-primary-700 dark:text-primary', label: 'novo'      },
    ignorar:   { cls: 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500',       label: 'ignorar'   },
  }
  const s = cfg[status] || cfg.novo
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${s.cls}`}>{s.label}</span>
      {status === 'existente' && matchNome && (
        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap hidden sm:inline">↔ {matchNome}</span>
      )}
    </div>
  )
}

const INP_CLS = 'px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50'

export default function LancamentoFichaTecnica({ onNav }) {
  const { ingredientes: ingsExistentes, addIngrediente, addReceita, addReceitaItem } = useStore()
  const fileRef = useRef()
  const [estado, setEstado] = useState('idle')
  const [erro, setErro] = useState('')
  const [pratos, setPratos] = useState([])
  const [totalImportados, setTotalImportados] = useState({ pratos: 0, novos: 0 })

  const handleFile = async (file) => {
    if (!file) return
    setErro(''); setEstado('analisando')
    try {
      const resultado = await analisarFichaTecnica(file)
      if (!resultado?.pratos?.length) throw new Error('Nenhum prato encontrado na imagem.')
      const processados = resultado.pratos.map(prato => ({
        _id: uid(), nome: prato.nome || 'Sem nome', categoria: prato.categoria || 'Hamburgueres',
        preco: 0, incluir: true,
        ingredientes: (prato.ingredientes || []).map(ing => {
          const match = encontrarMatch(ing.nome, ingsExistentes)
          return { _id: uid(), nome: ing.nome, qtd: ing.qtd || 1, un: ing.un || 'un',
            status: match ? 'existente' : 'novo', matchId: match?.id || null, matchNome: match?.nome || null, matchUn: match?.un || null }
        }),
      }))
      setPratos(processados); setEstado('revisao')
    } catch (err) { setErro(err.message || 'Erro ao analisar.'); setEstado('idle') }
  }

  const setPrato = (_id, campo, valor) => setPratos(ps => ps.map(p => p._id === _id ? { ...p, [campo]: valor } : p))
  const setIng = (prato_id, ing_id, campo, valor) =>
    setPratos(ps => ps.map(p => p._id !== prato_id ? p : { ...p, ingredientes: p.ingredientes.map(i => i._id !== ing_id ? i : { ...i, [campo]: valor }) }))
  const toggleIngStatus = (prato_id, ing) => {
    const proximo = ing.status === 'ignorar' ? (ing.matchId ? 'existente' : 'novo') : 'ignorar'
    setIng(prato_id, ing._id, 'status', proximo)
  }

  const handleConfirmar = () => {
    let totalPratos = 0, totalNovos = 0
    setEstado('salvando')
    for (const prato of pratos) {
      if (!prato.incluir) continue
      totalPratos++
      const pratoId = uid()
      addReceita({ id: pratoId, nome: prato.nome, cat: prato.categoria, preco: prato.preco })
      for (const ing of prato.ingredientes) {
        if (ing.status === 'ignorar') continue
        let ingId, qtdFinal
        if (ing.status === 'existente' && ing.matchId) {
          ingId = ing.matchId; qtdFinal = converterQtd(ing.qtd, ing.un, ing.matchUn)
        } else {
          ingId = uid()
          addIngrediente({ id: ingId, nome: ing.nome, cat: 'Geral', un: ing.un, preco: 0, forn: '' })
          qtdFinal = ing.qtd; totalNovos++
        }
        addReceitaItem({ prato_id: pratoId, ing_id: ingId, qtd: qtdFinal })
      }
    }
    setTotalImportados({ pratos: totalPratos, novos: totalNovos })
    setEstado('sucesso')
  }

  const pratosIncluidos = pratos.filter(p => p.incluir).length
  const ingsNovos = pratos.flatMap(p => p.incluir ? p.ingredientes.filter(i => i.status === 'novo') : []).length

  if (estado === 'sucesso') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8 max-w-md mx-auto">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Importacao concluida!</h2>
        <p className="text-gray-500 dark:text-gray-400">
          <strong className="text-gray-900 dark:text-white">{totalImportados.pratos}</strong> prato{totalImportados.pratos !== 1 ? 's' : ''} importado{totalImportados.pratos !== 1 ? 's' : ''} para a Ficha Tecnica.
        </p>
        {totalImportados.novos > 0 && (
          <p className="text-primary text-sm">
            ✨ {totalImportados.novos} ingrediente{totalImportados.novos !== 1 ? 's' : ''} novo{totalImportados.novos !== 1 ? 's' : ''} criado{totalImportados.novos !== 1 ? 's' : ''} com preco R$ 0,00. Atualize os precos na aba Ingredientes.
          </p>
        )}
        <div className="flex gap-3 w-full mt-2">
          <button onClick={() => { setPratos([]); setEstado('idle') }}
            className="flex-1 px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
            Importar outra ficha
          </button>
          <button onClick={() => onNav('ficha')}
            className="flex-1 px-5 py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-600 transition-colors cursor-pointer">
            Ver Fichas Tecnicas
          </button>
        </div>
      </div>
    )
  }

  if (estado === 'analisando' || estado === 'salvando') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
        <div className="text-5xl animate-spin">⏳</div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{estado === 'analisando' ? 'Analisando a ficha tecnica...' : 'Salvando pratos e ingredientes...'}</p>
      </div>
    )
  }

  if (estado === 'revisao') {
    return (
      <div className="p-6 md:p-8 space-y-5 max-w-4xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Revisar Importacao</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              A IA encontrou <strong>{pratos.length}</strong> pratos. Revise antes de importar.
              {ingsNovos > 0 && <span className="text-primary"> ✨ {ingsNovos} ingrediente{ingsNovos !== 1 ? 's' : ''} novo{ingsNovos !== 1 ? 's' : ''} serao criados com preco R$ 0,00.</span>}
            </p>
          </div>
          <button onClick={handleConfirmar}
            className="shrink-0 px-5 py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
            Confirmar ({pratosIncluidos} prato{pratosIncluidos !== 1 ? 's' : ''})
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {pratos.map(prato => (
            <div key={prato._id} className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-opacity ${prato.incluir ? 'opacity-100' : 'opacity-40'}`}>
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <input type="checkbox" checked={prato.incluir} onChange={e => setPrato(prato._id,'incluir',e.target.checked)}
                  className="w-4 h-4 cursor-pointer shrink-0" />
                <input value={prato.nome} onChange={e => setPrato(prato._id,'nome',e.target.value)}
                  className={`${INP_CLS} flex-1 font-bold`} />
                <input value={prato.categoria} onChange={e => setPrato(prato._id,'categoria',e.target.value)}
                  placeholder="Categoria" className={`${INP_CLS} w-36 text-xs`} />
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-gray-400">R$</span>
                  <input type="number" value={prato.preco} min="0" step="0.50"
                    onChange={e => setPrato(prato._id,'preco',parseFloat(e.target.value)||0)}
                    className={`${INP_CLS} w-20 text-right text-xs`} />
                </div>
              </div>

              {prato.ingredientes.map((ing, idx) => (
                <div key={ing._id} className={`flex items-center gap-2 px-4 py-2 transition-opacity ${ing.status === 'ignorar' ? 'opacity-30' : ''} ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/30'} border-t border-gray-100 dark:border-gray-700 first:border-0`}>
                  <input value={ing.nome} onChange={e => setIng(prato._id,ing._id,'nome',e.target.value)}
                    disabled={ing.status === 'ignorar'} className={`${INP_CLS} flex-1 text-sm`} />
                  <input type="number" value={ing.qtd} min="0"
                    onChange={e => setIng(prato._id,ing._id,'qtd',parseFloat(e.target.value)||0)}
                    disabled={ing.status === 'ignorar'} className={`${INP_CLS} w-16 text-right text-sm`} />
                  <span className="text-xs text-gray-400 w-7 shrink-0">{ing.un}</span>
                  <StatusBadge status={ing.status} matchNome={ing.matchNome} />
                  <button onClick={() => toggleIngStatus(prato._id, ing)} title={ing.status === 'ignorar' ? 'Restaurar' : 'Ignorar'}
                    className={`shrink-0 w-6 h-6 flex items-center justify-center rounded text-sm bg-transparent border-none cursor-pointer ${ing.status === 'ignorar' ? 'text-green-500' : 'text-gray-300 hover:text-red-400'} transition-colors`}>
                    {ing.status === 'ignorar' ? '↩' : '✕'}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="text-right">
          <button onClick={handleConfirmar}
            className="px-6 py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-600 transition-colors cursor-pointer">
            Confirmar importacao
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Importar Ficha Tecnica</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Envie uma imagem ou PDF da ficha tecnica. A IA extrai todos os pratos e ingredientes — os ja cadastrados sao identificados automaticamente.
        </p>
      </div>

      {erro && (
        <div className="px-4 py-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{erro}</div>
      )}

      <div
        onClick={() => fileRef.current.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
        className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl py-16 text-center cursor-pointer hover:border-primary/50 transition-colors bg-white dark:bg-gray-800"
      >
        <div className="text-5xl mb-4">📄</div>
        <div className="font-bold text-gray-800 dark:text-white text-base mb-2">Clique ou arraste a ficha tecnica aqui</div>
        <div className="text-gray-400 dark:text-gray-500 text-sm">JPG, PNG ou PDF — pode ter varios pratos na mesma imagem</div>
      </div>
      <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={e => handleFile(e.target.files[0])} className="hidden" />
    </div>
  )
}
