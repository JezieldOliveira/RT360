export interface SimulationInput {
  regime: 'LP' | 'LR' | 'SN';
  receita: number;
  tributos: number;
  csp: number;
  adm: number;
  irpj: number;
  cbs: number; // %
  ibs: number; // % pleno 2033
  aliqSN: number; // %
  pctRegular: number; // %
  pctSN: number; // %
  margemDesejada: number; // %
}

export interface RegimeYearResult {
  ano: number;
  trib: number;
  liq: number;
  marg: number;
  iva?: number;
}

export type RegimeKey = 'lp' | 'snPadrao' | 'snRegular';

export interface SimulationResult {
  inputs: SimulationInput;
  atual: {
    receita: number;
    preLiq: number;
    ebitda: number;
    lucro: number;
    margem: number;
    carga: number;
  };
  anos: number[];
  comparativo: Record<RegimeKey, { nome: string; porAno: RegimeYearResult[] }>;
  melhor: {
    key: RegimeKey;
    nome: string;
    trib: number;
    liq: number;
    marg: number;
  };
  evolucao: RegimeYearResult[];
  preco: { sugerido: number; variacao: number };
  varLucro: number;
  economia: number;
  diagnostico: {
    pctRegular: number;
    creditoExigido: boolean;
    cargaTributaria2033: number;
    margemDesejada: number;
    acaoPrioritaria: string;
  };
}

// Cronograma oficial de transição da Reforma Tributária (LC 214/2025)
const ANOS = [2027, 2028, 2029, 2030, 2031, 2032, 2033];
const IBS_FASE_BASE = [0.001, 0.001, 0.018, 0.036, 0.054, 0.072];
const CBS_FASE_BASE = [0.099, 0.1, 0.1, 0.1, 0.1, 0.1];
const CREDITO_FAT = 0.0343; // crédito CBS/IBS estimado sobre insumos

const NOMES: Record<RegimeKey, string> = {
  lp: 'Lucro Presumido / Real',
  snPadrao: 'Simples Nacional Padrão',
  snRegular: 'SN Regime Regular',
};

export function runSimulation(input: SimulationInput): SimulationResult {
  const { receita, tributos, csp, adm, irpj } = input;
  const cbsPct = input.cbs / 100;
  const ibsFull = input.ibs / 100;
  const aliqSN = input.aliqSN / 100;
  const pctReg = input.pctRegular / 100;
  const margDes = input.margemDesejada / 100;

  const preLiq = receita - tributos;
  const ebitda = preLiq - csp - adm;
  const lucroAt = ebitda - irpj;
  const margAt = lucroAt / receita;

  const ibsFase = [...IBS_FASE_BASE, ibsFull];
  const cbsFase = [...CBS_FASE_BASE, cbsPct];

  const calcLP = (i: number): RegimeYearResult => {
    const deb = preLiq * (cbsFase[i] + ibsFase[i]);
    const cred = (csp + adm) * CREDITO_FAT * (1 + i * 0.15);
    const iva = deb - cred;
    const trib = iva + irpj * 0.9;
    const liq = receita - trib - csp - adm;
    return { ano: ANOS[i], trib, liq, marg: liq / receita, iva };
  };

  const calcSNPad = (i: number): RegimeYearResult => {
    const trib = receita * aliqSN;
    const liq = receita - trib - csp - adm;
    return { ano: ANOS[i], trib, liq, marg: liq / receita };
  };

  const calcSNReg = (i: number): RegimeYearResult => {
    const das = ANOS[i] === 2027 ? receita * (aliqSN * 0.6) : 0;
    const deb = preLiq * (cbsFase[i] + ibsFase[i]);
    const cred = (csp + adm) * CREDITO_FAT * (1 + i * 0.15);
    const iva = deb - cred;
    const trib = das + iva;
    const liq = receita - trib - csp - adm;
    return { ano: ANOS[i], trib, liq, marg: liq / receita, iva };
  };

  const calcs: Record<RegimeKey, (i: number) => RegimeYearResult> = {
    lp: calcLP,
    snPadrao: calcSNPad,
    snRegular: calcSNReg,
  };

  const comparativo = (Object.keys(calcs) as RegimeKey[]).reduce(
    (acc, key) => {
      acc[key] = { nome: NOMES[key], porAno: ANOS.map((_, i) => calcs[key](i)) };
      return acc;
    },
    {} as SimulationResult['comparativo'],
  );

  const last = ANOS.length - 1;
  const melhorKey = (Object.keys(calcs) as RegimeKey[]).reduce((a, b) =>
    comparativo[a].porAno[last].liq >= comparativo[b].porAno[last].liq ? a : b,
  );
  const melhor2033 = comparativo[melhorKey].porAno[last];

  const sr27 = comparativo.snRegular.porAno[0];
  const precoSug = margDes < 1 ? (csp + adm + sr27.trib) / (1 - margDes) : 0;
  const varPreco = receita ? (precoSug - receita) / receita : 0;
  const economia = melhor2033.liq - lucroAt;
  const varLucro = lucroAt !== 0 ? economia / Math.abs(lucroAt) : 0;

  return {
    inputs: input,
    atual: {
      receita,
      preLiq,
      ebitda,
      lucro: lucroAt,
      margem: margAt,
      carga: receita ? tributos / receita : 0,
    },
    anos: ANOS,
    comparativo,
    melhor: {
      key: melhorKey,
      nome: NOMES[melhorKey],
      trib: melhor2033.trib,
      liq: melhor2033.liq,
      marg: melhor2033.marg,
    },
    evolucao: comparativo[melhorKey].porAno,
    preco: { sugerido: precoSug, variacao: varPreco },
    varLucro,
    economia,
    diagnostico: {
      pctRegular: pctReg,
      creditoExigido: pctReg >= 0.5,
      cargaTributaria2033: melhor2033.trib / receita,
      margemDesejada: margDes,
      acaoPrioritaria:
        pctReg >= 0.5
          ? 'Migrar para SN Regular — geração de crédito CBS/IBS aos clientes'
          : 'Manter SN padrão e revisar precificação',
    },
  };
}
