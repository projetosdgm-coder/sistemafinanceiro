import { useState, useRef, useCallback } from 'react'
import useStore from '../store/useStore'
import { C } from '../styles/tokens'
import { fmtR } from '../utils/formatters'

const CATS = ['Panificação','Proteínas','Laticínios','Hortifrúti','Molhos','Óleos','Bebidas','Embalagens','Condimentos','Outros']
const UNS  = ['un','kg','g','L','ml','cx','pc','fd','lt','sc']
const ACCEPT = '.jpg,.jpeg,.png,.pdf,.heic,.heif'

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
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>🧾 Lançamento por Nota Fiscal</h2>

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
        <div style={{ fontSize: 48, marginBottom: 12 }}>📎</div>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>
          Arraste aqui ou clique para selecionar
        </div>
        <div style={{ color: C.cinza3, fontSize: 12 }}>
          JPG · PNG · PDF · HEIC (foto de iPhone)
        </div>
        <input ref={ref} type="file" accept={ACCEPT} onChange={e => e.target.files[0] && onFile(e.target.files[0])} style={{ display: 'none' }} />
      </div>

      <div style={{ marginTop: 20, background: C.cinza, borderRadius: 8, padding: '12px 16px', fontSize: 12, color: C.cinza3 }}>
        <strong style={{ color: C.preto }}>Como funciona:</strong> A IA lê a nota, identifica os ingredientes,
        casa com o seu cadastro e apresenta um resumo para você confirmar antes de importar.
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
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Analisando nota fiscal...</h2>
      <p style={{ color: C.cinza3, fontSize: 13 }}>{fileName}</p>
    </div>
  )
}

