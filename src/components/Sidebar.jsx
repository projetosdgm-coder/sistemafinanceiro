import { useState, useRef } from "react"
import {
  LayoutDashboard, Beef, ClipboardList, ShoppingCart, Package,
  Users, TrendingDown, FileText, LogOut,
  Download, UploadCloud,
} from "lucide-react"
import useStore from "../store/useStore"
import ThemeToggle from "./ThemeToggle"

const ITEMS = [
  { id: "dashboard",    label: "Dashboard",       Icon: LayoutDashboard },
  { id: "ingredientes", label: "Ingredientes",    Icon: Beef             },
  { id: "ficha",        label: "Ficha Tecnica",   Icon: ClipboardList    },
  { id: "vendas",       label: "Vendas",          Icon: ShoppingCart     },
  { id: "estoque",      label: "Estoque",         Icon: Package          },
  { id: "cmo",          label: "CMO",             Icon: Users            },
  { id: "cmv",          label: "CMV",             Icon: TrendingDown     },
  { id: "dre",          label: "DRE",             Icon: FileText         },
]

export default function Sidebar({ active, onNav, onLogout, theme, onToggleTheme }) {
  const { restaurante, setRestaurante, exportBackup, importBackup } = useStore()
  const [editingNome, setEditingNome] = useState(false)
  const [nomeTemp, setNomeTemp] = useState(restaurante)
  const fileRef = useRef()

  const handleNomeSave = () => {
    setRestaurante(nomeTemp.trim() || "Meu Restaurante")
    setEditingNome(false)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (file) importBackup(file)
    e.target.value = ""
  }

  return (
    <div className="h-full bg-gray-900 flex flex-col border-r border-gray-800">

      {/* Logo + Restaurante */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-800">
        <div className="text-primary font-bold text-sm tracking-widest mb-0.5">
          SISTEMA FINANCEIRO
        </div>
        <div className="text-gray-600 text-xs mb-3">Gestao de Restaurante</div>

        {editingNome ? (
          <div className="flex gap-1.5">
            <input
              autoFocus
              value={nomeTemp}
              onChange={e => setNomeTemp(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleNomeSave()
                if (e.key === "Escape") setEditingNome(false)
              }}
              className="flex-1 bg-gray-800 text-white text-xs px-2 py-1 rounded border border-primary outline-none"
            />
            <button onClick={handleNomeSave}
              className="px-2 py-1 bg-green-800 text-white text-xs rounded hover:bg-green-700">
              OK
            </button>
            <button onClick={() => setEditingNome(false)}
              className="px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600">
              X
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setNomeTemp(restaurante); setEditingNome(true) }}
            title="Clique para editar"
            className="w-full flex items-center gap-2 text-left group"
          >
            <span className="text-gray-200 text-xs font-medium flex-1 truncate group-hover:text-white transition-colors">
              {restaurante}
            </span>
            <span className="text-gray-700 text-xs group-hover:text-gray-400 transition-colors shrink-0">
              ✏
            </span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {ITEMS.map(({ id, label, Icon, destaque }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              className={[
                "w-full flex items-center gap-3 px-5 py-2.5 text-left text-sm transition-colors",
                isActive
                  ? "bg-gray-800 border-l-2 border-primary text-white font-semibold"
                  : destaque
                    ? "border-l-2 border-transparent text-primary hover:bg-gray-800 hover:text-white"
                    : "border-l-2 border-transparent text-gray-500 hover:bg-gray-800 hover:text-gray-200",
              ].join(" ")}
            >
              <Icon size={16} className="shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800 space-y-2">

        {/* Backup */}
        <div>
          <div className="text-gray-700 text-xs font-semibold tracking-wider mb-1.5">BACKUP</div>
          <div className="flex gap-2">
            <button
              onClick={exportBackup}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-semibold text-green-400 bg-green-900/20 border border-green-900/40 hover:bg-green-900/40 transition-colors"
            >
              <Download size={12} /> Exportar
            </button>
            <button
              onClick={() => fileRef.current.click()}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-semibold text-blue-400 bg-blue-900/20 border border-blue-900/40 hover:bg-blue-900/40 transition-colors"
            >
              <UploadCloud size={12} /> Importar
            </button>
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </div>
        </div>

        {/* Bottom row: theme toggle + logout */}
        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs text-gray-600 border border-gray-800 hover:text-gray-400 hover:border-gray-700 transition-colors"
          >
            <LogOut size={12} /> Sair
          </button>
        </div>

        <div className="text-gray-800 text-xs text-center">v3.1</div>
      </div>
    </div>
  )
}
