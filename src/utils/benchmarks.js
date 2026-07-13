export const BENCHMARKS = {
  cmv:       { ideal: 0.35, atencao: 0.40, label: "CMV / Rec. Líquida" },
  cmo:       { ideal: 0.32, atencao: 0.38, label: "CMO / Rec. Líquida" },
  aluguel:   { ideal: 0.08, atencao: 0.12, label: "Aluguel / Rec. Líquida" },
  ebitda:    { ideal: 0.13, atencao: 0.08, inv: true, label: "Margem EBITDA" },
  ll:        { ideal: 0.10, atencao: 0.05, inv: true, label: "Margem Líquida" },
  variancia: { ideal: 0.01, atencao: 0.03, label: "Variância CMV (desperdício)" },
};

export const TIPOS = {
  hamburgueria: "CMV tende a 32-38% (proteína cara)",
  pizzaria:     "CMV naturalmente 25-32%",
  delivery:     "CMV mais baixo, embalagens mais altas",
  bar:          "Bebida domina o CMV, margem de 60-70%",
};
