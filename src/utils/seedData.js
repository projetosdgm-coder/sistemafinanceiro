export const ING0 = [
  { id: "i1",  nome: "Pão de Hambúrguer",   cat: "Panificação",  un: "un",  preco: 0.90,  forn: "Padaria Central" },
  { id: "i2",  nome: "Carne Bovina 180g",   cat: "Proteínas",    un: "un",  preco: 6.50,  forn: "Frigorífico Alfa" },
  { id: "i3",  nome: "Bacon Fatiado",        cat: "Proteínas",    un: "kg",  preco: 28.00, forn: "Frigorífico Alfa" },
  { id: "i4",  nome: "Queijo Mussarela",     cat: "Laticínios",   un: "kg",  preco: 32.00, forn: "Laticínios Sul" },
  { id: "i5",  nome: "Alface",               cat: "Hortifrúti",   un: "kg",  preco: 4.50,  forn: "CEASA" },
  { id: "i6",  nome: "Tomate",               cat: "Hortifrúti",   un: "kg",  preco: 5.00,  forn: "CEASA" },
  { id: "i7",  nome: "Maionese",             cat: "Molhos",       un: "kg",  preco: 12.00, forn: "Distribuidora Beta" },
  { id: "i8",  nome: "Batata Palito (kg)",   cat: "Hortifrúti",   un: "kg",  preco: 6.00,  forn: "CEASA" },
  { id: "i9",  nome: "Óleo de Fritura",      cat: "Óleos",        un: "L",   preco: 7.50,  forn: "Distribuidora Beta" },
  { id: "i10", nome: "Refrigerante Lata",    cat: "Bebidas",      un: "un",  preco: 2.50,  forn: "Distribuidora Beta" },
  { id: "i11", nome: "Embalagem Delivery",   cat: "Embalagens",   un: "un",  preco: 1.20,  forn: "Embalatec" },
  { id: "i12", nome: "Sal e Temperos",       cat: "Condimentos",  un: "kg",  preco: 8.00,  forn: "Distribuidora Beta" },
];

export const REC0 = [
  { id: "r1", nome: "X-Bacon",    cat: "Hambúrgueres", preco: 32.00 },
  { id: "r2", nome: "Combo",      cat: "Combos",       preco: 42.00 },
  { id: "r3", nome: "Batata Frita",cat: "Acompanhamentos", preco: 18.00 },
];

// qtd em unidades da unidade do ingrediente
export const RITENS0 = [
  // X-Bacon
  { prato_id: "r1", ing_id: "i1",  qtd: 1 },       // 1 pão
  { prato_id: "r1", ing_id: "i2",  qtd: 1 },       // 1 carne 180g
  { prato_id: "r1", ing_id: "i3",  qtd: 0.05 },    // 50g bacon
  { prato_id: "r1", ing_id: "i4",  qtd: 0.04 },    // 40g queijo
  { prato_id: "r1", ing_id: "i5",  qtd: 0.03 },    // 30g alface
  { prato_id: "r1", ing_id: "i6",  qtd: 0.04 },    // 40g tomate
  { prato_id: "r1", ing_id: "i7",  qtd: 0.02 },    // 20g maionese
  // Combo (X-Bacon + Batata + Refri)
  { prato_id: "r2", ing_id: "i1",  qtd: 1 },
  { prato_id: "r2", ing_id: "i2",  qtd: 1 },
  { prato_id: "r2", ing_id: "i3",  qtd: 0.05 },
  { prato_id: "r2", ing_id: "i4",  qtd: 0.04 },
  { prato_id: "r2", ing_id: "i5",  qtd: 0.03 },
  { prato_id: "r2", ing_id: "i6",  qtd: 0.04 },
  { prato_id: "r2", ing_id: "i7",  qtd: 0.02 },
  { prato_id: "r2", ing_id: "i8",  qtd: 0.15 },    // 150g batata
  { prato_id: "r2", ing_id: "i9",  qtd: 0.05 },    // 50ml óleo
  { prato_id: "r2", ing_id: "i10", qtd: 1 },       // 1 refri lata
  { prato_id: "r2", ing_id: "i11", qtd: 1 },       // 1 embalagem
  // Batata Frita
  { prato_id: "r3", ing_id: "i8",  qtd: 0.20 },    // 200g batata
  { prato_id: "r3", ing_id: "i9",  qtd: 0.08 },    // 80ml óleo
  { prato_id: "r3", ing_id: "i12", qtd: 0.005 },   // 5g sal/tempero
];

export const VENDAS0 = [
  { prato_id: "r1", qtd: 280 },
  { prato_id: "r2", qtd: 150 },
  { prato_id: "r3", qtd: 320 },
];

export const EST0 = [
  { ing_id: "i1",  ei: 200,  compras: 1000, ef: 180 },
  { ing_id: "i2",  ei: 50,   compras: 500,  ef: 30 },
  { ing_id: "i3",  ei: 5,    compras: 30,   ef: 4 },
  { ing_id: "i4",  ei: 3,    compras: 20,   ef: 2 },
  { ing_id: "i5",  ei: 2,    compras: 15,   ef: 1.5 },
  { ing_id: "i6",  ei: 3,    compras: 20,   ef: 2 },
  { ing_id: "i7",  ei: 2,    compras: 10,   ef: 1.5 },
  { ing_id: "i8",  ei: 10,   compras: 80,   ef: 8 },
  { ing_id: "i9",  ei: 5,    compras: 20,   ef: 4 },
  { ing_id: "i10", ei: 50,   compras: 300,  ef: 40 },
  { ing_id: "i11", ei: 100,  compras: 500,  ef: 80 },
  { ing_id: "i12", ei: 1,    compras: 5,    ef: 0.8 },
];

export const EMP0 = [
  { id: "e1", nome: "Carlos Silva",    cargo: "Gerente",       regime: "CLT", salario: 3500 },
  { id: "e2", nome: "Ana Souza",       cargo: "Cozinheiro",    regime: "CLT", salario: 2200 },
  { id: "e3", nome: "Pedro Lima",      cargo: "Atendente",     regime: "CLT", salario: 1800 },
  { id: "e4", nome: "Maria Oliveira",  cargo: "Auxiliar",      regime: "PJ",  salario: 1600 },
];

export const DRE0 = {
  salao:    18000,
  delivery: 12000,
  ifood:    8000,
  eventos:  2000,
  imp_pct:  0.06,
  taxa_pct: 0.02,
  dev:      500,
  aluguel:  4500,
  energia:  1200,
  agua:     300,
  internet: 200,
  marketing: 800,
  contabil:  600,
  manut:     400,
  seguros:   300,
  pdv:       150,
  limpeza:   350,
  outros:    500,
  depre:     800,
  juros:     400,
  parcelas:  600,
  ir:        0,
};
