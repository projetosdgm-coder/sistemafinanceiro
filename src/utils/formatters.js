export const fmtR = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);

export const fmtP = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v ?? 0);

export const fmtN = (v, dec = 2) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v ?? 0);
