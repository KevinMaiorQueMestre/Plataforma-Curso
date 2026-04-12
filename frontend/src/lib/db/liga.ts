import { createClient } from "@/utils/supabase/client";

export type LigaRankItem = {
  user_id: string;
  nome: string;
  avatar_url: string | null;
  total_questoes: number;
  duracao_segundos: number;
  dias_ativos: number;
  pontos: number;
  rank: number;
  liga: "bronze" | "prata" | "ouro" | "diamante"; // Calculado dinamicamente no resolver
};

// Limiares de Liga Baseados no Config
export function getLigaByPoints(pontos: number): "bronze" | "prata" | "ouro" | "diamante" {
  if (pontos >= 5000) return "diamante";
  if (pontos >= 2500) return "ouro";
  if (pontos >= 1000) return "prata";
  return "bronze";
}

/**
 * Busca o ranking geral de todas as ligas ordenado pela coluna parametrizada
 */
export async function getTopRanking(
  column: "pontos" | "total_questoes" | "duracao_segundos" | "dias_ativos",
  limit = 10
): Promise<LigaRankItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vw_ranking_liga")
    .select("*")
    .order(column, { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getTopRanking]", error.message);
    return [];
  }

  // Inject computed liga based on their calculated points
  return (data || []).map((row: any) => ({
    ...row,
    liga: getLigaByPoints(row.pontos)
  }));
}

/**
 * Busca o perfil de estatística de Liga do Aluno autenticado.
 */
export async function getMeuRanking(): Promise<LigaRankItem | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("vw_ranking_liga")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("[getMeuRanking]", error.message);
    
    // Se não tiver dado na view por atraso, cria o fallback default zerado
    return {
      user_id: user.id,
      nome: "Você",
      avatar_url: null,
      total_questoes: 0,
      duracao_segundos: 0,
      dias_ativos: 0,
      pontos: 0,
      rank: 0,
      liga: "bronze"
    };
  }

  return {
    ...data,
    nome: "Você", // Sempre mostramos 'Você' para o user ativo local
    liga: getLigaByPoints(data.pontos)
  };
}
