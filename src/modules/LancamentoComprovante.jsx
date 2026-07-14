import { useState, useRef, useCallback } from 'react'
import useStore from '../store/useStore'
import { fmtR } from '../utils/formatters'

const ACCEPT = '.jpg,.jpeg,.png,.pdf,.heic,.heif'
const DRE_CAMPOS = [
  { campo: 'aluguel',   label: 'Aluguel' },
  { campo: 'energia',   label: 'Energia Eletrica' },
  { campo: 'agua',      label: 'Agua' },
  { campo: 'internet',  label: 'Internet / Telefone' },
  { campo: 'marketing', label: 'Marketing' },
  { campo: 'contabil',  label: 'Contabilidade' },
  { campo: 'manut',     label: 'Manutencao' },
  { campo: 'seguros',   label: 'Seguros' },
  { campo: 'pdv',       label: 'Sistema PDV' },
  { campo: 'limpeza',   label: 'Material de Limpeza' },
  { campo: 'outros',    label: 'Outros Custos' },
  { campo: 'depre',     label: 'Depreciacao' },
  { campo: 'juros',     label: 'Juros / Taxas Bancarias' },
  { campo: 'parcelas',  label: 'Parcelas / Financiamentos' },
  { campo: 'ir',        label: 'Imposto de Renda' },
]

const INPUT_CLS = 'w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50'
const LABEL_CLS = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5'

