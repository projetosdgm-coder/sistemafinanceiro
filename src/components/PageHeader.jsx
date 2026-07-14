// Cabecalho de pagina responsivo: titulo em cima, acoes abaixo no mobile;
// lado a lado no desktop. Evita titulo quebrando palavra por palavra.
export default function PageHeader({ title, children }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}
