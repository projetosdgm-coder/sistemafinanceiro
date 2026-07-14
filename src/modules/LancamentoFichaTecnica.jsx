import { useState, useRef } from 'react'
import useStore from '../store/useStore'
import { C } from '../styles/tokens'
import { analisarFichaTecnica } from '../utils/extractNF'

function uid() { return crypto.randomUUID() }

function norm(s) {
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, '').trim()
}

function encontrarMatch(nome, lista) {
  const n = norm(nome)
  return lista.find(ing => {
    const e = norm(ing.nome)
    return e === n || e.includes(n) || n.includes(e)
  }) || null
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
    existente: { bg: '#0d2a0d', color: '#69F0AE', label: '🔗 ja existe' },
    novo:      { bg: '#0d1a2a', color: '#5C9BF5', label: '✨ novo'       },
    ignorar:   { bg: '#222',    color: '#555',     label: '✕ ignorar'    },
  }
  const s = cfg[status] || cfg.novo
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
        background: s.bg, color: s.color, whiteSpace: 'nowrap',
      }}>{s.label}</span>
      {status === 'existente' && matchNome && (
        <span style={{ fontSize: 11, color: C.cinza3, whiteSpace: 'nowrap' }}>↔ {matchNome}</span>
      )}
    </div>
  )
}

