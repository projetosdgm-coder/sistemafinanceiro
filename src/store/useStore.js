import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { DRE0 } from '../utils/seedData'

const sb = supabase

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

  // ── Carrega todos os dados do Supabase após login ──────────────────────────
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
    ])

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
    })
  },

  // ── Perfil ─────────────────────────────────────────────────────────────────
  setRestaurante: (restaurante) => {
    set({ restaurante })
    const { userId } = get()
    if (userId) sb.from('perfis').update({ restaurante }).eq('id', userId)
  },

  setApiKey: (api_key) => {
    set({ apiKey: api_key })
    const { userId } = get()
    if (userId) sb.from('perfis').update({ api_key }).eq('id', userId)
  },

  setApiProvider: (api_provider) => {
    set({ apiProvider: api_provider })
    const { userId } = get()
    if (userId) sb.from('perfis').update({ api_provider }).eq('id', userId)
  },

  // ── Ingredientes ───────────────────────────────────────────────────────────
  addIngrediente: (ing) => {
    set((s) => ({ ingredientes: [...s.ingredientes, ing] }))
    const { userId } = get()
    if (userId) sb.from('ingredientes').insert({ ...ing, user_id: userId })
  },

  updateIngrediente: (id, data) => {
    set((s) => ({ ingredientes: s.ingredientes.map((x) => x.id === id ? { ...x, ...data } : x) }))
    const { userId } = get()
    if (userId) sb.from('ingredientes').update(data).eq('id', id).eq('user_id', userId)
  },

  deleteIngrediente: (id) => {
    set((s) => ({
      ingredientes: s.ingredientes.filter((x) => x.id !== id),
      receitaItens: s.receitaItens.filter((x) => x.ing_id !== id),
      estoque: s.estoque.filter((x) => x.ing_id !== id),
    }))
    const { userId } = get()
    if (userId) sb.from('ingredientes').delete().eq('id', id).eq('user_id', userId)
  },

  // ── Receitas ───────────────────────────────────────────────────────────────
  addReceita: (rec) => {
    set((s) => ({ receitas: [...s.receitas, rec] }))
    const { userId } = get()
    if (userId) sb.from('receitas').insert({ ...rec, user_id: userId })
  },

  updateReceita: (id, data) => {
    set((s) => ({ receitas: s.receitas.map((x) => x.id === id ? { ...x, ...data } : x) }))
    const { userId } = get()
    if (userId) sb.from('receitas').update(data).eq('id', id).eq('user_id', userId)
  },

  deleteReceita: (id) => {
    set((s) => ({
      receitas: s.receitas.filter((x) => x.id !== id),
      receitaItens: s.receitaItens.filter((x) => x.prato_id !== id),
      vendas: s.vendas.filter((x) => x.prato_id !== id),
    }))
    const { userId } = get()
    if (userId) sb.from('receitas').delete().eq('id', id).eq('user_id', userId)
  },

  // ── Itens de Receita ───────────────────────────────────────────────────────
  addReceitaItem: (item) => {
    set((s) => ({ receitaItens: [...s.receitaItens, item] }))
    const { userId } = get()
    if (userId) sb.from('receita_itens').upsert({ ...item, user_id: userId })
  },

  updateReceitaItem: (prato_id, ing_id, data) => {
    set((s) => ({
      receitaItens: s.receitaItens.map((x) =>
        x.prato_id === prato_id && x.ing_id === ing_id ? { ...x, ...data } : x
      ),
    }))
    const { userId } = get()
    if (userId) sb.from('receita_itens').update(data)
      .eq('prato_id', prato_id).eq('ing_id', ing_id).eq('user_id', userId)
  },

  deleteReceitaItem: (prato_id, ing_id) => {
    set((s) => ({
      receitaItens: s.receitaItens.filter(
        (x) => !(x.prato_id === prato_id && x.ing_id === ing_id)
      ),
    }))
    const { userId } = get()
    if (userId) sb.from('receita_itens').delete()
      .eq('prato_id', prato_id).eq('ing_id', ing_id).eq('user_id', userId)
  },

  // ── Vendas ─────────────────────────────────────────────────────────────────
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
    if (userId) sb.from('vendas').upsert({ prato_id, qtd, user_id: userId })
  },

  // ── Estoque ────────────────────────────────────────────────────────────────
  addEstoque: (item) => {
    set((s) => ({ estoque: [...s.estoque, item] }))
    const { userId } = get()
    if (userId) sb.from('estoque').upsert({ ...item, user_id: userId })
  },

  updateEstoque: (ing_id, data) => {
    set((s) => ({ estoque: s.estoque.map((x) => x.ing_id === ing_id ? { ...x, ...data } : x) }))
    const { userId } = get()
    if (userId) sb.from('estoque').update(data).eq('ing_id', ing_id).eq('user_id', userId)
  },

  deleteEstoque: (ing_id) => {
    set((s) => ({ estoque: s.estoque.filter((x) => x.ing_id !== ing_id) }))
    const { userId } = get()
    if (userId) sb.from('estoque').delete().eq('ing_id', ing_id).eq('user_id', userId)
  },

  // ── Funcionários ───────────────────────────────────────────────────────────
  addFuncionario: (func) => {
    set((s) => ({ funcionarios: [...s.funcionarios, func] }))
    const { userId } = get()
    if (userId) sb.from('funcionarios').insert({ ...func, user_id: userId })
  },

  updateFuncionario: (id, data) => {
    set((s) => ({ funcionarios: s.funcionarios.map((x) => x.id === id ? { ...x, ...data } : x) }))
    const { userId } = get()
    if (userId) sb.from('funcionarios').update(data).eq('id', id).eq('user_id', userId)
  },

  deleteFuncionario: (id) => {
    set((s) => ({ funcionarios: s.funcionarios.filter((x) => x.id !== id) }))
    const { userId } = get()
    if (userId) sb.from('funcionarios').delete().eq('id', id).eq('user_id', userId)
  },

  // ── DRE ────────────────────────────────────────────────────────────────────
  updateDRE: (data) => {
    set((s) => ({ dre: { ...s.dre, ...data } }))
    const { userId } = get()
    if (userId) sb.from('dre').upsert({ ...get().dre, ...data, user_id: userId })
  },

  // ── Categorias de Custo ────────────────────────────────────────────────────
  addCategoriaCusto: (cat) => {
    set((s) => ({ categoriasCusto: [...s.categoriasCusto, cat] }))
    const { userId } = get()
    if (userId) sb.from('categorias_custo').insert({ ...cat, user_id: userId })
  },

  // ── Comprovantes ───────────────────────────────────────────────────────────
  addComprovante: (comp) => {
    set((s) => ({ comprovantes: [...s.comprovantes, comp] }))
    const { userId } = get()
    if (userId) sb.from('comprovantes').insert({ ...comp, user_id: userId })
  },

  // ── Backup ─────────────────────────────────────────────────────────────────
  exportBackup: () => {
    const s = get()
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      restaurante: s.restaurante,
      ingredientes: s.ingredientes,
      receitas: s.receitas,
      receitaItens: s.receitaItens,
      vendas: s.vendas,
      estoque: s.estoque,
      funcionarios: s.funcionarios,
      dre: s.dre,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const hoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
    a.download = `backup_alpha_${hoje}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  importBackup: (file) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result)
        const keys = ['ingredientes', 'receitas', 'receitaItens', 'vendas', 'estoque', 'funcionarios', 'dre']
        if (!keys.every((k) => k in data)) throw new Error('inválido')

        const { userId } = get()
        set({
          restaurante: data.restaurante || 'Meu Restaurante',
          ingredientes: data.ingredientes,
          receitas: data.receitas,
          receitaItens: data.receitaItens,
          vendas: data.vendas,
          estoque: data.estoque,
          funcionarios: data.funcionarios,
          dre: data.dre,
        })

        if (userId) {
          await Promise.all([
            sb.from('perfis').update({ restaurante: data.restaurante || 'Meu Restaurante' }).eq('id', userId),
            data.ingredientes.length && sb.from('ingredientes').delete().eq('user_id', userId),
            data.receitas.length && sb.from('receitas').delete().eq('user_id', userId),
            data.vendas.length && sb.from('vendas').delete().eq('user_id', userId),
            data.estoque.length && sb.from('estoque').delete().eq('user_id', userId),
            data.funcionarios.length && sb.from('funcionarios').delete().eq('user_id', userId),
          ])
          await Promise.all([
            data.ingredientes.length && sb.from('ingredientes').insert(data.ingredientes.map(x => ({ ...x, user_id: userId }))),
            data.receitas.length && sb.from('receitas').insert(data.receitas.map(x => ({ ...x, user_id: userId }))),
            data.receitaItens.length && sb.from('receita_itens').insert(data.receitaItens.map(x => ({ ...x, user_id: userId }))),
            data.vendas.length && sb.from('vendas').insert(data.vendas.map(x => ({ ...x, user_id: userId }))),
            data.estoque.length && sb.from('estoque').insert(data.estoque.map(x => ({ ...x, user_id: userId }))),
            data.funcionarios.length && sb.from('funcionarios').insert(data.funcionarios.map(x => ({ ...x, user_id: userId }))),
            sb.from('dre').upsert({ ...data.dre, user_id: userId }),
          ])
        }
      } catch {
        alert('Arquivo de backup inválido ou corrompido.')
      }
    }
    reader.readAsText(file)
  },
}))

export default useStore
