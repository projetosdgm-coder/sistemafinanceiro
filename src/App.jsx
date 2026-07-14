import { useState, useEffect } from "react"
import { Menu } from "lucide-react"
import { supabase } from "./lib/supabase"
import useStore from "./store/useStore"
import { useTheme } from "./hooks/useTheme"
import Sidebar from "./components/Sidebar"
import Login from "./modules/Login"
import Dashboard              from "./modules/Dashboard"
import Ingredientes           from "./modules/Ingredientes"
import FichaTecnica           from "./modules/FichaTecnica"
import Vendas                 from "./modules/Vendas"
import Estoque                from "./modules/Estoque"
import CMO                    from "./modules/CMO"
import CMV                    from "./modules/CMV"
import DRE                    from "./modules/DRE"
import LancamentoNF           from "./modules/LancamentoNF"
import LancamentoComprovante  from "./modules/LancamentoComprovante"
import LancamentoFichaTecnica from "./modules/LancamentoFichaTecnica"

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const [session, setSession] = useState(undefined)
  const [active, setActive] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { loadFromSupabase } = useStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) loadFromSupabase(data.session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      if (session) loadFromSupabase(session.user.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleNav = (id) => { setActive(id); setSidebarOpen(false) }

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <span className="text-primary font-bold text-lg tracking-widest">SISTEMA FINANCEIRO</span>
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
    nf:           <LancamentoNF onNav={handleNav} />,
    comprovante:  <LancamentoComprovante onNav={handleNav} />,
    importficha:  <LancamentoFichaTecnica onNav={handleNav} />,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed on mobile (drawer), relative on desktop */}
      <aside className={[
        "fixed inset-y-0 left-0 z-30 w-56 flex-shrink-0",
        "transform transition-transform duration-300 ease-in-out",
        "md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}>
        <Sidebar
          active={active}
          onNav={handleNav}
          onLogout={() => supabase.auth.signOut()}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </aside>

      {/* Content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 bg-gray-900 border-b border-gray-800 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
          <span className="text-primary font-bold tracking-widest text-sm">SISTEMA FINANCEIRO</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          {MODULES[active] ?? MODULES.dashboard}
        </main>
      </div>
    </div>
  )
}