function TelaUpload({ onFile }) {
  const [drag, setDrag] = useState(false)
  const ref = useRef()
  const handleDrop = useCallback(e => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]; if (f) onFile(f)
  }, [onFile])
  return (
    <div className="max-w-lg mx-auto p-8 space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lancamento de Comprovante</h2>
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => ref.current.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${drag ? 'border-primary bg-primary-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-primary/50'}`}
      >
        <div className="text-5xl mb-3">📄</div>
        <div className="font-bold text-gray-800 dark:text-white text-base mb-2">Arraste o comprovante ou clique para selecionar</div>
        <div className="text-gray-400 dark:text-gray-500 text-sm">PIX · Boleto · Transferencia · JPG · PNG · PDF</div>
        <input ref={ref} type="file" accept={ACCEPT} onChange={e => e.target.files[0] && onFile(e.target.files[0])} className="hidden" />
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
        <strong className="text-gray-700 dark:text-gray-300">Como funciona:</strong> A IA le o comprovante, extrai o valor e a descricao. Voce escolhe se e CMO ou despesa operacional.
      </div>
    </div>
  )
}

function TelaAnalisando({ fileName }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center p-8">
      <div className="text-5xl animate-spin">⏳</div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Lendo comprovante...</h2>
      <p className="text-gray-400 dark:text-gray-500 text-sm">{fileName}</p>
    </div>
  )
}

function TelaDestino({ resultado, onEscolher, onCancelar }) {
  return (
    <div className="max-w-lg mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Onde lancar este pagamento?</h2>
        <button onClick={onCancelar} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl bg-transparent border-none cursor-pointer">✕</button>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 rounded-xl p-5">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Pagamento identificado</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{fmtR(resultado.valor || 0)}</div>
        {resultado.descricao && <div className="text-sm text-gray-600 dark:text-gray-400">{resultado.descricao}</div>}
        {resultado.data && <div className="text-xs text-gray-400 mt-1">📅 {resultado.data}</div>}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => onEscolher('cmo')}
          className="flex items-start gap-4 p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all text-left cursor-pointer group"
        >
          <div className="text-3xl">👷</div>
          <div>
            <div className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors">CMO — Mao de Obra</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Motoboy, comissao, diaria, freelancer, pessoal avulso</div>
          </div>
        </button>

        <button
          onClick={() => onEscolher('dre')}
          className="flex items-start gap-4 p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-left cursor-pointer group"
        >
          <div className="text-3xl">📊</div>
          <div>
            <div className="font-bold text-gray-900 dark:text-white mb-1">Despesa Operacional</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Aluguel, energia, internet, contabilidade, manutencao</div>
          </div>
        </button>
      </div>
    </div>
  )
}

function TelaCMO({ resultado, onConfirmar, onCancelar }) {
  const [valor, setValor] = useState(resultado.valor || 0)
  const [descricao, setDescricao] = useState(resultado.descricao || '')
  const [loading, setLoading] = useState(false)

  const handleConfirmar = async () => {
    setLoading(true)
    await onConfirmar({ valor: parseFloat(valor) || 0, descricao })
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto p-8 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lancar no CMO</h2>
        <button onClick={onCancelar} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl bg-transparent border-none cursor-pointer">✕</button>
      </div>

      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
        <div className="text-xs font-bold text-primary uppercase tracking-wider">👷 Custo de Mao de Obra</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sera somado ao CMO e refletido automaticamente no DRE.</div>
      </div>

      <div>
        <label className={LABEL_CLS}>Valor</label>
        <input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} className={INPUT_CLS} />
      </div>

      <div>
        <label className={LABEL_CLS}>Descricao</label>
        <input
          type="text"
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          placeholder="Ex: Motoboy entrega, Comissao Joao, Diaria cozinheiro..."
          className={INPUT_CLS}
        />
      </div>

      <div className="flex gap-3">
        <button onClick={onCancelar}
          className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
          Cancelar
        </button>
        <button onClick={handleConfirmar} disabled={loading}
          className="flex-1 px-5 py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-600 transition-colors cursor-pointer disabled:opacity-50">
          {loading ? 'Lancando...' : 'Confirmar no CMO'}
        </button>
      </div>
    </div>
  )
}

function TelaCategoria({ resultado, categorias, onConfirmar, onCancelar }) {
  const [catSelecionada, setCatSelecionada] = useState(categorias[0]?.id || '__nova__')
  const [novaNome, setNovaNome] = useState('')
  const [novaCampo, setNovaCampo] = useState(DRE_CAMPOS[0].campo)
  const [valor, setValor] = useState(resultado.valor || 0)
  const [loading, setLoading] = useState(false)
  const isnova = catSelecionada === '__nova__'

  const handleConfirmar = async () => {
    if (isnova && !novaNome.trim()) return
    setLoading(true)
    const categoria = isnova
      ? { id: `cat_${Date.now()}`, nome: novaNome.trim(), dre_campo: novaCampo }
      : categorias.find(c => c.id === catSelecionada)
    await onConfirmar({ valor: parseFloat(valor) || 0, categoria, isNova: isnova })
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto p-8 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Classificar pagamento</h2>
        <button onClick={onCancelar} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl bg-transparent border-none cursor-pointer">✕</button>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 rounded-xl p-5">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Pagamento identificado</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{fmtR(resultado.valor || 0)}</div>
        {resultado.descricao && <div className="text-sm text-gray-600 dark:text-gray-400">{resultado.descricao}</div>}
        {resultado.data && <div className="text-xs text-gray-400 mt-1">📅 {resultado.data} · {resultado.tipo || ''}</div>}
      </div>

      <div>
        <label className={LABEL_CLS}>Valor (edite se necessario)</label>
        <input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} className={INPUT_CLS} />
      </div>

      <div>
        <label className={LABEL_CLS}>A que custo se refere este pagamento?</label>
        <select value={catSelecionada} onChange={e => setCatSelecionada(e.target.value)} className={INPUT_CLS}>
          {categorias.map(c => (
            <option key={c.id} value={c.id}>{c.nome} → {DRE_CAMPOS.find(d => d.campo === c.dre_campo)?.label || c.dre_campo}</option>
          ))}
          <option value="__nova__">+ Criar nova categoria</option>
        </select>
      </div>

      {isnova && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
          <div className="text-xs font-bold text-primary uppercase tracking-wider">Nova categoria de custo</div>
          <div>
            <label className={LABEL_CLS}>Nome da categoria</label>
            <input placeholder="Ex: Aluguel do salao, Energia, Contador..." value={novaNome} onChange={e => setNovaNome(e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Onde lancar no DRE?</label>
            <select value={novaCampo} onChange={e => setNovaCampo(e.target.value)} className={INPUT_CLS}>
              {DRE_CAMPOS.map(d => <option key={d.campo} value={d.campo}>{d.label}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onCancelar}
          className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
          Cancelar
        </button>
        <button onClick={handleConfirmar} disabled={loading || (isnova && !novaNome.trim())}
          className="flex-1 px-5 py-2.5 rounded-lg bg-gray-900 dark:bg-primary text-white font-bold text-sm hover:bg-gray-800 dark:hover:bg-primary-600 transition-colors cursor-pointer disabled:opacity-50">
          {loading ? 'Lancando...' : 'Confirmar lancamento'}
        </button>
      </div>
    </div>
  )
}

function TelaSucesso({ valor, destino, categoria, descricao, onNovo, onVerCMO, onVerDRE }) {
  const isCmo = destino === 'cmo'
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center p-8 max-w-md mx-auto">
      <div className="text-6xl">✅</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Custo lancado!</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        <strong className="text-gray-900 dark:text-white">{fmtR(valor)}</strong>{' '}
        {isCmo
          ? <>adicionado ao <strong className="text-gray-900 dark:text-white">CMO</strong>{descricao ? ` (${descricao})` : ''}.</>
          : <>adicionado em <strong className="text-gray-900 dark:text-white">{categoria?.nome}</strong> no DRE.</>
        }
      </p>
      <div className="flex gap-3 w-full mt-4">
        {isCmo ? (
          <button onClick={onVerCMO} className="flex-1 px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
            Ver CMO
          </button>
        ) : (
          <button onClick={onVerDRE} className="flex-1 px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
            Ver DRE
          </button>
        )}
        <button onClick={onNovo} className="flex-1 px-5 py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-600 transition-colors cursor-pointer">
          + Novo comprovante
        </button>
      </div>
    </div>
  )
}

export default function LancamentoComprovante({ onNav }) {
  const { dre, updateDRE, categoriasCusto, addCategoriaCusto, addComprovante } = useStore()
  const [status, setStatus] = useState('upload')
  const [file, setFile] = useState(null)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState(null)
  const [lancamento, setLancamento] = useState(null)

  const handleFile = async (f) => {
    setErro(''); setFile(f); setStatus('analisando')
    try {
      const { analisarComprovante } = await import('../utils/extractNF')
      const res = await analisarComprovante(f)
      setResultado(res); setStatus('destino')
    } catch (e) { setErro(e.message); setStatus('upload') }
  }

  const handleEscolherDestino = (destino) => {
    setStatus(destino === 'cmo' ? 'cmo' : 'categoria')
  }

  const handleConfirmarCMO = async ({ valor, descricao }) => {
    addComprovante({
      id: `comp_${Date.now()}`,
      tipo: 'cmo',
      descricao,
      valor,
      data: resultado.data || null,
      categoria_nome: 'CMO',
    })
    setLancamento({ valor, destino: 'cmo', descricao })
    setStatus('sucesso')
  }

  const handleConfirmarDRE = async ({ valor, categoria, isNova }) => {
    if (isNova) addCategoriaCusto(categoria)
    updateDRE({ [categoria.dre_campo]: (parseFloat(dre[categoria.dre_campo]) || 0) + valor })
    addComprovante({
      id: `comp_${Date.now()}`,
      tipo: 'dre',
      categoria_id: categoria.id,
      categoria_nome: categoria.nome,
      valor,
      data: resultado.data || null,
      descricao: resultado.descricao || null,
    })
    setLancamento({ valor, destino: 'dre', categoria })
    setStatus('sucesso')
  }

  const resetar = () => { setFile(null); setResultado(null); setErro(''); setLancamento(null); setStatus('upload') }

  return (
    <div className="min-h-full">
      {erro && (
        <div className="mx-6 mt-6 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {erro}
        </div>
      )}
      {status === 'upload'     && <TelaUpload onFile={handleFile} />}
      {status === 'analisando' && <TelaAnalisando fileName={file?.name} />}
      {status === 'destino'    && resultado && <TelaDestino resultado={resultado} onEscolher={handleEscolherDestino} onCancelar={resetar} />}
      {status === 'cmo'        && resultado && <TelaCMO resultado={resultado} onConfirmar={handleConfirmarCMO} onCancelar={resetar} />}
      {status === 'categoria'  && resultado && <TelaCategoria resultado={resultado} categorias={categoriasCusto} onConfirmar={handleConfirmarDRE} onCancelar={resetar} />}
      {status === 'sucesso' && lancamento && (
        <TelaSucesso
          valor={lancamento.valor}
          destino={lancamento.destino}
          categoria={lancamento.categoria}
          descricao={lancamento.descricao}
          onNovo={resetar}
          onVerCMO={() => onNav('cmo')}
          onVerDRE={() => onNav('dre')}
        />
      )}
    </div>
  )
}
