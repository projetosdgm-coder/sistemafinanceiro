import { useState, useEffect } from 'react'
import { C } from './styles/tokens'
import { supabase } from './lib/supabase'
import useStore from './store/useStore'
import Sidebar from './components/Sidebar'
import Login from './modules/Login'
import Dashboard    from './modules/Dashboard'
import Ingredientes from './modules/Ingredientes'
import FichaTecnica from './modules/FichaTecnica'
import Vendas       from './modules/Vendas'
import Estoque      from './modules/Estoque'
import CMO          from './modules/CMO'
import CMV          from './modules/CMV'
import DRE          from './modules/DRE'
import LancamentoNF from './modules/LancamentoNF'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = carregando
  const [active, setActive] = useState('dashboard')
  const { loadFromSupabase } = useStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) loadFromSupabase(data.session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadFromSupabase(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: C.sidebar, color: C.amarelo, fontSize: 18, fontWeight: 700, letterSpacing: 2,
      }}>
        ALPHA
      </div>
    )
  }

  if (!session) return <Login />

  const MODULES = {
    dashboard:    <Dashboard />,
    ingredientes: <Ingredientes />,
    ficha:        <FichaTecnica />,
    vendas:       <Vendas />,
    estoque:      <Estoque />,
    cmo:          <CMO />,
    cmv:          <CMV />,
    dre:          <DRE />,
    nf:           <LancamentoNF onNav={setActive} />,
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar active={active} onNav={setActive} onLogout={() => supabase.auth.signOut()} />
      <main style={{ flex: 1, overflowY: 'auto', background: C.cinza, minWidth: 0 }}>
        {MODULES[active]}
      </main>
    </div>
  )
}
