import { createClient } from '@supabase/supabase-js'

// Tabelas que compoem o snapshot diario
const TABELAS = [
  'perfis', 'ingredientes', 'receitas', 'receita_itens', 'vendas',
  'estoque', 'funcionarios', 'dre', 'categorias_custo',
  'comprovantes', 'vendas_lancamentos',
]

const DIAS_RETENCAO = 30

export default async function handler(req, res) {
  // O Vercel Cron envia Authorization: Bearer <CRON_SECRET>. Se o secret
  // estiver configurado, exigimos que bata (bloqueia chamadas externas).
  if (process.env.CRON_SECRET) {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return res.status(500).json({ error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY nao configurados' })
  }

  const sb = createClient(url, serviceKey, { auth: { persistSession: false } })

  try {
    // Le todas as linhas de cada tabela (service role ignora RLS)
    const snapshot = {}
    let totalLinhas = 0
    for (const tabela of TABELAS) {
      const { data, error } = await sb.from(tabela).select('*')
      if (error) throw new Error(`Erro lendo ${tabela}: ${error.message}`)
      snapshot[tabela] = data || []
      totalLinhas += snapshot[tabela].length
    }

    // Grava o snapshot do dia
    const { error: insErr } = await sb.from('backups').insert({
      data: { geradoEm: new Date().toISOString(), totalLinhas, tabelas: snapshot },
    })
    if (insErr) throw new Error(`Erro gravando backup: ${insErr.message}`)

    // Remove backups mais antigos que a retencao
    const corte = new Date(Date.now() - DIAS_RETENCAO * 24 * 60 * 60 * 1000).toISOString()
    await sb.from('backups').delete().lt('created_at', corte)

    console.log(`[backup] snapshot gravado · ${totalLinhas} linhas · ${TABELAS.length} tabelas`)
    return res.status(200).json({ ok: true, totalLinhas, tabelas: TABELAS.length })
  } catch (e) {
    console.error('[backup] falhou:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
