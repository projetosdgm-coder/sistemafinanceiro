import { useState } from 'react'
import { C } from './styles/tokens'
import Sidebar from './components/Sidebar'
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
  const [active, setActive] = useState('dashboard')

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
      <Sidebar active={active} onNav={setActive} />
      <main style={{ flex: 1, overflowY: 'auto', background: C.cinza, minWidth: 0 }}>
        {MODULES[active]}
      </main>
    </div>
  )
}
