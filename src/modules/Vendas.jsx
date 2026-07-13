import { useMemo } from 'react'
import useStore from '../store/useStore'
import { C } from '../styles/tokens'
import { fmtR } from '../utils/formatters'
import { calcularCustoPrato } from '../utils/calculations'
import Toast from '../components/Toast'
import { useState } from 'react'

export default function Vendas() {
  const { receitas, receitaItens, ingredientes, vendas, updateVenda } = useStore()
  const [toast, setToast] = useState('')

  const rows = useMemo(() =>
    receitas.map((r) => {
      const custo = calcularCustoPrato(r.id, receitaItens, ingredientes)
      const qtd = vendas.find((v) => v.prato_id === r.id)?.qtd ?? 0
      const recTotal = r.preco * qtd
      const custoTotal = custo * qtd
      const margem = recTotal - custoTotal
      return { ...r, custo, qtd, recTotal, custoTotal, margem }
    }), [receitas, receitaItens, ingredientes, vendas])

  const totais = rows.reduce((s, r) => ({
    qtd: s.qtd + r.qtd,
    recTotal: s.recTotal + r.recTotal,
    custoTotal: s.custoTotal + r.custoTotal,
    margem: s.margem + r.margem,
  }), { qtd: 0, recTotal: 0, custoTotal: 0, margem: 0 })

  const handleQtd = (prato_id, val) => {
    updateVenda(prato_id, Math.max(0, parseInt(val) || 0))
    setToast('Quantidade salva!')
  }

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>🛒 Vendas do Período</h2>

      <div style={{ background: C.branco, borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.cinza }}>
              {['Prato', 'Categoria', 'Preço Venda', 'Custo Unit.', 'Qtd. Vendida', 'Receita Total', 'Custo Total', 'Margem'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: C.cinza3 }}>Nenhum prato cadastrado.</td></tr>
            )}
            {rows.map((r, idx) => (
              <tr key={r.id} style={{ borderTop: `1px solid ${C.cinza2}`, background: idx % 2 === 0 ? C.branco : '#FAFAFA' }}>
                <td style={tdStyle}><strong>{r.nome}</strong></td>
                <td style={tdStyle}>{r.cat}</td>
                <td style={tdStyle}>{fmtR(r.preco)}</td>
                <td style={tdStyle}>{fmtR(r.custo)}</td>
                <td style={{ ...tdStyle, width: 120 }}>
                  <input
                    type="number"
                    min={0}
                    key={r.id + r.qtd}
                    defaultValue={r.qtd}
                    onBlur={(e) => handleQtd(r.id, e.target.value)}
                    style={{
                      width: 90, padding: '6px 8px', borderRadius: 6,
                      border: `1.5px solid ${C.azul}`, background: C.azulL,
                      color: C.azul, fontWeight: 600, fontSize: 14,
                      fontFamily: 'inherit', textAlign: 'center', outline: 'none',
                    }}
                  />
                </td>
                <td style={tdStyle}>{fmtR(r.recTotal)}</td>
                <td style={tdStyle}>{fmtR(r.custoTotal)}</td>
                <td style={{ ...tdStyle, color: r.margem >= 0 ? C.verde : C.verm, fontWeight: 700 }}>
                  {fmtR(r.margem)}
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: `2px solid ${C.cinza2}`, background: C.cinza, fontWeight: 700 }}>
                <td style={tdStyle} colSpan={4}><strong>TOTAL</strong></td>
                <td style={tdStyle}>{totais.qtd}</td>
                <td style={tdStyle}>{fmtR(totais.recTotal)}</td>
                <td style={tdStyle}>{fmtR(totais.custoTotal)}</td>
                <td style={{ ...tdStyle, color: totais.margem >= 0 ? C.verde : C.verm }}>
                  {fmtR(totais.margem)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}

const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.cinza3, whiteSpace: 'nowrap' }
const tdStyle = { padding: '10px 16px', fontSize: 13, verticalAlign: 'middle' }
