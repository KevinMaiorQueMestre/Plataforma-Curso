import { createClient } from "@/utils/supabase/client";

export type UserPreferences = {
  id?: string;
  user_id?: string;
  provas: string[];
  anos: string[];
  cores: string[];
  motivos: string[];
};

/**
 * Busca as preferências no Supabase (configurações que ficavam no localStorage).
 * Se não existir, cria um registro padrão.
 */
export async function getPreferences(): Promise<UserPreferences> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { provas: [], anos: [], cores: [], motivos: [] };
  }

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getPreferences] Fetch error:", error.message);
  }

  if (data) {
    return data as UserPreferences;
  }

  // Fallback defaults: busca da configuração global (id fixo)
  let fallbackConfig = null;
  const { data: globalData, error: globalErr } = await supabase
    .from("plataforma_config")
    .select("*")
    .eq("id", "11111111-1111-1111-1111-111111111111")
    .maybeSingle();

  if (!globalErr && globalData) {
    fallbackConfig = globalData;
  }

  const defaultPrefs: UserPreferences = {
    provas: fallbackConfig?.provas || ["ENEM", "FUVEST", "UNICAMP", "UNESP", "Simulado Geral"],
    anos: fallbackConfig?.anos || ["2024", "2023", "2022", "2021", "2020", "2019", "2018"],
    cores: fallbackConfig?.cores || ["Azul", "Amarela", "Rosa", "Branca", "Cinza", "Verde"],
    motivos: fallbackConfig?.motivos || ["Falta de Atenção", "Não sabia a matéria", "Falta de tempo", "Interpretação", "Cálculo Básico"]
  };

  // Insert defaults so they are available next time
  const { error: insertErr } = await supabase.from("user_preferences").insert([{
    user_id: user.id,
    ...defaultPrefs
  }]);
  
  if (insertErr) {
    console.error("[getPreferences] Insert fallback error:", insertErr.message);
  }

  return defaultPrefs;
}

/**
 * Atualiza o registro de preferências unificado no banco de dados
 */
export async function updatePreferences(prefs: Partial<UserPreferences>): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("user_preferences")
    .upsert({
      user_id: user.id, // Supabase allows upserting by matching user_id if we created a UNIQUE index (which we did).
      provas: prefs.provas,
      anos: prefs.anos,
      cores: prefs.cores,
      motivos: prefs.motivos,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });

  if (error) {
    console.error("[updatePreferences] error:", error.message);
    return false;
  }
  
  return true;
}
