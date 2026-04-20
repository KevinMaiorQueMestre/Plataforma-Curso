import { createClient } from "@/utils/supabase/client";

// ============================================================
// Types
// ============================================================

export type OrigemProblema = 'kevquest' | 'redacao' | 'simulado' | 'manual';
export type TipoErro = 'teoria' | 'pratica' | 'desatencao';
export type StatusProblema = 'pendente' | 'em_andamento' | 'concluido';

export type ProblemaEstudo = {
  id: string;
  user_id: string;
  origem: OrigemProblema;
  origem_ref_id: string | null;
  // Contexto snapshot (copiado da origem)
  prova: string | null;
  ano: string | null;
  cor_prova: string | null;
  q_num: string | null;
  disciplina_id: string | null;
  disciplina_nome: string | null;
  conteudo_id: string | null;
  conteudo_nome: string | null;
  sub_conteudo: string | null;
  tipo_erro: TipoErro | null;
  comentario: string | null;
  // Campos de gestão
  titulo: string;
  status: StatusProblema;
  prioridade: number;           // 0 = normal, 1 = urgente
  agendado_para: string | null; // DATE ISO, null = sem data (vai para "Fila")
  // Conclusão
  tempo_gasto_min: number | null;
  conforto: number | null;      // 1–5
  // Timestamps
  created_at: string;
  concluido_at: string | null;
  updated_at: string;
};

// ============================================================
// Queries
// ============================================================

/**
 * Lista todos os problemas do aluno, ordenados por prioridade e data.
 */
export async function listarProblemas(userId: string): Promise<ProblemaEstudo[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('problemas_estudo')
    .select('*')
    .eq('user_id', userId)
    .order('prioridade', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) { console.error('[listarProblemas]', error.message); return []; }
  return (data ?? []) as ProblemaEstudo[];
}

/**
 * Cria um problema manualmente pelo aluno (sem vínculo com KevQuest/Redação).
 */
export async function criarProblemaManual(payload: {
  userId: string;
  titulo: string;
  disciplinaId?: string | null;
  disciplinaNome?: string | null;
  agendadoPara?: string | null;
  prioridade?: number;
  origem?: OrigemProblema;
  prova?: string | null;
  ano?: string | null;
  corProva?: string | null;
}): Promise<ProblemaEstudo | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('problemas_estudo')
    .insert({
      user_id: payload.userId,
      origem: payload.origem ?? 'manual',
      titulo: payload.titulo,
      disciplina_id: payload.disciplinaId ?? null,
      disciplina_nome: payload.disciplinaNome ?? null,
      agendado_para: payload.agendadoPara ?? null,
      prioridade: payload.prioridade ?? 0,
      prova: payload.prova ?? null,
      ano: payload.ano ?? null,
      cor_prova: payload.corProva ?? null,
    })
    .select('*')
    .single();

  if (error) { console.error('[criarProblemaManual]', error.message); return null; }
  return data as ProblemaEstudo;
}

/**
 * Marca um problema como concluído com tempo gasto e nível de conforto (opcional).
 */
export async function concluirProblema(
  id: string,
  tempoMin?: number | null,
  conforto?: number | null
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('problemas_estudo')
    .update({
      status: 'concluido',
      tempo_gasto_min: tempoMin ?? null,
      conforto: conforto ?? null,
      concluido_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) { console.error('[concluirProblema]', error.message); return false; }
  return true;
}

/**
 * Agenda (ou remove agendamento) de um problema para uma data específica.
 */
export async function agendarProblema(
  id: string,
  data: string | null
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('problemas_estudo')
    .update({ agendado_para: data })
    .eq('id', id);

  if (error) { console.error('[agendarProblema]', error.message); return false; }
  return true;
}

/**
 * Exclui permanentemente um problema da fila.
 */
export async function deletarProblema(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('problemas_estudo')
    .delete()
    .eq('id', id);

  if (error) { console.error('[deletarProblema]', error.message); return false; }
  return true;
}

// ============================================================
// Helpers de UI
// ============================================================

export const ORIGEM_LABELS: Record<OrigemProblema, string> = {
  kevquest: 'KevQuest',
  redacao: 'Redação',
  simulado: 'Simulado',
  manual: 'Manual',
};

export const ORIGEM_COLORS: Record<OrigemProblema, { bg: string; text: string; darkBg: string; darkText: string }> = {
  kevquest: { bg: 'bg-blue-100',   text: 'text-blue-700',   darkBg: 'dark:bg-blue-900/30',   darkText: 'dark:text-blue-300'   },
  redacao:  { bg: 'bg-orange-100', text: 'text-orange-700', darkBg: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-300' },
  simulado: { bg: 'bg-purple-100', text: 'text-purple-700', darkBg: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-300' },
  manual:   { bg: 'bg-slate-100',  text: 'text-slate-600',  darkBg: 'dark:bg-slate-700',     darkText: 'dark:text-slate-300'  },
};

export const TIPO_ERRO_LABELS: Record<TipoErro, string> = {
  teoria:      'Teoria',
  pratica:     'Prática',
  desatencao:  'Desatenção',
};

export const TIPO_ERRO_COLORS: Record<TipoErro, { bg: string; text: string }> = {
  teoria:     { bg: 'bg-blue-50 dark:bg-blue-900/20',   text: 'text-blue-600 dark:text-blue-400'   },
  pratica:    { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
  desatencao: { bg: 'bg-red-50 dark:bg-red-900/20',     text: 'text-red-600 dark:text-red-400'     },
};
