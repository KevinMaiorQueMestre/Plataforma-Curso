// ============================================================
// kevquestLogic.ts
// Apenas funções puras de lógica do funil de revisão.
// Dados reais (disciplinas, conteúdos, entries) → src/lib/db/kevquest.ts
// ============================================================

export type EstagioFunil =
  | "Quarentena"
  | "Diagnostico"
  | "UTI"
  | "Refacao"
  | "Consolidada";

export const ESTAGIO_ORDER: EstagioFunil[] = [
  "Quarentena",
  "Diagnostico",
  "UTI",
  "Refacao",
  "Consolidada",
];

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

/** Avança o estágio para o próximo no funil. */
export function getNextStage(current: EstagioFunil): EstagioFunil | null {
  const sequence: Record<EstagioFunil, EstagioFunil | null> = {
    Quarentena: "Diagnostico",
    Diagnostico: "UTI",
    UTI: "Refacao",
    Refacao: "Consolidada",
    Consolidada: null,
  };
  return sequence[current];
}

/** Adiciona N dias úteis (pula domingos) a uma data. */
export function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (result.getDay() !== 0) added++; // ignora domingo
  }
  return result;
}

/**
 * Calcula as 3 datas de refação automáticas a partir de startDate.
 * Retorna ISO date strings (sem hora) para gravar no banco.
 */
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

/**
 * Calcula a próxima data de revisão com base no estágio atual.
 * Retorna um ISO date string completo para gravar em proxima_revisao_at.
 */
export function calcProximaRevisao(estagio: EstagioFunil): string | null {
  const diasPorEstagio: Partial<Record<EstagioFunil, number>> = {
    Quarentena: 1,
    Diagnostico: 3,
    UTI: 7,
    Refacao: 14,
    Consolidada: null as unknown as number, // dominado, sem revisão
  };
  const dias = diasPorEstagio[estagio];
  if (!dias) return null;
  const data = addBusinessDays(new Date(), dias);
  return data.toISOString();
}
