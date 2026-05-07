import { createClient } from "@/utils/supabase/client";

export type SimuladoDB = {
  id: string;
  user_id: string;
  titulo_simulado: string;
  total_questoes: number;
  acertos: number;
  erros: number;
  disciplina_id: string | null;
  realizado_em: string;
  created_at: string;
  // Campos estruturais
  modelo_prova: string;
  dados_modelo: Record<string, unknown>;
  exam_year?: number;
  exam_day?: number;
  // Campos ENEM específicos legados
  linguagens: number;
  humanas: number;
  naturezas: number;
  matematica: number;
  redacao: number;
  tempo1_min: number;
  tempo2_min: number;
  tempo_red_min: number;
  tempo_total_min: number;
};

export type CriarSimuladoPayload = {
  userId: string;
  tituloSimulado: string;
  modeloProva: string;
  dadosModelo: Record<string, unknown>;
  totalQuestoes: number;
  acertos: number;
  examYear?: number;
  examDay?: number;
  // Legacy
  linguagens: number;
  humanas: number;
  naturezas: number;
  matematica: number;
  redacao: number;
  tempo1Min: number;
  tempo2Min: number;
  tempoRedMin: number;
};

export type AtualizarSimuladoPayload = {
  id: string;
  tituloSimulado: string;
  modeloProva: string;
  dadosModelo: Record<string, unknown>;
  totalQuestoes: number;
  acertos: number;
  examYear?: number;
  examDay?: number;
  // Legacy
  linguagens: number;
  humanas: number;
  naturezas: number;
  matematica: number;
  redacao: number;
  tempo1Min: number;
  tempo2Min: number;
  tempoRedMin: number;
  realizadoEm?: string;
};

/**
 * Calcula o total de questões objetivas realizadas.
 * Considera apenas as áreas com valor > 0 (máx 45 cada = 180 total).
 * Ex: se apenas Linguagens (45) e Humanas (45) foram feitas → 90 questões.
 */
function calcularTotalQuestoes(
  linguagens: number,
  humanas: number,
  naturezas: number,
  matematica: number
): number {
  const areas = [linguagens, humanas, naturezas, matematica];
  // Cada área tem exatamente 45 questões no ENEM. O total é proporcional às áreas feitas.
  return areas.reduce((acc, val) => acc + (val > 0 ? 45 : 0), 0);
}

/**
 * Lista todos os simulados do aluno, do mais recente para o mais antigo.
 */
export async function listarSimulados(userId: string): Promise<SimuladoDB[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("simulado_resultados")
    .select("*")
    .eq("user_id", userId)
    .order("realizado_em", { ascending: false });

  if (error) {
    console.error("[listarSimulados]", error.message);
    return [];
  }
  return (data ?? []) as SimuladoDB[];
}

/**
 * Cria um novo resultado de simulado no banco.
 */
export async function criarSimulado(
  payload: CriarSimuladoPayload
): Promise<SimuladoDB | null> {
  const supabase = createClient();

  const totalQuestoes = calcularTotalQuestoes(
    payload.linguagens, payload.humanas, payload.naturezas, payload.matematica
  );
  const acertos =
    payload.linguagens + payload.humanas + payload.naturezas + payload.matematica;
  const tempoTotal = payload.tempo1Min + payload.tempo2Min + payload.tempoRedMin;

  const { data, error } = await supabase
    .from("simulado_resultados")
    .insert({
      user_id:          payload.userId,
      titulo_simulado:  payload.tituloSimulado,
      modelo_prova:     payload.modeloProva,
      dados_modelo:     payload.dadosModelo,
      total_questoes:   payload.totalQuestoes || totalQuestoes, // Usa o dinamico ou o calculado antigo
      acertos:          payload.acertos || acertos,
      erros:            (payload.totalQuestoes || totalQuestoes) - (payload.acertos || acertos),
      exam_year:        payload.examYear,
      exam_day:         payload.examDay,
      linguagens:       payload.linguagens,
      humanas:          payload.humanas,
      naturezas:        payload.naturezas,
      matematica:       payload.matematica,
      redacao:          payload.redacao,
      tempo1_min:       payload.tempo1Min,
      tempo2_min:       payload.tempo2Min,
      tempo_red_min:    payload.tempoRedMin,
      tempo_total_min:  tempoTotal,
      realizado_em:     new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("[criarSimulado]", error.message);
    return null;
  }
  return data as SimuladoDB;
}

/**
 * Atualiza um simulado existente no banco.
 */
export async function atualizarSimulado(
  payload: AtualizarSimuladoPayload
): Promise<SimuladoDB | null> {
  const supabase = createClient();

  const totalQuestoes = calcularTotalQuestoes(
    payload.linguagens, payload.humanas, payload.naturezas, payload.matematica
  );
  const acertos =
    payload.linguagens + payload.humanas + payload.naturezas + payload.matematica;
  const tempoTotal = payload.tempo1Min + payload.tempo2Min + payload.tempoRedMin;

  const updateData: any = {
    titulo_simulado:  payload.tituloSimulado,
    modelo_prova:     payload.modeloProva,
    dados_modelo:     payload.dadosModelo,
    total_questoes:   payload.totalQuestoes || totalQuestoes,
    acertos:          payload.acertos || acertos,
    erros:            (payload.totalQuestoes || totalQuestoes) - (payload.acertos || acertos),
    exam_year:        payload.examYear,
    exam_day:         payload.examDay,
    linguagens:       payload.linguagens,
    humanas:          payload.humanas,
    naturezas:        payload.naturezas,
    matematica:       payload.matematica,
    redacao:          payload.redacao,
    tempo1_min:       payload.tempo1Min,
    tempo2_min:       payload.tempo2Min,
    tempo_red_min:    payload.tempoRedMin,
    tempo_total_min:  tempoTotal,
  };

  if (payload.realizadoEm) {
    updateData.realizado_em = payload.realizadoEm;
  }

  const { data, error } = await supabase
    .from("simulado_resultados")
    .update(updateData)
    .eq("id", payload.id)
    .select()
    .single();

  if (error) {
    console.error("[atualizarSimulado]", error.message);
    return null;
  }
  return data as SimuladoDB;
}

/**
 * Deleta um simulado pelo ID.
 */
export async function deletarSimulado(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("simulado_resultados")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[deletarSimulado]", error.message);
    return false;
  }
  return true;
}

/**
 * Marca o simulado como analisado no KevQuest.
 */
export async function marcarSimuladoAnalisado(id: string, dadosAtuais: Record<string, unknown> = {}): Promise<boolean> {
  const supabase = createClient();
  const novoDadosModelo = { ...dadosAtuais, kevquest_analisado: true };
  const { error } = await supabase
    .from("simulado_resultados")
    .update({ dados_modelo: novoDadosModelo })
    .eq("id", id);
  if (error) {
    console.error("[marcarSimuladoAnalisado]", error.message);
    return false;
  }
  return true;
}

/**
 * Remove a marcação de análise concluída no KevQuest.
 * O simulado volta a aparecer na fila de pendentes.
 */
export async function desmarcarSimuladoAnalisado(id: string, dadosAtuais: Record<string, unknown> = {}): Promise<boolean> {
  const supabase = createClient();
  const novoDadosModelo = { ...dadosAtuais, kevquest_analisado: false };
  const { error } = await supabase
    .from("simulado_resultados")
    .update({ dados_modelo: novoDadosModelo })
    .eq("id", id);
  if (error) {
    console.error("[desmarcarSimuladoAnalisado]", error.message);
    return false;
  }
  return true;
}
