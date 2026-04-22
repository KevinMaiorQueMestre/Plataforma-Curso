import { createClient } from "@/utils/supabase/client";

export type Disciplina = {
  id: string;
  nome: string;
  cor_hex: string;
  icone: string | null;
  ordem: number;
  user_id?: string | null;
  conteudos?: Conteudo[];
};

export type SubConteudo = {
  id: string;
  conteudo_id: string;
  nome: string;
  ordem: number;
};

export type Conteudo = {
  id: string;
  disciplina_id: string;
  nome: string;
  ordem: number;
  sub_conteudos?: SubConteudo[];
};

/**
 * Busca todas as disciplinas ordenadas.
 */
export async function getDisciplinas(): Promise<Disciplina[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let query = supabase
    .from("disciplinas")
    .select("*, conteudos(*)");

  if (user) {
    query = query.or(`user_id.is.null,user_id.eq.${user.id}`);
  } else {
    query = query.is("user_id", null);
  }

  const { data, error } = await query.order("ordem", { ascending: true });

  if (error) {
    console.error("[getDisciplinas]", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Busca conteúdos de uma disciplina específica.
 */
export async function getConteudos(disciplinaId: string): Promise<Conteudo[]> {
  if (!disciplinaId) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conteudos")
    .select("id, disciplina_id, nome, ordem")
    .eq("disciplina_id", disciplinaId)
    .order("ordem", { ascending: true });

  if (error) {
    console.error("[getConteudos]", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Busca todas as disciplinas com seus conteúdos aninhados.
 * Útil para carregar tudo de uma vez.
 */
export async function getDisciplinasComConteudos(): Promise<
  (Disciplina & { conteudos: Conteudo[] })[]
> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("disciplinas")
    .select("id, nome, cor_hex, icone, ordem, user_id, conteudos(id, disciplina_id, nome, ordem, sub_conteudos(id, conteudo_id, nome, ordem))");

  if (user) {
    query = query.or(`user_id.is.null,user_id.eq.${user.id}`);
  } else {
    query = query.is("user_id", null);
  }

  const { data, error } = await query.order("ordem", { ascending: true });

  if (error) {
    console.error("[getDisciplinasComConteudos]", error.message);
    return [];
  }
  return (data ?? []) as (Disciplina & { conteudos: Conteudo[] })[];
}

export async function addDisciplina(nome: string): Promise<Disciplina | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("disciplinas")
    .insert({ nome, cor_hex: "#6366f1", ordem: 99, user_id: user?.id }) // Default purple color and generic order
    .select()
    .single();

  if (error) {
    console.error("[addDisciplina]", error.message);
    return null;
  }
  return data;
}

export async function deleteDisciplina(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("disciplinas")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[deleteDisciplina]", error.message);
    return false;
  }
  return true;
}

export async function addConteudo(disciplina_id: string, nome: string): Promise<Conteudo | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("conteudos")
    .insert({ disciplina_id, nome, ordem: 99, user_id: user?.id })
    .select()
    .single();

  if (error) {
    console.error("[addConteudo]", error.message);
    return null;
  }
  return data;
}

export async function deleteConteudo(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("conteudos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[deleteConteudo]", error.message);
    return false;
  }
  return true;
}

export async function addSubConteudo(conteudo_id: string, nome: string): Promise<SubConteudo | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("sub_conteudos")
    .insert({ conteudo_id, nome, ordem: 99, user_id: user?.id })
    .select()
    .single();

  if (error) {
    console.error("[addSubConteudo]", error.message);
    return null;
  }
  return data;
}
