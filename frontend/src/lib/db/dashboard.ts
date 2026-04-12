import { createClient } from "@/utils/supabase/client";

export type SummaryCards = {
  totalQuestoes: number;
  taxaAcertoGlobal: number; // 0-100
  horasEstudo: number;      // em horas (decimal)
};

export type PeriodoData = {
  name: string;
  acertos: number;
  erros: number;
  minutos: number;
};

export type DisciplinaData = {
  disciplina: string;
  minutos: number;
  desempenho: number; // % acerto
};

/**
 * Retorna os totais para os SummaryCards do dashboard.
 * Une dados de simulados e sessões de estudo.
 */
export async function getSummaryCards(userId: string): Promise<SummaryCards> {
  const supabase = createClient();

  // 1. Total de questões e acertos (Simulados + Sessões)
  const [simRes, sesRes] = await Promise.all([
    supabase.from("simulado_resultados").select("acertos, total_questoes").eq("user_id", userId),
    supabase.from("sessoes_estudo").select("acertos, total_questoes, duracao_segundos").eq("user_id", userId)
  ]);

  const totalAcertos = (simRes.data?.reduce((a, s) => a + s.acertos, 0) || 0) + 
                       (sesRes.data?.reduce((a, s) => a + (s.acertos || 0), 0) || 0);
  
  const totalQuestoes = (simRes.data?.reduce((a, s) => a + s.total_questoes, 0) || 0) + 
                        (sesRes.data?.reduce((a, s) => a + (s.total_questoes || 0), 0) || 0);

  const taxaAcertoGlobal = totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0;

  // 2. Horas totais de estudo
  const totalSegundos = sesRes.data?.reduce((acc, s) => acc + (s.duracao_segundos ?? 0), 0) ?? 0;
  const horasEstudo = parseFloat((totalSegundos / 3600).toFixed(1));

  return {
    totalQuestoes,
    taxaAcertoGlobal,
    horasEstudo,
  };
}

/**
 * Retorna dados de acertos/erros e minutos de estudo agrupados por dia (últimos N dias).
 */
export async function getEvolucao7Dias(userId: string): Promise<PeriodoData[]> {
  const supabase = createClient();
  const dias = 7;
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const [sesRes, simRes] = await Promise.all([
    supabase.from("sessoes_estudo").select("duracao_segundos, created_at, acertos, total_questoes").eq("user_id", userId).gte("created_at", desde.toISOString()),
    supabase.from("simulado_resultados").select("acertos, total_questoes, realizado_em").eq("user_id", userId).gte("realizado_em", desde.toISOString())
  ]);

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const result: PeriodoData[] = [];

  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split("T")[0];
    const label = dayNames[d.getDay()];

    // Minutos
    const minutos = Math.round((sesRes.data ?? []).filter(s => s.created_at.startsWith(dayStr)).reduce((a, s) => a + (s.duracao_segundos || 0), 0) / 60);

    // Performance combinada
    const daySes = (sesRes.data ?? []).filter(s => s.created_at.startsWith(dayStr));
    const daySim = (simRes.data ?? []).filter(s => s.realizado_em.startsWith(dayStr));
    
    const totalA = daySes.reduce((a, s) => a + (s.acertos || 0), 0) + daySim.reduce((a, s) => a + s.acertos, 0);
    const totalQ = daySes.reduce((a, s) => a + (s.total_questoes || 0), 0) + daySim.reduce((a, s) => a + s.total_questoes, 0);
    
    const acertosNum = totalQ > 0 ? Math.round((totalA / totalQ) * 100) : 0;

    result.push({ name: label, acertos: acertosNum, erros: 100 - acertosNum, minutos });
  }

  return result;
}

