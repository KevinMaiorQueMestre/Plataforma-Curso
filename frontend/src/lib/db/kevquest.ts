import { createClient } from "@/utils/supabase/client";

export const ESTAGIO_ORDER = [
  "Quarentena",
  "Diagnostico",
  "UTI",
  "Refacao",
  "Consolidada",
] as const;

export type EstagioFunil = (typeof ESTAGIO_ORDER)[number];

export type KevQuestEntry = {
  id: string;
  user_id: string;
  disciplina_id: string | null;
  conteudo_id: string | null;
  sub_conteudo: string | null;
  estagio_funil: EstagioFunil;
  proxima_revisao_at: string | null;
  prova: string | null;
  ano: string | null;
  cor: string | null;
  comentario: string | null;
  q_num: string | null;
  created_at: string;
  updated_at: string;
  // Joins opcionais
  disciplinas?: { nome: string; cor_hex: string } | null;
  conteudos?: { nome: string } | null;
};

export type CreateEntryPayload = {
  userId: string;
  disciplinaId: string;
  conteudoId: string | null;
  subConteudo?: string | null;
  estagioFunil: EstagioFunil;
  proximaRevisaoAt?: string | null;
  prova?: string | null;
  ano?: string | null;
  cor?: string | null;
  comentario?: string | null;
  q_num?: string | null;
};

/**
 * Cria uma nova entrada no funil KevQuest do aluno.
 */
export async function criarKevQuestEntry(
  payload: CreateEntryPayload
): Promise<KevQuestEntry | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("kevquest_entries")
    .insert({
      user_id: payload.userId,
      disciplina_id: payload.disciplinaId,
      conteudo_id: payload.conteudoId ?? null,
      sub_conteudo: payload.subConteudo ?? null,
      estagio_funil: payload.estagioFunil,
      proxima_revisao_at: payload.proximaRevisaoAt ?? null,
      prova: payload.prova ?? null,
      ano: payload.ano ?? null,
      cor: payload.cor ?? null,
      comentario: payload.comentario ?? null,
      q_num: payload.q_num ?? null,
    })
    .select(
      "*, disciplinas(nome, cor_hex), conteudos(nome)"
    )
    .single();

  if (error) {
    console.error("[criarKevQuestEntry]", error.message);
    return null;
  }
  return data as KevQuestEntry;
}

/**
 * Lista todas as entradas do funil do aluno, com joins.
 */
export async function listarKevQuestEntries(
  userId: string,
  filtroEstagio?: EstagioFunil
): Promise<KevQuestEntry[]> {
  const supabase = createClient();
  let query = supabase
    .from("kevquest_entries")
    .select("*, disciplinas(nome, cor_hex), conteudos(nome)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (filtroEstagio) {
    query = query.eq("estagio_funil", filtroEstagio);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[listarKevQuestEntries]", error.message);
    return [];
  }
  return (data ?? []) as KevQuestEntry[];
}

/**
 * Atualiza o estágio do funil de uma entrada.
 */
export async function atualizarEstagioEntry(
  entryId: string,
  novoEstagio: EstagioFunil,
  proximaRevisaoAt?: string | null
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("kevquest_entries")
    .update({
      estagio_funil: novoEstagio,
      proxima_revisao_at: proximaRevisaoAt ?? null,
    })
    .eq("id", entryId);

  if (error) {
    console.error("[atualizarEstagioEntry]", error.message);
    return false;
  }
  return true;
}

/**
 * Remove uma entrada do funil.
 */
export async function deletarKevQuestEntry(entryId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("kevquest_entries")
    .delete()
    .eq("id", entryId);

  if (error) {
    console.error("[deletarKevQuestEntry]", error.message);
    return false;
  }
  return true;
}
