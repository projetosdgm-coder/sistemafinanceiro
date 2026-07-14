import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts'
import useStore, { mesCorrente } from '../store/useStore'
import { calcularDRE, calcularCMVReal, calcularCMO } from '../utils/calculations'
import { fmtR, fmtP } from '../utils/formatters'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'

const MES_ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const METRICAS = [
  { id: 'rb',     label: 'Receita Bruta',   cor: '#F97316' },
  { id: 'rl',     label: 'Receita Liquida', cor: '#FB923C' },
  { id: 'cmv',    label: 'CMV',             cor: '#DC2626' },
  { id: 'cmo',    label: 'CMO',             cor: '#D97706' },
  { id: 'desp',   label: 'Despesas',        cor: '#737373' },
  { id: 'ebitda', label: 'EBITDA',          cor: '#16A34A' },
  { id: 'll',     label: 'Lucro Liquido',   cor: '#15803D' },
]

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <div className="font-semibold text-gray-800 dark:text-white mb-0.5">{label}</div>
      <div className="text-gray-600 dark:text-gray-400">{fmtR(payload[0].value)}</div>
    </div>
  )
}

export default function Comparativo() {
  const { ingredientes, funcionarios, fetchAno } = useStore()
  const [ano, setAno] = useState(Number(mesCorrente().slice(0, 4)))
  const [dados, setDados] = useState(null)
  const [metrica, setMetrica] = useState('rb')

  useEffect(() => {
    let vivo = true
    setDados(null)
    fetchAno(ano).then(d => { if (vivo) setDados(d) })
    return () => { vivo = false }
  }, [ano, fetchAno])

  const meses = useMemo(() => {
    if (!dados) return []
    const linhas = []
    for (let m = 1; m <= 12; m++) {
      const mes = `${ano}-${String(m).padStart(2, '0')}`
      const dreRow = dados.dre.find(d => d.mes === mes)
      const estoqueMes = dados.estoque.filter(e => e.mes === mes)
      const compMes = dados.comprovantes.filter(c => c.mes === mes)
      const cmv = calcularCMVReal(estoqueMes, ingredientes)
      const cmo = calcularCMO(funcionarios, compMes)
      const r = calcularDRE(dreRow || {}, cmv, cmo)
      const temDado = !!dreRow || estoqueMes.length > 0 || compMes.length > 0
      linhas.push({ m, mes, abbr: MES_ABBR[m - 1], temDado, rb: r.rb, rl: r.rl, cmv, cmo, desp: r.desp, ebitda: r.ebitda, ll: r.ll })
    }
    return linhas.filter(l => l.temDado)
  }, [dados, ano, ingredientes, funcionarios])

  const totais = useMemo(() => meses.reduce((s, l) => ({
    rb: s.rb + l.rb, rl: s.rl + l.rl, cmv: s.cmv + l.cmv, cmo: s.cmo + l.cmo,
    desp: s.desp + l.desp, ebitda: s.ebitda + l.ebitda, ll: s.ll + l.ll,
  }), { rb: 0, rl: 0, cmv: 0, cmo: 0, desp: 0, ebitda: 0, ll: 0 }), [meses])

  const met = METRICAS.find(x => x.id === metrica)
  const chartData = meses.map(l => ({ abbr: l.abbr, valor: l[metrica] }))

  const TD = 'px-3 py-2.5 text-sm text-right whitespace-nowrap'

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-6 max-w-7xl">
      <PageHeader title="Comparativo Anual">
        <div className="flex items-center gap-1">
          <button onClick={() => setAno(a => a - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">‹</button>
          <span className="min-w-[64px] text-center text-sm font-bold text-gray-900 dark:text-white">{ano}</span>
          <button onClick={() => setAno(a => a + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">›</button>
        </div>
      </PageHeader>

      {dados === null ? (
        <div className="text-center py-12 text-sm text-gray-400 dark:text-gray-500 animate-pulse">Carregando {ano}...</div>
      ) : meses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-10 text-center">
          <div className="text-4xl mb-3">📅</div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">Nenhum dado lancado em {ano}. Preencha o DRE de algum mes para ver o comparativo.</div>
        </div>
      ) : (
        <>
          {/* Totais do ano */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: 'Receita Bruta', v: totais.rb, c: 'text-gray-900 dark:text-white' },
              { l: 'CMV + CMO', v: totais.cmv + totais.cmo, c: 'text-red-600 dark:text-red-400' },
              { l: 'Despesas', v: totais.desp, c: 'text-gray-700 dark:text-gray-300' },
              { l: 'Lucro Liquido', v: totais.ll, c: totais.ll >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' },
            ].map(x => (
              <div key={x.l} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                <div className="text-[11px] uppercase tracking-wider text-gray-400">{x.l} · {ano}</div>
                <div className={`text-lg md:text-xl font-bold mt-1 ${x.c}`}>{fmtR(x.v)}</div>
              </div>
            ))}
          </div>

          {/* Grafico da metrica selecionada */}
          <SectionCard title={`Evolucao mensal — ${met.label}`}>
            <div className="px-4 pt-3 flex flex-wrap gap-1.5">
              {METRICAS.map(mx => (
                <button key={mx.id} onClick={() => setMetrica(mx.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${metrica === mx.id ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                  style={metrica === mx.id ? { backgroundColor: mx.cor } : undefined}>
                  {mx.label}
                </button>
              ))}
            </div>
            <div className="p-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="abbr" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${Math.round(v / 1000)}k`} width={38} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar dataKey="valor" radius={[3, 3, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.valor < 0 ? '#DC2626' : met.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          {/* Tabela mes a mes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mes</th>
                    {['Rec. Bruta', 'Rec. Liq.', 'CMV', 'CMO', 'Despesas', 'EBITDA', 'Lucro Liq.'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {meses.map((l, i) => (
                    <tr key={l.mes} className={`border-t border-gray-100 dark:border-gray-700 ${i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/30'}`}>
                      <td className="px-3 py-2.5 text-sm font-medium text-gray-900 dark:text-white">{l.abbr}</td>
                      <td className={`${TD} text-gray-900 dark:text-white`}>{fmtR(l.rb)}</td>
                      <td className={`${TD} text-gray-600 dark:text-gray-400`}>{fmtR(l.rl)}</td>
                      <td className={`${TD} text-gray-600 dark:text-gray-400`}>{fmtR(l.cmv)}</td>
                      <td className={`${TD} text-gray-600 dark:text-gray-400`}>{fmtR(l.cmo)}</td>
                      <td className={`${TD} text-gray-600 dark:text-gray-400`}>{fmtR(l.desp)}</td>
                      <td className={`${TD} ${l.ebitda >= 0 ? 'text-gray-700 dark:text-gray-300' : 'text-red-600 dark:text-red-400'}`}>{fmtR(l.ebitda)}</td>
                      <td className={`${TD} font-bold ${l.ll >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{fmtR(l.ll)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-t-2 border-gray-200 dark:border-gray-600 font-bold">
                    <td className="px-3 py-2.5 text-sm text-gray-900 dark:text-white">Ano</td>
                    <td className={`${TD} text-gray-900 dark:text-white`}>{fmtR(totais.rb)}</td>
                    <td className={`${TD} text-gray-900 dark:text-white`}>{fmtR(totais.rl)}</td>
                    <td className={`${TD} text-gray-900 dark:text-white`}>{fmtR(totais.cmv)}</td>
                    <td className={`${TD} text-gray-900 dark:text-white`}>{fmtR(totais.cmo)}</td>
                    <td className={`${TD} text-gray-900 dark:text-white`}>{fmtR(totais.desp)}</td>
                    <td className={`${TD} text-gray-900 dark:text-white`}>{fmtR(totais.ebitda)}</td>
                    <td className={`${TD} ${totais.ll >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{fmtR(totais.ll)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="px-4 py-2 text-[11px] text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700">
              Margem liquida do ano: {totais.rl > 0 ? fmtP(totais.ll / totais.rl) : '—'} · CMV {totais.rl > 0 ? fmtP(totais.cmv / totais.rl) : '—'} · CMO {totais.rl > 0 ? fmtP(totais.cmo / totais.rl) : '—'} da Rec. Liquida
            </div>
          </div>
        </>
      )}
    </div>
  )
}
