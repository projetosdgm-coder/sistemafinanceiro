export function calcularCustoPrato(prato_id, receitaItens, ingredientes) {
  return receitaItens
    .filter((x) => x.prato_id === prato_id)
    .reduce((s, item) => {
      const ing = ingredientes.find((x) => x.id === item.ing_id);
      return s + (ing?.preco || 0) * item.qtd;
    }, 0);
}

export function calcularCMVReal(estoque, ingredientes) {
  return estoque.reduce((s, e) => {
    const ing = ingredientes.find((x) => x.id === e.ing_id);
    if (!ing) return s;
    const consumo = (e.ei || 0) + (e.compras || 0) - (e.ef || 0);
    return s + consumo * ing.preco;
  }, 0);
}

export function calcularCMVTeorico(receitas, receitaItens, vendas, ingredientes) {
  return receitas.reduce((s, r) => {
    const v = vendas.find((x) => x.prato_id === r.id);
    if (!v) return s;
    const custo = calcularCustoPrato(r.id, receitaItens, ingredientes);
    return s + custo * (v.qtd || 0);
  }, 0);
}

export const ENCARGOS_CLT =
  0.08 + 0.20 + 0.03 + 0.058 + 0.0833 + 0.0833 + 0.033;
export const MULT_CLT = 1 + ENCARGOS_CLT;

export function calcularCustoFuncionario(f) {
  return f.regime === "CLT" ? f.salario * MULT_CLT : f.salario;
}

export function calcularCMO(funcionarios) {
  return funcionarios.reduce((s, f) => s + calcularCustoFuncionario(f), 0);
}

export function calcularDRE(dre, cmvReal, cmo) {
  const rb =
    (dre.salao || 0) +
    (dre.delivery || 0) +
    (dre.ifood || 0) +
    (dre.eventos || 0);
  const ded =
    rb * (dre.imp_pct || 0) + rb * (dre.taxa_pct || 0) + (dre.dev || 0);
  const rl = rb - ded;
  const lb = rl - cmvReal;
  const desp =
    (dre.aluguel || 0) +
    (dre.energia || 0) +
    (dre.agua || 0) +
    (dre.internet || 0) +
    (dre.marketing || 0) +
    (dre.contabil || 0) +
    (dre.manut || 0) +
    (dre.seguros || 0) +
    (dre.pdv || 0) +
    (dre.limpeza || 0) +
    (dre.outros || 0);
  const ebitda = lb - cmo - desp;
  const ajustes = (dre.depre || 0) + (dre.juros || 0) + (dre.parcelas || 0);
  const ll = ebitda - ajustes - (dre.ir || 0);
  return { rb, ded, rl, lb, desp, ebitda, ajustes, ll };
}

export function statusBenchmark(valor, referencia, benchmark) {
  const b = benchmark;
  if (b.inv) {
    if (valor >= b.ideal) return "saudavel";
    if (valor >= b.atencao) return "atencao";
    return "critico";
  }
  if (valor <= b.ideal) return "saudavel";
  if (valor <= b.atencao) return "atencao";
  return "critico";
}
