import { createClient } from '@supabase/supabase-js'

// Mesmas tabelas do snapshot (api/backup.js)
const TABELAS = [
  'perfis', 'ingredientes', 'receitas', 'receita_itens', 'vendas',
  'estoque', 'funcionarios', 'dre', 'categorias_custo',
  'comprovantes', 'vendas_lancamentos',
]

function getServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// Valida o token da sessao (JWT do Supabase) e devolve o id do usuario
async function getUserId(sb, req) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  const { data, error } = await sb.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user.id
}

export default async function handler(req, res) {
  const sb = getServiceClient()
  if (!sb) return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY nao configurado' })

  const userId = await getUserId(sb, req)
  if (!userId) return res.status(401).json({ error: 'Sessao invalida ou expirada' })

  // Lista os snapshots disponiveis (so metadados, sem o blob de dados)
  if (req.method === 'GET') {
    const { data, error } = await sb.from('backups')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(60)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ backups: data || [] })
  }

  // Restaura os dados do usuario logado a partir de um snapshot
  if (req.method === 'POST') {
    const { snapshotId } = req.body || {}

    let query = sb.from('backups').select('id, created_at, data')
    query = snapshotId
      ? query.eq('id', snapshotId)
      : query.order('created_at', { ascending: false }).limit(1)
    const { data: rows, error } = await query
    if (error) return res.status(500).json({ error: error.message })

    const snap = rows?.[0]
    if (!snap) return res.status(404).json({ error: 'Snapshot nao encontrado' })

    const tabelas = snap.data?.tabelas || {}
    try {
      let restauradas = 0
      for (const tabela of TABELAS) {
        const colUser = tabela === 'perfis' ? 'id' : 'user_id'
        const minhas = (tabelas[tabela] || []).filter(r => r[colUser] === userId)

        // Apaga os dados atuais do usuario e reinsere os do snapshot
        const del = await sb.from(tabela).delete().eq(colUser, userId)
        if (del.error) throw new Error(`Erro limpando ${tabela}: ${del.error.message}`)
        if (minhas.length) {
          const ins = await sb.from(tabela).insert(minhas)
          if (ins.error) throw new Error(`Erro restaurando ${tabela}: ${ins.error.message}`)
        }
        restauradas += minhas.length
      }
      console.log(`[restore] user=${userId} · ${restauradas} linhas · snapshot=${snap.created_at}`)
      return res.status(200).json({ ok: true, restauradas, snapshot: snap.created_at })
    } catch (e) {
      console.error('[restore] falhou:', e.message)
      return res.status(500).json({ error: e.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
