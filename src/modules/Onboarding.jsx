import { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import Logo from '../components/Logo'

const TOUR = [
  { tab: 'dashboard',    titulo: 'Dashboard',      texto: 'Sua visao geral: receita, custos, lucro e os indicadores comparados com o benchmark do setor. E a primeira tela que voce ve ao entrar.' },
  { tab: 'ingredientes', titulo: 'Ingredientes',   texto: 'Cadastro dos insumos e seus precos. E a base para calcular o custo de cada prato. Use "+ Novo Ingrediente" para adicionar.' },
  { tab: 'ficha',        titulo: 'Ficha Tecnica',  texto: 'Monte cada prato com seus ingredientes e quantidades. "+ Novo Prato" cadastra manualmente; "Importar por IA" le uma foto ou PDF da ficha e cria tudo automaticamente.' },
  { tab: 'vendas',       titulo: 'Vendas',         texto: '"+ Lancar Venda" registra o faturamento por canal (Salao, Delivery, iFood, Eventos) e periodo. Esse valor alimenta a Receita do DRE.' },
  { tab: 'estoque',      titulo: 'Estoque',        texto: 'Controle de entradas e saidas. "Importar Nota / Comprovante" le a nota por IA, corrige nomes e ja lanca os insumos no estoque.' },
  { tab: 'cmo',          titulo: 'CMO',            texto: 'Custo de Mao de Obra: colaboradores fixos + lancamentos avulsos (motoboy, diaria, comissao). "Importar Comprovante" le pagamentos e classifica.' },
  { tab: 'cmv',          titulo: 'CMV',            texto: 'Custo da Mercadoria Vendida: compara o teorico (fichas x vendas) com o real (consumo do estoque) e mostra a variancia, que e o desperdicio.' },
  { tab: 'dre',          titulo: 'DRE',            texto: 'O demonstrativo de resultado completo. "Importar Comprovante" lanca despesas; o botao "PDF" gera o relatorio profissional para voce e para o contador.' },
]

const INPUT_CLS = 'w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-primary/50'

export default function Onboarding({ onNav }) {
  const { salvarNomeNegocio, concluirOnboarding } = useStore()
  const [fase, setFase] = useState('nome')   // nome | tour
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [passo, setPasso] = useState(0)

  // Ao entrar em cada passo do tour, navega para a aba correspondente
  useEffect(() => {
    if (fase === 'tour') onNav?.(TOUR[passo].tab)
  }, [fase, passo, onNav])

  const salvarNome = async () => {
    const limpo = nome.trim()
    if (limpo.length < 2) { setErro('Digite o nome do seu negocio.'); return }
    setSalvando(true); setErro('')
    const { error } = await salvarNomeNegocio(limpo)
    setSalvando(false)
    if (error) { setErro(`Nao foi possivel salvar: ${error.message || error}`); return }
    setFase('tour')
  }

  const finalizar = async () => {
    await concluirOnboarding()   // marca onboarded=true; App remove o overlay
  }

  // ---- Fase 1: nome do negocio ----
  if (fase === 'nome') {
    return (
      <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
        <div className="w-[440px] max-w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="mb-2">
            <span className="dark:hidden"><Logo variant="lockup" theme="light" size={26} /></span>
            <span className="hidden dark:inline"><Logo variant="lockup" theme="dark" size={26} /></span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bem-vindo! 👋</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Para comecar, qual o nome do seu negocio? Ele aparece nos relatorios e fica fixo no sistema.
          </p>

          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Nome do negocio / empresa</label>
          <input
            autoFocus
            value={nome}
            onChange={e => setNome(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && salvarNome()}
            placeholder="Ex: Broncs Meat House"
            className={INPUT_CLS}
          />
          {erro && <div className="mt-3 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{erro}</div>}

          <button
            onClick={salvarNome}
            disabled={salvando}
            className="w-full mt-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-600 transition-colors cursor-pointer disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : 'Salvar e continuar'}
          </button>
        </div>
      </div>
    )
  }

  // ---- Fase 2: tour pelas abas ----
  const s = TOUR[passo]
  const ultimo = passo === TOUR.length - 1
  return (
    <div className="fixed inset-x-0 bottom-0 z-[4000] flex justify-center p-4 pointer-events-none">
      <div className="w-[520px] max-w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-6 pointer-events-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Tutorial · Passo {passo + 1} de {TOUR.length}</span>
          <button onClick={finalizar} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline bg-transparent border-none cursor-pointer">
            Pular tutorial
          </button>
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">{s.titulo}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{s.texto}</p>

        {/* progresso */}
        <div className="flex gap-1.5 mt-4 mb-4">
          {TOUR.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= passo ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />
          ))}
        </div>

        <div className="flex justify-between gap-3">
          <button
            onClick={() => setPasso(p => Math.max(0, p - 1))}
            disabled={passo === 0}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            onClick={() => ultimo ? finalizar() : setPasso(p => p + 1)}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-600 transition-colors cursor-pointer"
          >
            {ultimo ? 'Concluir' : 'Proximo'}
          </button>
        </div>
      </div>
    </div>
  )
}
