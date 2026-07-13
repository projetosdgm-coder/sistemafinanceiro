import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ING0, REC0, RITENS0, VENDAS0, EST0, EMP0, DRE0 } from "../utils/seedData";

const useStore = create(
  persist(
    (set, get) => ({
      restaurante: "Meu Restaurante",
      apiKey: "",
      apiProvider: "gemini",

      setApiKey: (key) => set({ apiKey: key }),
      setApiProvider: (provider) => set({ apiProvider: provider }),
      ingredientes: ING0,
      receitas: REC0,
      receitaItens: RITENS0,
      vendas: VENDAS0,
      estoque: EST0,
      funcionarios: EMP0,
      dre: DRE0,

      setRestaurante: (nome) => set({ restaurante: nome }),

      // ── Ingredientes ──
      addIngrediente: (ing) =>
        set((s) => ({ ingredientes: [...s.ingredientes, ing] })),
      updateIngrediente: (id, data) =>
        set((s) => ({
          ingredientes: s.ingredientes.map((x) =>
            x.id === id ? { ...x, ...data } : x
          ),
        })),
      deleteIngrediente: (id) =>
        set((s) => ({
          ingredientes: s.ingredientes.filter((x) => x.id !== id),
          receitaItens: s.receitaItens.filter((x) => x.ing_id !== id),
          estoque: s.estoque.filter((x) => x.ing_id !== id),
        })),

      // ── Receitas ──
      addReceita: (rec) =>
        set((s) => ({ receitas: [...s.receitas, rec] })),
      updateReceita: (id, data) =>
        set((s) => ({
          receitas: s.receitas.map((x) =>
            x.id === id ? { ...x, ...data } : x
          ),
        })),
      deleteReceita: (id) =>
        set((s) => ({
          receitas: s.receitas.filter((x) => x.id !== id),
          receitaItens: s.receitaItens.filter((x) => x.prato_id !== id),
          vendas: s.vendas.filter((x) => x.prato_id !== id),
        })),

      // ── Itens de Receita ──
      addReceitaItem: (item) =>
        set((s) => ({ receitaItens: [...s.receitaItens, item] })),
      updateReceitaItem: (prato_id, ing_id, data) =>
        set((s) => ({
          receitaItens: s.receitaItens.map((x) =>
            x.prato_id === prato_id && x.ing_id === ing_id
              ? { ...x, ...data }
              : x
          ),
        })),
      deleteReceitaItem: (prato_id, ing_id) =>
        set((s) => ({
          receitaItens: s.receitaItens.filter(
            (x) => !(x.prato_id === prato_id && x.ing_id === ing_id)
          ),
        })),

      // ── Vendas ──
      updateVenda: (prato_id, qtd) =>
        set((s) => {
          const exists = s.vendas.find((x) => x.prato_id === prato_id);
          if (exists) {
            return {
              vendas: s.vendas.map((x) =>
                x.prato_id === prato_id ? { ...x, qtd } : x
              ),
            };
          }
          return { vendas: [...s.vendas, { prato_id, qtd }] };
        }),

      // ── Estoque ──
      addEstoque: (item) =>
        set((s) => ({ estoque: [...s.estoque, item] })),
      updateEstoque: (ing_id, data) =>
        set((s) => ({
          estoque: s.estoque.map((x) =>
            x.ing_id === ing_id ? { ...x, ...data } : x
          ),
        })),
      deleteEstoque: (ing_id) =>
        set((s) => ({
          estoque: s.estoque.filter((x) => x.ing_id !== ing_id),
        })),

      // ── Funcionários ──
      addFuncionario: (func) =>
        set((s) => ({ funcionarios: [...s.funcionarios, func] })),
      updateFuncionario: (id, data) =>
        set((s) => ({
          funcionarios: s.funcionarios.map((x) =>
            x.id === id ? { ...x, ...data } : x
          ),
        })),
      deleteFuncionario: (id) =>
        set((s) => ({
          funcionarios: s.funcionarios.filter((x) => x.id !== id),
        })),

      // ── DRE ──
      updateDRE: (data) =>
        set((s) => ({ dre: { ...s.dre, ...data } })),

      // ── Reset ──
      resetDados: () =>
        set({
          ingredientes: ING0,
          receitas: REC0,
          receitaItens: RITENS0,
          vendas: VENDAS0,
          estoque: EST0,
          funcionarios: EMP0,
          dre: DRE0,
        }),

      // ── Backup ──
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
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result)
            const keys = ['ingredientes', 'receitas', 'receitaItens', 'vendas', 'estoque', 'funcionarios', 'dre']
            if (!keys.every((k) => k in data)) throw new Error('inválido')
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
          } catch {
            alert('Arquivo de backup inválido ou corrompido.')
          }
        }
        reader.readAsText(file)
      },
    }),
    { name: "alpha-financeiro-v2" }
  )
);

export default useStore;
