import { useState, useEffect } from "react"
import { Menu } from "lucide-react"
import { supabase } from "./lib/supabase"
import useStore from "./store/useStore"
import { useTheme } from "./hooks/useTheme"
import Sidebar from "./components/Sidebar"
import Logo from "./components/Logo"
import MonthSelector from "./components/MonthSelector"
import Login from "./modules/Login"
import Dashboard              from "./modules/Dashboard"
import Ingredientes           from "./modules/Ingredientes"
import FichaTecnica           from "./modules/FichaTecnica"
import Vendas                 from "./modules/Vendas"
import Estoque                from "./modules/Estoque"
import CMO                    from "./modules/CMO"
import CMV                    from "./modules/CMV"
import DRE                    from "./modules/DRE"
import Onboarding             from "./modules/Onboarding"

// Abas que respeitam o mes selecionado (as demais sao catalogo global)
const MONTHLY_TABS = new Set(["dashboard", "vendas", "estoque", "cmo", "cmv", "dre"])

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const [session, setSession] = useState(undefined)
  const [active, setActive] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { loadFromSupabase, loaded, onboarded } = useStore()

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
        <Logo variant="lockup" theme="dark" size={40} />
      </div>
    )
  }

  if (!session) return <Login />

  if (!loaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <span className="animate-pulse"><Logo variant="lockup" theme="dark" size={40} /></span>
      </div>
    )
  }

  const MODULES = {
    dashboard:    <Dashboard />,
    ingredientes: <Ingredientes />,
    ficha:        <FichaTecnica onNav={handleNav} />,
    vendas:       <Vendas />,
    estoque:      <Estoque onNav={handleNav} />,
    cmo:          <CMO onNav={handleNav} />,
    cmv:          <CMV />,
    dre:          <DRE onNav={handleNav} />,
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
          <Logo variant="lockup" theme="dark" size={24} />
        </header>

        {MONTHLY_TABS.has(active) && <MonthSelector />}

        <main className="flex-1 overflow-y-auto">
          {MODULES[active] ?? MODULES.dashboard}
        </main>
      </div>

      {/* Primeiro acesso: define o nome do negocio e roda o tutorial */}
      {!onboarded && <Onboarding onNav={handleNav} />}
    </div>
  )
}
