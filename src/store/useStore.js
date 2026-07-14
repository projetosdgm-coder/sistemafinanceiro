import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { DRE0 } from '../utils/seedData'

const sb = supabase

// Dispara o request sem bloquear a UI; loga erros silenciosamente
const fire = (query) => query.then(({ error }) => { if (error) console.error('[db]', error) })

// Mes corrente no formato YYYY-MM
export const mesCorrente = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const useStore = create((set, get) => ({
  userId: null,
  restaurante: 'Meu Restaurante',
  onboarded: false,
  loaded: false,
  mesAtual: mesCorrente(),

  // Globais (catalogo — nao mudam por mes)
  ingredientes: [],
  receitas: [],
  receitaItens: [],
  funcionarios: [],
  categoriasCusto: [],
  precosHistorico: [],

  // Mensais (uma copia por mes — recarregadas ao trocar de mes)
  vendas: [],
  estoque: [],
  dre: { ...DRE0 },
  comprovantes: [],
  vendasLancamentos: [],

  // Carrega globais (uma vez) + os dados do mes atual
  loadFromSupabase: async (userId) => {
    const mes = get().mesAtual
    set({ userId, loaded: false })
    const [
      { data: perfil },
      { data: ingredientes },
      { data: receitas },
      { data: receitaItens },
      { data: funcionarios },
      { data: categoriasCusto },
      { data: precosHistorico },
    ] = await Promise.all([
      sb.from('perfis').select('*').eq('id', userId).single(),
      sb.from('ingredientes').select('*').eq('user_id', userId),
      sb.from('receitas').select('*').eq('user_id', userId),
      sb.from('receita_itens').select('*').eq('user_id', userId),
      sb.from('funcionarios').select('*').eq('user_id', userId),
      sb.from('categorias_custo').select('*').eq('user_id', userId),
      sb.from('precos_historico').select('*').eq('user_id', userId),
    ])

    if (!perfil) {
      await sb.from('perfis').upsert({ id: userId, restaurante: 'Meu Restaurante' })
    }

    set({
      restaurante: perfil?.restaurante || 'Meu Restaurante',
      onboarded: !!perfil?.onboarded,
      ingredientes: ingredientes || [],
      receitas: receitas || [],
      receitaItens: receitaItens || [],
      funcionarios: funcionarios || [],
      categoriasCusto: categoriasCusto || [],
      precosHistorico: precosHistorico || [],
    })

    await get().carregarMes(mes)
    set({ loaded: true })
  },

  // Carrega apenas os dados mensais do mes informado
  carregarMes: async (mes) => {
    const { userId } = get()
    if (!userId) { set({ mesAtual: mes }); return }
    const [
      { data: vendas },
      { data: estoque },
      { data: dre },
      { data: comprovantes },
      { data: vendasLancamentos },
    ] = await Promise.all([
      sb.from('vendas').select('*').eq('user_id', userId).eq('mes', mes),
      sb.from('estoque').select('*').eq('user_id', userId).eq('mes', mes),
      sb.from('dre').select('*').eq('user_id', userId).eq('mes', mes).maybeSingle(),
      sb.from('comprovantes').select('*').eq('user_id', userId).eq('mes', mes),
      sb.from('vendas_lancamentos').select('*').eq('user_id', userId).eq('mes', mes),
    ])
    set({
      mesAtual: mes,
      vendas: vendas || [],
      estoque: estoque || [],
      dre: dre ? { ...DRE0, ...dre } : { ...DRE0 },
      comprovantes: comprovantes || [],
      vendasLancamentos: vendasLancamentos || [],
    })
  },

  setMes: async (mes) => { await get().carregarMes(mes) },

  // Perfil — grava o nome do negocio. Awaited e devolve erro (nao falha calado).
  salvarNomeNegocio: async (nome) => {
    const restaurante = (nome || '').trim() || 'Meu Restaurante'
    set({ restaurante })
    const { userId } = get()
    if (!userId) return { error: null }
    const { error } = await sb.from('perfis').upsert({ id: userId, restaurante })
    if (error) console.error('[db] salvarNomeNegocio', error)
    return { error }
  },

  concluirOnboarding: async () => {
    set({ onboarded: true })
    const { userId } = get()
    if (!userId) return { error: null }
    const { error } = await sb.from('perfis').upsert({ id: userId, onboarded: true })
    if (error) console.error('[db] concluirOnboarding', error)
    return { error }
  },

  setRestaurante: (restaurante) => {
    set({ restaurante })
    const { userId } = get()
    if (userId) fire(sb.from('perfis').upsert({ id: userId, restaurante }))
  },

  // ---------- Ingredientes (global) ----------
  addIngrediente: (ing) => {
    set((s) => ({ ingredientes: [...s.ingredientes, ing] }))
    const { userId } = get()
    if (userId) fire(sb.from('ingredientes').insert({ ...ing, user_id: userId }))
  },

  updateIngrediente: (id, data) => {
    set((s) => ({ ingredientes: s.ingredientes.map((x) => x.id === id ? { ...x, ...data } : x) }))
    const { userId } = get()
    if (userId) fire(sb.from('ingredientes').update(data).eq('id', id).eq('user_id', userId))
  },

  deleteIngrediente: (id) => {
    set((s) => ({
      ingredientes: s.ingredientes.filter((x) => x.id !== id),
      receitaItens: s.receitaItens.filter((x) => x.ing_id !== id),
      estoque: s.estoque.filter((x) => x.ing_id !== id),
    }))
    const { userId } = get()
    if (userId) fire(sb.from('ingredientes').delete().eq('id', id).eq('user_id', userId))
  },

  // ---------- Historico de precos (global) ----------
  addPrecoHistorico: (entry) => {
    const reg = { id: `ph_${Date.now()}_${Math.floor(Math.random() * 1000)}`, ...entry }
    set((s) => ({ precosHistorico: [...s.precosHistorico, reg] }))
    const { userId } = get()
    if (userId) fire(sb.from('precos_historico').insert({ ...reg, user_id: userId }))
  },

  // ---------- Receitas (global) ----------
  addReceita: (rec) => {
    set((s) => ({ receitas: [...s.receitas, rec] }))
    const { userId } = get()
    if (userId) fire(sb.from('receitas').insert({ ...rec, user_id: userId }))
  },

  updateReceita: (id, data) => {
    set((s) => ({ receitas: s.receitas.map((x) => x.id === id ? { ...x, ...data } : x) }))
    const { userId } = get()
    if (userId) fire(sb.from('receitas').update(data).eq('id', id).eq('user_id', userId))
  },

  deleteReceita: (id) => {
    set((s) => ({
      receitas: s.receitas.filter((x) => x.id !== id),
      receitaItens: s.receitaItens.filter((x) => x.prato_id !== id),
      vendas: s.vendas.filter((x) => x.prato_id !== id),
    }))
    const { userId } = get()
    if (userId) fire(sb.from('receitas').delete().eq('id', id).eq('user_id', userId))
  },

  // ---------- Itens de Receita (global) ----------
  addReceitaItem: (item) => {
    set((s) => ({ receitaItens: [...s.receitaItens, item] }))
    const { userId } = get()
    if (userId) fire(sb.from('receita_itens').upsert({ ...item, user_id: userId }))
  },

  updateReceitaItem: (prato_id, ing_id, data) => {
    set((s) => ({
      receitaItens: s.receitaItens.map((x) =>
        x.prato_id === prato_id && x.ing_id === ing_id ? { ...x, ...data } : x
      ),
    }))
    const { userId } = get()
    if (userId) fire(sb.from('receita_itens').update(data)
      .eq('prato_id', prato_id).eq('ing_id', ing_id).eq('user_id', userId))
  },

  deleteReceitaItem: (prato_id, ing_id) => {
    set((s) => ({
      receitaItens: s.receitaItens.filter(
        (x) => !(x.prato_id === prato_id && x.ing_id === ing_id)
      ),
    }))
    const { userId } = get()
    if (userId) fire(sb.from('receita_itens').delete()
      .eq('prato_id', prato_id).eq('ing_id', ing_id).eq('user_id', userId))
  },

  // ---------- Vendas por prato (mensal) ----------
  updateVenda: (prato_id, qtd) => {
    const mes = get().mesAtual
    set((s) => {
      const exists = s.vendas.find((x) => x.prato_id === prato_id)
      return {
        vendas: exists
          ? s.vendas.map((x) => x.prato_id === prato_id ? { ...x, qtd } : x)
          : [...s.vendas, { prato_id, qtd, mes }],
      }
    })
    const { userId } = get()
    if (userId) fire(sb.from('vendas').upsert(
      { prato_id, qtd, user_id: userId, mes },
      { onConflict: 'user_id,prato_id,mes' }
    ))
  },

  // ---------- Estoque (mensal) ----------
  addEstoque: (item) => {
    const mes = get().mesAtual
    set((s) => ({ estoque: [...s.estoque, { ...item, mes }] }))
    const { userId } = get()
    if (userId) fire(sb.from('estoque').upsert(
      { ...item, user_id: userId, mes },
      { onConflict: 'user_id,ing_id,mes' }
    ))
  },

  updateEstoque: (ing_id, data) => {
    const mes = get().mesAtual
    set((s) => ({ estoque: s.estoque.map((x) => x.ing_id === ing_id ? { ...x, ...data } : x) }))
    const { userId } = get()
    if (userId) fire(sb.from('estoque').update(data).eq('ing_id', ing_id).eq('user_id', userId).eq('mes', mes))
  },

  deleteEstoque: (ing_id) => {
    const mes = get().mesAtual
    set((s) => ({ estoque: s.estoque.filter((x) => x.ing_id !== ing_id) }))
    const { userId } = get()
    if (userId) fire(sb.from('estoque').delete().eq('ing_id', ing_id).eq('user_id', userId).eq('mes', mes))
  },

  // ---------- Funcionarios (global) ----------
  addFuncionario: (func) => {
    set((s) => ({ funcionarios: [...s.funcionarios, func] }))
    const { userId } = get()
    if (userId) fire(sb.from('funcionarios').insert({ ...func, user_id: userId }))
  },

  updateFuncionario: (id, data) => {
    set((s) => ({ funcionarios: s.funcionarios.map((x) => x.id === id ? { ...x, ...data } : x) }))
    const { userId } = get()
    if (userId) fire(sb.from('funcionarios').update(data).eq('id', id).eq('user_id', userId))
  },

  deleteFuncionario: (id) => {
    set((s) => ({ funcionarios: s.funcionarios.filter((x) => x.id !== id) }))
    const { userId } = get()
    if (userId) fire(sb.from('funcionarios').delete().eq('id', id).eq('user_id', userId))
  },

  // ---------- DRE (mensal) ----------
  updateDRE: (data) => {
    const mes = get().mesAtual
    set((s) => ({ dre: { ...s.dre, ...data } }))
    const { userId } = get()
    if (userId) fire(sb.from('dre').upsert(
      { ...get().dre, ...data, user_id: userId, mes },
      { onConflict: 'user_id,mes' }
    ))
  },

  // ---------- Categorias de Custo (global) ----------
  addCategoriaCusto: (cat) => {
    set((s) => ({ categoriasCusto: [...s.categoriasCusto, cat] }))
    const { userId } = get()
    if (userId) fire(sb.from('categorias_custo').insert({ ...cat, user_id: userId }))
  },

  // ---------- Comprovantes (mensal) ----------
  addComprovante: (comp) => {
    const mes = get().mesAtual
    set((s) => ({ comprovantes: [...s.comprovantes, { ...comp, mes }] }))
    const { userId } = get()
    if (userId) fire(sb.from('comprovantes').insert({ ...comp, user_id: userId, mes }))
  },

  deleteComprovante: (id) => {
    set((s) => ({ comprovantes: s.comprovantes.filter((c) => c.id !== id) }))
    const { userId } = get()
    if (userId) fire(sb.from('comprovantes').delete().eq('id', id).eq('user_id', userId))
  },

  // ---------- Lancamentos de Venda / faturamento (mensal) ----------
  addVendaLancamento: (lanc) => {
    const mes = get().mesAtual
    set((s) => ({ vendasLancamentos: [...s.vendasLancamentos, { ...lanc, mes }] }))
    const { userId } = get()
    if (userId) fire(sb.from('vendas_lancamentos').insert({ ...lanc, user_id: userId, mes }))
  },

  deleteVendaLancamento: (id) => {
    set((s) => ({ vendasLancamentos: s.vendasLancamentos.filter((v) => v.id !== id) }))
    const { userId } = get()
    if (userId) fire(sb.from('vendas_lancamentos').delete().eq('id', id).eq('user_id', userId))
  },

}))

export default useStore