export async function getEvolucao5Semanas(userId: string): Promise<PeriodoData[]> {
  const supabase = createClient();
  const result: PeriodoData[] = [];

  for (let i = 4; i >= 0; i--) {
    const fim = new Date();
    fim.setDate(fim.getDate() - i * 7);
    const inicio = new Date(fim);
    inicio.setDate(inicio.getDate() - 7);
    const label = `Sem ${5 - i}`;

    const [sesRes, simRes] = await Promise.all([
      supabase.from("sessoes_estudo").select("duracao_segundos, acertos, total_questoes").eq("user_id", userId).gte("created_at", inicio.toISOString()).lte("created_at", fim.toISOString()),
      supabase.from("simulado_resultados").select("acertos, total_questoes").eq("user_id", userId).gte("realizado_em", inicio.toISOString()).lte("realizado_em", fim.toISOString())
    ]);

    const minutos = Math.round((sesRes.data ?? []).reduce((a, s) => a + (s.duracao_segundos || 0), 0) / 60);
    const totalA = (sesRes.data ?? []).reduce((a, s) => a + (s.acertos || 0), 0) + (simRes.data ?? []).reduce((a, s) => a + s.acertos, 0);
    const totalQ = (sesRes.data ?? []).reduce((a, s) => a + (s.total_questoes || 0), 0) + (simRes.data ?? []).reduce((a, s) => a + s.total_questoes, 0);
    const acertosNum = totalQ > 0 ? Math.round((totalA / totalQ) * 100) : 0;

    result.push({ name: label, acertos: acertosNum, erros: 100 - acertosNum, minutos });
  }
  return result;
}

export async function getEvolucao3Meses(userId: string): Promise<PeriodoData[]> {
  const supabase = createClient();
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const result: PeriodoData[] = [];
  const now = new Date();

  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const inicio = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const label = meses[d.getMonth()];

    const [sesRes, simRes] = await Promise.all([
      supabase.from("sessoes_estudo").select("duracao_segundos, acertos, total_questoes").eq("user_id", userId).gte("created_at", inicio).lte("created_at", fim),
      supabase.from("simulado_resultados").select("acertos, total_questoes").eq("user_id", userId).gte("realizado_em", inicio).lte("realizado_em", fim)
    ]);

    const minutos = Math.round((sesRes.data ?? []).reduce((a, s) => a + (s.duracao_segundos || 0), 0) / 60);
    const totalA = (sesRes.data ?? []).reduce((a, s) => a + (s.acertos || 0), 0) + (simRes.data ?? []).reduce((a, s) => a + s.acertos, 0);
    const totalQ = (sesRes.data ?? []).reduce((a, s) => a + (s.total_questoes || 0), 0) + (simRes.data ?? []).reduce((a, s) => a + s.total_questoes, 0);
    const acertosNum = totalQ > 0 ? Math.round((totalA / totalQ) * 100) : 0;

    result.push({ name: label, acertos: acertosNum, erros: 100 - acertosNum, minutos });
  }
  return result;
}

export async function getTempoEDesempenhoPorDisciplina(userId: string): Promise<DisciplinaData[]> {
  const supabase = createClient();

  const [sesRes, simRes] = await Promise.all([
    supabase.from("sessoes_estudo").select("duracao_segundos, acertos, total_questoes, disciplinas(nome)").eq("user_id", userId).not("disciplina_id", "is", null),
    supabase.from("simulado_resultados").select("acertos, total_questoes, disciplinas(nome)").eq("user_id", userId).not("disciplina_id", "is", null)
  ]);

  const map = new Map<string, { minutos: number; acertos: number; total: number }>();

  (sesRes.data ?? []).forEach((s: any) => {
    const nome = s.disciplinas?.nome ?? "Geral";
    const curr = map.get(nome) ?? { minutos: 0, acertos: 0, total: 0 };
    curr.minutos += Math.round((s.duracao_segundos ?? 0) / 60);
    curr.acertos += s.acertos || 0;
    curr.total += s.total_questoes || 0;
    map.set(nome, curr);
  });

  (simRes.data ?? []).forEach((s: any) => {
    const nome = s.disciplinas?.nome ?? "Geral";
    const curr = map.get(nome) ?? { minutos: 0, acertos: 0, total: 0 };
    curr.acertos += s.acertos;
    curr.total += s.total_questoes;
    map.set(nome, curr);
  });

  return Array.from(map.entries()).map(([disciplina, v]) => ({
    disciplina,
    minutos: v.minutos,
    desempenho: v.total > 0 ? Math.round((v.acertos / v.total) * 100) : 0,
  }));
}
