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
  questoes_feitas: number | null;
  acertos: number | null;
  // Revisão automática
  numero_revisao: number | null; // null = atividade original; 1 = R1, 2 = R2...
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
  origemRefId?: string | null;
  prova?: string | null;
  ano?: string | null;
  corProva?: string | null;
  qNum?: string | null;
  conteudoId?: string | null;
  conteudoNome?: string | null;
  subConteudo?: string | null;
  tipoErro?: TipoErro | null;
  comentario?: string | null;
}): Promise<ProblemaEstudo | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('problemas_estudo')
    .insert({
      user_id: payload.userId,
      origem: payload.origem ?? 'manual',
      origem_ref_id: payload.origemRefId ?? null,
      titulo: payload.titulo,
      disciplina_id: payload.disciplinaId ?? null,
      disciplina_nome: payload.disciplinaNome ?? null,
      agendado_para: payload.agendadoPara ?? null,
      prioridade: payload.prioridade ?? 0,
      prova: payload.prova ?? null,
      ano: payload.ano ?? null,
      cor_prova: payload.corProva ?? null,
      q_num: payload.qNum ?? null,
      conteudo_id: payload.conteudoId ?? null,
      conteudo_nome: payload.conteudoNome ?? null,
      sub_conteudo: payload.subConteudo ?? null,
      tipo_erro: payload.tipoErro ?? null,
      comentario: payload.comentario ?? null,
    })
    .select('*')
    .single();

  if (error) { console.error('[criarProblemaManual]', error.message); return null; }
  return data as ProblemaEstudo;
}

/**
 * Marca um problema como concluído com tempo gasto, nível de conforto e métricas de desempenho.
 * Também agenda revisões futuras se solicitado.
 */
export async function concluirProblema(
  id: string,
  payload: {
    tempoMin?: number | null;
    conforto?: number | null;
    questoesFeitas?: number | null;
    acertos?: number | null;
    comentario?: string | null;
    revisoes?: number[]; // dias para revisão (ex: [3, 7, 30])
  }
): Promise<boolean> {
  const supabase = createClient();
  
  // 1. Buscar o problema original para clonar o contexto nas revisões
  const { data: original, error: fetchError } = await supabase
    .from('problemas_estudo')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !original) {
    console.error('[concluirProblema] Erro ao buscar problema original:', fetchError?.message);
    return false;
  }

  // 2. Atualizar o problema atual
  const { error: updateError } = await supabase
    .from('problemas_estudo')
    .update({
      status: 'concluido',
      tempo_gasto_min: payload.tempoMin ?? null,
      conforto: payload.conforto ?? null,
      questoes_feitas: payload.questoesFeitas ?? 0,
      acertos: payload.acertos ?? 0,
      comentario: payload.comentario ?? original.comentario,
      concluido_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    console.error('[concluirProblema] Erro ao atualizar:', updateError.message);
    return false;
  }

  // 3. Registrar como uma Sessão de Estudo também (para aparecer no histórico)
  const { error: sessionError } = await supabase
    .from('sessoes_estudo')
    .insert({
      user_id: original.user_id,
      disciplina_id: original.disciplina_id,
      conteudo_id: original.conteudo_id,
      duracao_segundos: (payload.tempoMin || 0) * 60,
      acertos: payload.acertos || 0,
      total_questoes: payload.questoesFeitas || 0,
      tipo_estudo: original.origem === 'redacao' ? 'Redação' : 
                   original.origem === 'kevquest' ? 'Questões' : 'Revisão',
      comentario: payload.comentario || original.comentario,
      conforto: payload.conforto || null
    });

  if (sessionError) {
    console.error('[concluirProblema] Erro ao registrar sessão:', sessionError.message);
  }

  // 4. Agendar revisões (criar novos problemas pendentes, numerados R1, R2, R3...)
  if (payload.revisoes && payload.revisoes.length > 0) {
    const revisoesParaInserir = payload.revisoes.map((dias, idx) => {
      const dataRevisao = new Date();
      dataRevisao.setDate(dataRevisao.getDate() + dias);
      const numRevisao = idx + 1; // R1 = 1, R2 = 2, ...
      
      return {
        user_id: original.user_id,
        origem: original.origem,
        titulo: `R${numRevisao}: ${original.titulo}`,
        disciplina_id: original.disciplina_id,
        disciplina_nome: original.disciplina_nome,
        conteudo_id: original.conteudo_id,
        conteudo_nome: original.conteudo_nome,
        sub_conteudo: original.sub_conteudo,
        prova: original.prova,
        ano: original.ano,
        q_num: original.q_num,
        prioridade: 0,
        status: 'pendente',
        agendado_para: dataRevisao.toISOString().split('T')[0],
        numero_revisao: numRevisao,
      };
    });

    const { error: insertError } = await supabase
      .from('problemas_estudo')
      .insert(revisoesParaInserir);

    if (insertError) {
      console.error('[concluirProblema] Erro ao agendar revisões:', insertError.message);
      // Não retornamos false aqui porque o problema principal foi concluído
    }
  }

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
