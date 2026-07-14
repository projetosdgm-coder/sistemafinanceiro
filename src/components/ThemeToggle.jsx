import { Sun, Moon } from "lucide-react"

export default function ThemeToggle({ theme, onToggle, className = "" }) {
  return (
    <button
      onClick={onToggle}
      title={theme === "dark" ? "Modo claro" : "Modo escuro"}
      className={`p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors ${className}`}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
