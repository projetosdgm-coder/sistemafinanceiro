const CONFIGS = {
  saudavel: { cls: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "SAUDAVEL" },
  atencao:  { cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",  label: "ATENCAO"  },
  critico:  { cls: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",           label: "CRITICO"  },
}

export default function Badge({ status }) {
  const cfg = CONFIGS[status] ?? CONFIGS.atencao
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}