// ── Tela: confirmação ─────────────────────────────────────────────────────────
function TelaConfirmacao({ resultado, itens, setItens, ingredientes, onConfirmar, onCancelar, loading }) {
  const updateItem = (idx, campo, valor) =>
    setItens(prev => prev.map((it, i) => i === idx ? { ...it, [campo]: valor } : it))

  const total = itens.filter(i => i.incluir).reduce((s, i) => s + (parseFloat(i.precoTotal) || 0), 0)
  const novos = itens.filter(i => i.incluir && !i.ing_id).length

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Confirmar importação</h2>
          <div style={{ fontSize: 13, color: C.cinza3 }}>
            {resultado.fornecedor && <span>📍 {resultado.fornecedor}</span>}
            {resultado.data && <span style={{ marginLeft: 12 }}>📅 {resultado.data}</span>}
          </div>
        </div>
        <button onClick={onCancelar} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.cinza3 }}>✕</button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 11 }}>
        <span style={{ ...badge('#E8F5E9','#1B5E20') }}>🟢 Ingrediente casado</span>
        <span style={{ ...badge('#FFF8E1','#E65100') }}>🟡 Ingrediente novo</span>
        <span style={{ ...badge('#FFEBEE','#B71C1C') }}>⊘ Ignorar</span>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: C.cinza }}>
              {['✓','Item na Nota','Ingrediente no Sistema','Qtd','Un','Preço Unit.','Total'].map(h => (
                <th key={h} style={thS}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {itens.map((item, idx) => (
              <tr key={idx} style={{
                borderTop: `1px solid ${C.cinza2}`,
                background: !item.incluir ? '#FAFAFA' : item.ing_id ? '#FAFFFE' : '#FFFDF0',
                opacity: item.incluir ? 1 : 0.5,
              }}>
                <td style={{ ...tdS, width: 32, textAlign: 'center' }}>
                  <input type="checkbox" checked={item.incluir}
                    onChange={e => updateItem(idx, 'incluir', e.target.checked)} />
                </td>
                <td style={tdS}><div style={{ fontWeight: 600, maxWidth: 180 }}>{item.nome_nota}</div></td>
                <td style={{ ...tdS, minWidth: 180 }}>
                  <select
                    value={item.ing_id || '__novo__'}
                    onChange={e => updateItem(idx, 'ing_id', e.target.value === '__novo__' ? null : e.target.value)}
                    style={selectS} disabled={!item.incluir}
                  >
                    <option value="__novo__">+ Novo ingrediente</option>
                    {ingredientes.map(i => <option key={i.id} value={i.id}>{i.nome} ({i.un})</option>)}
                  </select>
                  {!item.ing_id && item.incluir && (
                    <input placeholder="Nome do novo ingrediente" value={item.nome_novo || ''}
                      onChange={e => updateItem(idx, 'nome_novo', e.target.value)}
                      style={{ ...selectS, marginTop: 4, borderColor: C.laranja }} />
                  )}
                </td>
                <td style={{ ...tdS, width: 70 }}>
                  <input type="number" min={0} step="any" value={item.qtd}
                    onChange={e => updateItem(idx, 'qtd', parseFloat(e.target.value) || 0)}
                    style={numS} disabled={!item.incluir} />
                </td>
                <td style={{ ...tdS, width: 60 }}>
                  <select value={item.un} onChange={e => updateItem(idx, 'un', e.target.value)}
                    style={{ ...numS, padding: '4px 2px' }} disabled={!item.incluir}>
                    {UNS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </td>
                <td style={{ ...tdS, width: 90 }}>
                  <input type="number" min={0} step="0.01" value={item.precoUnit}
                    onChange={e => {
                      const v = parseFloat(e.target.value) || 0
                      updateItem(idx, 'precoUnit', v)
                      updateItem(idx, 'precoTotal', v * item.qtd)
                    }}
                    style={numS} disabled={!item.incluir} />
                </td>
                <td style={{ ...tdS, fontWeight: 600, width: 90 }}>{fmtR(item.precoTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: C.cinza, fontWeight: 700 }}>
              <td colSpan={5} style={tdS} />
              <td style={tdS}>Total:</td>
              <td style={{ ...tdS, color: C.verde }}>{fmtR(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {novos > 0 && (
        <div style={{ background: '#FFF8E1', border: `1px solid #FFE082`, borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 12 }}>
          ⚠️ <strong>{novos} novo{novos > 1 ? 's ingrediente' : ' ingrediente'}</strong> será criado automaticamente.
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onCancelar} style={btnSec} disabled={loading}>Cancelar</button>
        <button onClick={onConfirmar} style={{ ...btnPrimary, flex: 1 }} disabled={loading}>
          {loading ? '⏳ Importando...' : `✅ Confirmar e importar ${itens.filter(i=>i.incluir).length} itens`}
        </button>
      </div>
    </div>
  )
}

// ── Tela: sucesso ─────────────────────────────────────────────────────────────
function TelaSucesso({ stats, onNova, onVerEstoque }) {
  return (
    <div style={{ maxWidth: 440, margin: '60px auto', textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Nota importada com sucesso!</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 32 }}>
        <StatBox label="Itens importados" value={stats.importados} color={C.verde} />
        <StatBox label="Preços atualizados" value={stats.precos} color={C.azul} />
        <StatBox label="Novos ingredientes" value={stats.novos} color={C.laranja} />
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onVerEstoque} style={{ ...btnSec, flex: 1 }}>📦 Ver Estoque</button>
        <button onClick={onNova} style={{ ...btnPrimary, flex: 1 }}>+ Nova Nota</button>
      </div>
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: C.cinza, borderRadius: 8, padding: '16px 8px' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: C.cinza3, marginTop: 4 }}>{label}</div>
    </div>
  )
}

// ── Módulo principal ──────────────────────────────────────────────────────────
export default function LancamentoNF({ onNav }) {
  const store = useStore()
  const { ingredientes, estoque, updateIngrediente, updateEstoque, addIngrediente, addEstoque } = store

  const [status, setStatus] = useState('upload')
  const [file, setFile] = useState(null)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState(null)
  const [itens, setItens] = useState([])
  const [stats, setStats] = useState({ importados: 0, precos: 0, novos: 0 })
  const [loadingConfirm, setLoadingConfirm] = useState(false)

  const handleFile = async (f) => {
    setErro(''); setFile(f); setStatus('analisando')
    try {
      const { analisarNF } = await import('../utils/extractNF')
      const res = await analisarNF(f, ingredientes)
      setResultado(res)
      setItens((res.itens || []).map(item => ({ ...item, incluir: true, nome_novo: item.nome_nota })))
      setStatus('confirmando')
    } catch (e) {
      setErro(e.message); setStatus('upload')
    }
  }

  const handleConfirmar = () => {
    setLoadingConfirm(true)
    let importados = 0, precos = 0, novos = 0

    itens.filter(i => i.incluir).forEach(item => {
      if (item.ing_id) {
        const ing = ingredientes.find(x => x.id === item.ing_id)
        if (ing && Math.abs(ing.preco - item.precoUnit) > 0.005) {
          updateIngrediente(item.ing_id, { preco: item.precoUnit, forn: resultado.fornecedor || ing.forn })
          precos++
        }
        const est = estoque.find(x => x.ing_id === item.ing_id)
        if (est) updateEstoque(item.ing_id, { compras: (est.compras || 0) + item.qtd })
        else addEstoque({ ing_id: item.ing_id, ei: 0, compras: item.qtd, ef: 0 })
        importados++
      } else {
        const novoId = `i${Date.now()}${Math.floor(Math.random() * 1000)}`
        const nome = (item.nome_novo || item.nome_nota).trim()
        addIngrediente({ id: novoId, nome, cat: 'Outros', un: item.un, preco: item.precoUnit, forn: resultado.fornecedor || '' })
        addEstoque({ ing_id: novoId, ei: 0, compras: item.qtd, ef: 0 })
        importados++; novos++
      }
    })

    setStats({ importados, precos, novos })
    setLoadingConfirm(false)
    setStatus('sucesso')
  }

  const resetar = () => { setFile(null); setResultado(null); setItens([]); setErro(''); setStatus('upload') }

  return (
    <div style={{ padding: status === 'confirmando' ? 0 : 32, minHeight: '100%' }}>
      {erro && (
        <div style={{ background: C.vermL, border: `1px solid ${C.verm}`, borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: C.verm }}>
          ❌ {erro}
        </div>
      )}
      {status === 'upload'      && <TelaUpload onFile={handleFile} />}
      {status === 'analisando'  && <TelaAnalisando fileName={file?.name} />}
      {status === 'confirmando' && (
        <TelaConfirmacao resultado={resultado} itens={itens} setItens={setItens}
          ingredientes={ingredientes} onConfirmar={handleConfirmar} onCancelar={resetar} loading={loadingConfirm} />
      )}
      {status === 'sucesso' && (
        <TelaSucesso stats={stats} onNova={resetar} onVerEstoque={() => onNav('estoque')} />
      )}
    </div>
  )
}

const btnPrimary = { padding: '11px 24px', borderRadius: 8, border: 'none', background: C.preto, color: C.amarelo, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }
const btnSec     = { padding: '11px 20px', borderRadius: 8, border: `1px solid ${C.cinza2}`, background: C.branco, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }
const thS        = { padding: '9px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.cinza3, whiteSpace: 'nowrap' }
const tdS        = { padding: '8px 10px', fontSize: 12, verticalAlign: 'middle' }
const numS       = { width: '100%', padding: '4px 6px', border: `1px solid ${C.cinza2}`, borderRadius: 4, fontSize: 12, fontFamily: 'inherit' }
const selectS    = { width: '100%', padding: '4px 6px', border: `1px solid ${C.cinza2}`, borderRadius: 4, fontSize: 12, fontFamily: 'inherit', background: C.branco }
const badge      = (bg, color) => ({ background: bg, color, padding: '3px 10px', borderRadius: 20, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 })
