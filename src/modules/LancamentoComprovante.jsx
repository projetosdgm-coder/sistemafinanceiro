import { useState, useRef, useCallback } from 'react'
import useStore from '../store/useStore'
import { C } from '../styles/tokens'
import { fmtR } from '../utils/formatters'

const ACCEPT = '.jpg,.jpeg,.png,.pdf,.heic,.heif'

const DRE_CAMPOS = [
  { campo: 'aluguel',   label: 'Aluguel' },
  { campo: 'energia',   label: 'Energia Elétrica' },
  { campo: 'agua',      label: 'Água' },
  { campo: 'internet',  label: 'Internet / Telefone' },
  { campo: 'marketing', label: 'Marketing' },
  { campo: 'contabil',  label: 'Contabilidade' },
  { campo: 'manut',     label: 'Manutenção' },
  { campo: 'seguros',   label: 'Seguros' },
  { campo: 'pdv',       label: 'Sistema PDV' },
  { campo: 'limpeza',   label: 'Material de Limpeza' },
  { campo: 'outros',    label: 'Outros Custos' },
  { campo: 'depre',     label: 'Depreciação' },
  { campo: 'juros',     label: 'Juros / Taxas Bancárias' },
  { campo: 'parcelas',  label: 'Parcelas / Financiamentos' },
  { campo: 'ir',        label: 'Imposto de Renda' },
]

// ── Tela: upload ──────────────────────────────────────────────────────────────
function TelaUpload({ onFile }) {
  const [drag, setDrag] = useState(false)
  const ref = useRef()

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }, [onFile])

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', padding: 32 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>💳 Lançamento de Comprovante</h2>

      <div
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => ref.current.click()}
        style={{
          border: `2px dashed ${drag ? C.amarelo : C.cinza2}`,
          borderRadius: 12, padding: '48px 32px', textAlign: 'center',
          cursor: 'pointer', transition: 'all 0.2s',
          background: drag ? '#FFFDE7' : C.branco,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>
          Arraste o comprovante ou clique para selecionar
        </div>
        <div style={{ color: C.cinza3, fontSize: 12 }}>
          PIX · Boleto · Transferência · JPG · PNG · PDF
        </div>
        <input ref={ref} type="file" accept={ACCEPT} onChange={e => e.target.files[0] && onFile(e.target.files[0])} style={{ display: 'none' }} />
      </div>

      <div style={{ marginTop: 20, background: C.cinza, borderRadius: 8, padding: '12px 16px', fontSize: 12, color: C.cinza3 }}>
        <strong style={{ color: C.preto }}>Como funciona:</strong> A IA lê o comprovante, extrai o valor e a descrição.
        Você escolhe a categoria do custo e ele é lançado automaticamente no DRE.
      </div>
    </div>
  )
}

// ── Tela: analisando ──────────────────────────────────────────────────────────
function TelaAnalisando({ fileName }) {
  return (
    <div style={{ maxWidth: 400, margin: '80px auto', textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 48, marginBottom: 20, animation: 'spin 2s linear infinite' }}>🔄</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Lendo comprovante...</h2>
      <p style={{ color: C.cinza3, fontSize: 13 }}>{fileName}</p>
    </div>
  )
}

