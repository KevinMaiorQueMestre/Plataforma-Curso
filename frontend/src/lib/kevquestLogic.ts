export type EstagioFunil = "Quarentena" | "Diagnostico" | "UTI" | "Refacao" | "Consolidada";

export const ESTAGIO_ORDER: EstagioFunil[] = ["Quarentena", "Diagnostico", "UTI", "Refacao", "Consolidada"];

export const ESTAGIO_COLORS: Record<EstagioFunil, string> = {
  Quarentena: "#3b82f6", // azul
  Diagnostico: "#f59e0b", // laranja
  UTI: "#ef4444", // vermelho
  Refacao: "#a855f7", // roxo
  Consolidada: "#22c55e", // verde
};

export const ESTAGIO_LABELS: Record<EstagioFunil, string> = {
  Quarentena: "Quarentena",
  Diagnostico: "Diagnóstico",
  UTI: "UTI",
  Refacao: "Refação",
  Consolidada: "Consolidada",
};

export function getNextStage(current: EstagioFunil): EstagioFunil | null {
  const idx = ESTAGIO_ORDER.indexOf(current);
  if (idx < 0 || idx >= ESTAGIO_ORDER.length - 1) return null;
  return ESTAGIO_ORDER[idx + 1];
}

/** Calculation logic extracted from KevQuest to skip Sundays */
export function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    // Ignore Sunday (0)
    if (result.getDay() !== 0) added++;
  }
  return result;
}

/** Automates the generation of the 3 refatoring deadlines */
export function calcRefacaoDates(startDate: Date) {
  const d1 = addBusinessDays(startDate, 3);
  const d2 = addBusinessDays(d1, 7);
  const d3 = addBusinessDays(d2, 21);
  return {
    data_refacao_1: d1.toISOString().split("T")[0],
    data_refacao_2: d2.toISOString().split("T")[0],
    data_refacao_3: d3.toISOString().split("T")[0],
  };
}

// Temporary Local Mock Data to feed the Front-End Inputs immediately
export const MOCK_DISCIPLINAS = [
  { id: "mat", nome: "Matemática" },
  { id: "fis", nome: "Física" },
  { id: "bio", nome: "Biologia" }
];

export const MOCK_CONTEUDOS: Record<string, {id: string, nome: string}[]> = {
  "mat": [{ id: "c1", nome: "Geometria" }, { id: "c2", nome: "Funções" }, { id: "c3", nome: "Logaritmos" }],
  "fis": [{ id: "c4", nome: "Cinemática" }, { id: "c5", nome: "Eletrodinâmica" }],
  "bio": [{ id: "c6", nome: "Genética" }, { id: "c7", nome: "Citologia" }]
};

export const MOCK_PROVAS = [
  { id: "enem_2023", nome: "ENEM 2023" },
  { id: "enem_2022", nome: "ENEM 2022" },
  { id: "fuvest_2024", nome: "FUVEST 2024" },
  { id: "unicamp_2024", nome: "UNICAMP 2024" }
];

export const MOCK_MOTIVOS_ERRO = [
  "paia",
  "Falta de Atenção",
  "Não lembrava a fórmula",
  "Interpretação de Texto",
  "Cálculo Básico",
  "Falta de Tempo"
];

// --- Mock para a Aba Diário de Estudos ---
export const MOCK_ESTUDOS = [
  {
    id: "estudo_1",
    dataIso: new Date().toISOString(), // Hoje
    disciplinaId: "mat",
    disciplinaNome: "Matemática",
    conteudoId: "c1",
    conteudoNome: "Geometria",
    questoesFeitas: 20,
    acertos: 15,
    horasEstudo: 2.5
  },
  {
    id: "estudo_2",
    dataIso: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), // 2 dias atrás
    disciplinaId: "bio",
    disciplinaNome: "Biologia",
    conteudoId: "c6",
    conteudoNome: "Genética",
    questoesFeitas: 30,
    acertos: 28,
    horasEstudo: 1.5
  }
];

// --- Mock para a Aba de Simulados (Desempenho ENEM Histórico) ---
// Dados ascendentes simulando uma evolução satisfatória do aluno no decorrer das semanas.
export const MOCK_SIMULADOS = [
  {
    id: "sim1",
    dataIso: "2023-11-05T12:00:00.000Z", // Simulado 1 (Data mais antiga)
    nomeProva: "ENEM 2022 - Regular",
    linguagens: 28,
    humanas: 32,
    naturezas: 15,
    matematica: 18,
    redacao: 680
  },
  {
    id: "sim2",
    dataIso: "2023-12-10T12:00:00.000Z", // Simulado 2
    nomeProva: "ENEM 2021 - PPL",
    linguagens: 33,
    humanas: 36,
    naturezas: 22,
    matematica: 25,
    redacao: 760
  },
  {
    id: "sim3",
    dataIso: "2024-02-15T12:00:00.000Z", // Simulado 3
    nomeProva: "ENEM 2023 - Regular",
    linguagens: 38,
    humanas: 41,
    naturezas: 27,
    matematica: 31,
    redacao: 880
  },
  {
    id: "sim4",
    dataIso: "2024-03-20T12:00:00.000Z", // Simulado 4 (Mais recente)
    nomeProva: "Simulado INÉDITO Hexag",
    linguagens: 40,
    humanas: 42,
    naturezas: 33,
    matematica: 38,
    redacao: 960
  }
];