export default function LancamentoFichaTecnica({ onNav }) {
  const { ingredientes: ingsExistentes, addIngrediente, addReceita, addReceitaItem } = useStore()
  const fileRef = useRef()
  const [estado, setEstado] = useState('idle')
  const [erro, setErro] = useState('')
  const [pratos, setPratos] = useState([])
  const [totalImportados, setTotalImportados] = useState({ pratos: 0, novos: 0 })

  const handleFile = async (file) => {
    if (!file) return
    setErro('')
    setEstado('analisando')
    try {
      const resultado = await analisarFichaTecnica(file)
      if (!resultado?.pratos?.length) throw new Error('Nenhum prato encontrado na imagem.')

      const processados = resultado.pratos.map(prato => ({
        _id: uid(),
        nome: prato.nome || 'Sem nome',
        categoria: prato.categoria || 'Hamburgueres',
        preco: 0,
        incluir: true,
        ingredientes: (prato.ingredientes || []).map(ing => {
          const match = encontrarMatch(ing.nome, ingsExistentes)
          return {
            _id: uid(),
            nome: ing.nome,
            qtd: ing.qtd || 1,
            un: ing.un || 'un',
            status: match ? 'existente' : 'novo',
            matchId: match?.id || null,
            matchNome: match?.nome || null,
            matchUn: match?.un || null,
          }
        }),
      }))

      setPratos(processados)
      setEstado('revisao')
    } catch (err) {
      setErro(err.message || 'Erro ao analisar a ficha tecnica.')
      setEstado('idle')
    }
  }

  const setPrato = (_id, campo, valor) =>
    setPratos(ps => ps.map(p => p._id === _id ? { ...p, [campo]: valor } : p))

  const setIng = (prato_id, ing_id, campo, valor) =>
    setPratos(ps => ps.map(p =>
      p._id !== prato_id ? p : {
        ...p,
        ingredientes: p.ingredientes.map(i =>
          i._id !== ing_id ? i : { ...i, [campo]: valor }
        ),
      }
    ))

  const toggleIngStatus = (prato_id, ing) => {
    const proximo = ing.status === 'ignorar'
      ? (ing.matchId ? 'existente' : 'novo')
      : 'ignorar'
    setIng(prato_id, ing._id, 'status', proximo)
  }

  const handleConfirmar = () => {
    let totalPratos = 0
    let totalNovos = 0
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
          ingId = ing.matchId
          qtdFinal = converterQtd(ing.qtd, ing.un, ing.matchUn)
        } else {
          ingId = uid()
          addIngrediente({ id: ingId, nome: ing.nome, cat: 'Geral', un: ing.un, preco: 0, forn: '' })
          qtdFinal = ing.qtd
          totalNovos++
        }

        addReceitaItem({ prato_id: pratoId, ing_id: ingId, qtd: qtdFinal })
      }
    }

    setTotalImportados({ pratos: totalPratos, novos: totalNovos })
    setEstado('sucesso')
  }

  const pratosIncluidos = pratos.filter(p => p.incluir).length
  const ingsNovos = pratos.flatMap(p =>
    p.incluir ? p.ingredientes.filter(i => i.status === 'novo') : []
  ).length

  // Sucesso
  if (estado === 'sucesso') {
    return (
      <div style={centrStyle}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Importacao concluida!</div>
        <div style={{ color: C.cinza3, marginBottom: 6, maxWidth: 420, lineHeight: 1.6 }}>
          <b>{totalImportados.pratos}</b> prato{totalImportados.pratos !== 1 ? 's' : ''} importado{totalImportados.pratos !== 1 ? 's' : ''} para a Ficha Tecnica.
        </div>
        {totalImportados.novos > 0 && (
          <div style={{ color: '#5C9BF5', fontSize: 13, marginBottom: 24, maxWidth: 420, lineHeight: 1.6 }}>
            ✨ {totalImportados.novos} ingrediente{totalImportados.novos !== 1 ? 's' : ''} novo{totalImportados.novos !== 1 ? 's' : ''} criado{totalImportados.novos !== 1 ? 's' : ''} com preco R$ 0,00. Atualize os precos na aba Ingredientes.
          </div>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => { setPratos([]); setEstado('idle') }} style={btnSec}>
            Importar outra ficha
          </button>
          <button onClick={() => onNav('ficha')} style={btnPrim}>
            Ver Fichas Tecnicas
          </button>
        </div>
      </div>
    )
  }

  // Carregando
  if (estado === 'analisando' || estado === 'salvando') {
    const msgs = estado === 'analisando'
      ? 'Analisando a ficha tecnica...'
      : 'Salvando pratos e ingredientes...'
    return (
      <div style={centrStyle}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 15, color: C.cinza3 }}>{msgs}</div>
      </div>
    )
  }

  // Revisao
  if (estado === 'revisao') {
    return (
      <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>📋 Revisar Importacao</h2>
            <div style={{ color: C.cinza3, fontSize: 13 }}>
              A IA encontrou <b>{pratos.length}</b> pratos. Revise antes de importar.
              {ingsNovos > 0 && <> <span style={{ color: '#5C9BF5' }}>✨ {ingsNovos} ingrediente{ingsNovos !== 1 ? 's' : ''} novo{ingsNovos !== 1 ? 's' : ''}</span> serao criados com preco R$ 0,00.</>}
            </div>
          </div>
          <button onClick={handleConfirmar} style={{ ...btnPrim, whiteSpace: 'nowrap' }}>
            ✓ Confirmar ({pratosIncluidos} prato{pratosIncluidos !== 1 ? 's' : ''})
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {pratos.map(prato => (
            <div key={prato._id} style={{
              background: C.branco, borderRadius: 10,
              border: `1.5px solid ${C.cinza2}`,
              opacity: prato.incluir ? 1 : 0.45,
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', background: '#f5f5f5',
                borderBottom: `1px solid ${C.cinza2}`,
              }}>
                <input
                  type="checkbox"
                  checked={prato.incluir}
                  onChange={e => setPrato(prato._id, 'incluir', e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
                />
                <input
                  value={prato.nome}
                  onChange={e => setPrato(prato._id, 'nome', e.target.value)}
                  style={{ ...inpS, flex: 1, fontWeight: 700, fontSize: 14 }}
                />
                <input
                  value={prato.categoria}
                  onChange={e => setPrato(prato._id, 'categoria', e.target.value)}
                  style={{ ...inpS, width: 150, fontSize: 12 }}
                  placeholder="Categoria"
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: C.cinza3 }}>R$</span>
                  <input
                    type="number"
                    value={prato.preco}
                    onChange={e => setPrato(prato._id, 'preco', parseFloat(e.target.value) || 0)}
                    style={{ ...inpS, width: 80, textAlign: 'right', fontSize: 12 }}
                    min="0" step="0.50"
                  />
                </div>
              </div>

              {/* Ingredientes */}
              {prato.ingredientes.map((ing, idx) => (
                <div key={ing._id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 14px',
                  background: idx % 2 === 0 ? '#fff' : '#fafafa',
                  borderBottom: idx < prato.ingredientes.length - 1 ? `1px solid ${C.cinza2}` : 'none',
                  opacity: ing.status === 'ignorar' ? 0.4 : 1,
                }}>
                  <input
                    value={ing.nome}
                    onChange={e => setIng(prato._id, ing._id, 'nome', e.target.value)}
                    disabled={ing.status === 'ignorar'}
                    style={{ ...inpS, flex: 1, fontSize: 13 }}
                  />
                  <input
                    type="number"
                    value={ing.qtd}
                    onChange={e => setIng(prato._id, ing._id, 'qtd', parseFloat(e.target.value) || 0)}
                    disabled={ing.status === 'ignorar'}
                    style={{ ...inpS, width: 68, textAlign: 'right', fontSize: 13 }}
                    min="0"
                  />
                  <span style={{ fontSize: 12, color: C.cinza3, width: 26, flexShrink: 0 }}>{ing.un}</span>
                  <StatusBadge status={ing.status} matchNome={ing.matchNome} />
                  <button
                    onClick={() => toggleIngStatus(prato._id, ing)}
                    title={ing.status === 'ignorar' ? 'Restaurar' : 'Ignorar'}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
                      color: ing.status === 'ignorar' ? '#69F0AE' : '#bbb',
                      fontSize: 15, padding: '0 2px', lineHeight: 1,
                    }}
                  >
                    {ing.status === 'ignorar' ? '↩' : '✕'}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <button onClick={handleConfirmar} style={btnPrim}>
            ✓ Confirmar importacao
          </button>
        </div>
      </div>
    )
  }

  // Idle — upload
  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>📋 Importar Ficha Tecnica</h2>
      <div style={{ color: C.cinza3, fontSize: 13, marginBottom: 28 }}>
        Envie uma imagem ou PDF da ficha tecnica. A IA extrai todos os pratos e ingredientes — ingredientes ja cadastrados sao identificados automaticamente.
      </div>

      {erro && (
        <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 8, background: '#3a0000', color: '#FF5252', fontSize: 13 }}>
          ❌ {erro}
        </div>
      )}

      <div
        onClick={() => fileRef.current.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
        style={{
          border: `2px dashed ${C.cinza2}`, borderRadius: 14,
          padding: '64px 40px', textAlign: 'center', cursor: 'pointer',
          background: C.branco,
        }}
      >
        <div style={{ fontSize: 52, marginBottom: 14 }}>📄</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
          Clique ou arraste a ficha tecnica aqui
        </div>
        <div style={{ color: C.cinza3, fontSize: 13 }}>
          JPG, PNG ou PDF — pode ter varios pratos na mesma imagem
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={e => handleFile(e.target.files[0])}
        style={{ display: 'none' }}
      />
    </div>
  )
}

const centrStyle = {
  minHeight: '65vh', display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  textAlign: 'center', padding: 40,
}

const inpS = {
  padding: '5px 8px', borderRadius: 5, border: `1px solid ${C.cinza2}`,
  background: '#fff', color: '#111', fontSize: 13,
  fontFamily: 'inherit', outline: 'none',
}

const btnPrim = {
  padding: '10px 22px', borderRadius: 8, border: 'none',
  background: C.amarelo, color: C.preto,
  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
}

const btnSec = {
  padding: '10px 22px', borderRadius: 8, border: `1px solid ${C.cinza2}`,
  background: '#fff', color: C.preto,
  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}