// ── Tela: categoria ───────────────────────────────────────────────────────────
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

    let categoria
    if (isnova) {
      categoria = {
        id: `cat_${Date.now()}`,
        nome: novaNome.trim(),
        dre_campo: novaCampo,
      }
    } else {
      categoria = categorias.find(c => c.id === catSelecionada)
    }

    await onConfirmar({ valor: parseFloat(valor) || 0, categoria, isNova: isnova })
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Classificar pagamento</h2>
        <button onClick={onCancelar} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.cinza3 }}>✕</button>
      </div>

      {/* Info extraída */}
      <div style={{ background: C.azulL, borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: C.cinza3, marginBottom: 6 }}>Pagamento identificado:</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.azul, marginBottom: 4 }}>{fmtR(resultado.valor || 0)}</div>
        {resultado.descricao && <div style={{ fontSize: 13, color: C.preto }}>{resultado.descricao}</div>}
        {resultado.data && <div style={{ fontSize: 12, color: C.cinza3, marginTop: 4 }}>📅 {resultado.data} · {resultado.tipo || ''}</div>}
      </div>

      {/* Valor editável */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelS}>Valor (edite se necessário)</label>
        <input
          type="number" step="0.01" value={valor}
          onChange={e => setValor(e.target.value)}
          style={inputS}
        />
      </div>

      {/* Seleção de categoria */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelS}>A que custo se refere este pagamento?</label>
        <select value={catSelecionada} onChange={e => setCatSelecionada(e.target.value)} style={inputS}>
          {categorias.map(c => (
            <option key={c.id} value={c.id}>{c.nome} → {DRE_CAMPOS.find(d => d.campo === c.dre_campo)?.label || c.dre_campo}</option>
          ))}
          <option value="__nova__">+ Criar nova categoria</option>
        </select>
      </div>

      {/* Nova categoria */}
      {isnova && (
        <div style={{ background: '#FFF8E1', borderRadius: 10, padding: '16px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.laranja }}>Nova categoria de custo</div>
          <div>
            <label style={labelS}>Nome da categoria</label>
            <input
              placeholder="Ex: Aluguel do salão, Energia, Contador..."
              value={novaNome}
              onChange={e => setNovaNome(e.target.value)}
              style={inputS}
            />
          </div>
          <div>
            <label style={labelS}>Onde lançar no DRE?</label>
            <select value={novaCampo} onChange={e => setNovaCampo(e.target.value)} style={inputS}>
              {DRE_CAMPOS.map(d => <option key={d.campo} value={d.campo}>{d.label}</option>)}
            </select>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onCancelar} style={btnSec}>Cancelar</button>
        <button
          onClick={handleConfirmar}
          disabled={loading || (isnova && !novaNome.trim())}
          style={{ ...btnPrimary, flex: 1, opacity: (loading || (isnova && !novaNome.trim())) ? 0.6 : 1 }}
        >
          {loading ? '⏳ Lançando...' : '✅ Confirmar lançamento'}
        </button>
      </div>
    </div>
  )
}

// ── Tela: sucesso ─────────────────────────────────────────────────────────────
function TelaSucesso({ valor, categoria, onNovo, onVerDRE }) {
  return (
    <div style={{ maxWidth: 440, margin: '60px auto', textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Custo lançado!</h2>
      <p style={{ color: C.cinza3, fontSize: 14, marginBottom: 24 }}>
        <strong>{fmtR(valor)}</strong> adicionado em <strong>{categoria.nome}</strong> no DRE.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onVerDRE} style={{ ...btnSec, flex: 1 }}>📑 Ver DRE</button>
        <button onClick={onNovo} style={{ ...btnPrimary, flex: 1 }}>+ Novo comprovante</button>
      </div>
    </div>
  )
}

// ── Módulo principal ──────────────────────────────────────────────────────────
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
      setResultado(res)
      setStatus('categoria')
    } catch (e) {
      setErro(e.message); setStatus('upload')
    }
  }

  const handleConfirmar = async ({ valor, categoria, isNova }) => {
    if (isNova) addCategoriaCusto(categoria)

    // Atualiza o campo do DRE
    const campoAtual = parseFloat(dre[categoria.dre_campo]) || 0
    updateDRE({ [categoria.dre_campo]: campoAtual + valor })

    // Salva registro do comprovante
    addComprovante({
      id: `comp_${Date.now()}`,
      categoria_id: categoria.id,
      categoria_nome: categoria.nome,
      valor,
      data: resultado.data || null,
      descricao: resultado.descricao || null,
    })

    setLancamento({ valor, categoria })
    setStatus('sucesso')
  }

  const resetar = () => { setFile(null); setResultado(null); setErro(''); setLancamento(null); setStatus('upload') }

  return (
    <div style={{ padding: status === 'categoria' ? 0 : 32, minHeight: '100%' }}>
      {erro && (
        <div style={{ background: C.vermL, border: `1px solid ${C.verm}`, borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: C.verm }}>
          ❌ {erro}
        </div>
      )}
      {status === 'upload'    && <TelaUpload onFile={handleFile} />}
      {status === 'analisando' && <TelaAnalisando fileName={file?.name} />}
      {status === 'categoria' && (
        <TelaCategoria resultado={resultado} categorias={categoriasCusto}
          onConfirmar={handleConfirmar} onCancelar={resetar} />
      )}
      {status === 'sucesso' && lancamento && (
        <TelaSucesso valor={lancamento.valor} categoria={lancamento.categoria}
          onNovo={resetar} onVerDRE={() => onNav('dre')} />
      )}
    </div>
  )
}

const btnPrimary = { padding: '11px 24px', borderRadius: 8, border: 'none', background: C.preto, color: C.amarelo, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }
const btnSec     = { padding: '11px 20px', borderRadius: 8, border: `1px solid ${C.cinza2}`, background: C.branco, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }
const labelS     = { display: 'block', fontSize: 12, fontWeight: 600, color: C.cinza3, marginBottom: 6 }
const inputS     = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${C.cinza2}`, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: C.branco }
