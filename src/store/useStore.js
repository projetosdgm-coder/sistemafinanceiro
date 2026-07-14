import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { DRE0 } from '../utils/seedData'

const sb = supabase

// Dispara o request sem bloquear a UI; loga erros silenciosamente
const fire = (query) => query.then(({ error }) => { if (error) console.error('[db]', error) })

const useStore = create((set, get) => ({
  userId: null,
  restaurante: 'Meu Restaurante',
  ingredientes: [],
  receitas: [],
  receitaItens: [],
  vendas: [],
  estoque: [],
  funcionarios: [],
  dre: DRE0,
  categoriasCusto: [],
  comprovantes: [],
  vendasLancamentos: [],

  // Carrega todos os dados do Supabase apos login
  loadFromSupabase: async (userId) => {
    set({ userId })
    const [
      { data: perfil },
      { data: ingredientes },
      { data: receitas },
      { data: receitaItens },
      { data: vendas },
      { data: estoque },
      { data: funcionarios },
      { data: dre },
      { data: categoriasCusto },
      { data: comprovantes },
      { data: vendasLancamentos },
    ] = await Promise.all([
      sb.from('perfis').select('*').eq('id', userId).single(),
      sb.from('ingredientes').select('*').eq('user_id', userId),
      sb.from('receitas').select('*').eq('user_id', userId),
      sb.from('receita_itens').select('*').eq('user_id', userId),
      sb.from('vendas').select('*').eq('user_id', userId),
      sb.from('estoque').select('*').eq('user_id', userId),
      sb.from('funcionarios').select('*').eq('user_id', userId),
      sb.from('dre').select('*').eq('user_id', userId).single(),
      sb.from('categorias_custo').select('*').eq('user_id', userId),
      sb.from('comprovantes').select('*').eq('user_id', userId),
      sb.from('vendas_lancamentos').select('*').eq('user_id', userId),
    ])

    // Garante que o row de perfis existe (usuarios criados via dashboard podem nao ter)
    if (!perfil) {
      await sb.from('perfis').upsert({ id: userId, restaurante: 'Meu Restaurante' })
    }

    set({
      restaurante: perfil?.restaurante || 'Meu Restaurante',
      ingredientes: ingredientes || [],
      receitas: receitas || [],
      receitaItens: receitaItens || [],
      vendas: vendas || [],
      estoque: estoque || [],
      funcionarios: funcionarios || [],
      dre: dre ? { ...DRE0, ...dre } : DRE0,
      categoriasCusto: categoriasCusto || [],
      comprovantes: comprovantes || [],
      vendasLancamentos: vendasLancamentos || [],
    })
  },

  // Perfil
  setRestaurante: (restaurante) => {
    set({ restaurante })
    const { userId } = get()
    if (userId) fire(sb.from('perfis').upsert({ id: userId, restaurante }))
  },

  // Ingredientes
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

  // Receitas
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

  // Itens de Receita
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

  // Vendas
  updateVenda: (prato_id, qtd) => {
    set((s) => {
      const exists = s.vendas.find((x) => x.prato_id === prato_id)
      return {
        vendas: exists
          ? s.vendas.map((x) => x.prato_id === prato_id ? { ...x, qtd } : x)
          : [...s.vendas, { prato_id, qtd }],
      }
    })
    const { userId } = get()
    if (userId) fire(sb.from('vendas').upsert({ prato_id, qtd, user_id: userId }))
  },

  // Estoque
  addEstoque: (item) => {
    set((s) => ({ estoque: [...s.estoque, item] }))
    const { userId } = get()
    if (userId) fire(sb.from('estoque').upsert({ ...item, user_id: userId }))
  },

  updateEstoque: (ing_id, data) => {
    set((s) => ({ estoque: s.estoque.map((x) => x.ing_id === ing_id ? { ...x, ...data } : x) }))
    const { userId } = get()
    if (userId) fire(sb.from('estoque').update(data).eq('ing_id', ing_id).eq('user_id', userId))
  },

  deleteEstoque: (ing_id) => {
    set((s) => ({ estoque: s.estoque.filter((x) => x.ing_id !== ing_id) }))
    const { userId } = get()
    if (userId) fire(sb.from('estoque').delete().eq('ing_id', ing_id).eq('user_id', userId))
  },

  // Funcionarios
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

  // DRE
  updateDRE: (data) => {
    set((s) => ({ dre: { ...s.dre, ...data } }))
    const { userId } = get()
    if (userId) fire(sb.from('dre').upsert({ ...get().dre, ...data, user_id: userId }))
  },

  // Categorias de Custo
  addCategoriaCusto: (cat) => {
    set((s) => ({ categoriasCusto: [...s.categoriasCusto, cat] }))
    const { userId } = get()
    if (userId) fire(sb.from('categorias_custo').insert({ ...cat, user_id: userId }))
  },

  // Comprovantes
  addComprovante: (comp) => {
    set((s) => ({ comprovantes: [...s.comprovantes, comp] }))
    const { userId } = get()
    if (userId) fire(sb.from('comprovantes').insert({ ...comp, user_id: userId }))
  },

  deleteComprovante: (id) => {
    set((s) => ({ comprovantes: s.comprovantes.filter((c) => c.id !== id) }))
    const { userId } = get()
    if (userId) fire(sb.from('comprovantes').delete().eq('id', id).eq('user_id', userId))
  },

  // Lancamentos de Venda (faturamento por canal e periodo)
  addVendaLancamento: (lanc) => {
    set((s) => ({ vendasLancamentos: [...s.vendasLancamentos, lanc] }))
    const { userId } = get()
    if (userId) fire(sb.from('vendas_lancamentos').insert({ ...lanc, user_id: userId }))
  },

  deleteVendaLancamento: (id) => {
    set((s) => ({ vendasLancamentos: s.vendasLancamentos.filter((v) => v.id !== id) }))
    const { userId } = get()
    if (userId) fire(sb.from('vendas_lancamentos').delete().eq('id', id).eq('user_id', userId))
  },

}))

export default useStore
