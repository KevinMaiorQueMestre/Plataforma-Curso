"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Shield, Lock, Key, Loader2, Save, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";

export default function SegurancaConfigPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [passForm, setPassForm] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const toggleLigaVisibility = async () => {
    if (!profile) return;
    setIsUpdatingPrivacy(true);
    const newVal = !profile.nome_visivel_liga;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ nome_visivel_liga: newVal })
        .eq("id", profile.id);
      
      if (error) throw error;
      setProfile({ ...profile, nome_visivel_liga: newVal });
      toast.success(newVal ? "Nome visível no ranking!" : "Nome oculto no ranking.");
    } catch (e: any) {
      toast.error("Erro ao atualizar privacidade.");
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    }
    loadProfile();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.email) return;

    if (passForm.new !== passForm.confirm) {
      toast.error("As novas senhas não coincidem.");
      return;
    }

    if (passForm.new.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsUpdating(true);
    try {
      // 1. Verificar senha atual
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: passForm.current
      });

      if (authError) {
        toast.error("Senha atual incorreta.");
        setIsUpdating(false);
        return;
      }

      // 2. Atualizar para nova senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: passForm.new
      });

      if (updateError) {
        toast.error("Erro ao atualizar senha: " + updateError.message);
      } else {
        toast.success("Senha alterada com sucesso!");
        router.push("/configuracoes");
      }
    } catch (e) {
      toast.error("Ocorreu um erro inesperado.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-2xl mx-auto pb-20">
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.push("/configuracoes")}
          className="p-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4 relative z-10">
          <div className="bg-rose-500 p-3 rounded-[1.2rem] shadow-lg shadow-rose-500/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
          Privacidade
        </h1>
        <div className="flex items-center gap-3 mt-3 relative z-10">
          <div className="h-1 w-12 bg-rose-500 rounded-full"></div>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em]">Gerencie sua senha e acessos</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Card de Visibilidade na Liga */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col gap-2">
           <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-4 pt-2 pb-6 border-b border-slate-100 dark:border-[#2C2C2E] mb-4">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-50 dark:bg-indigo-500/10 p-3.5 rounded-2xl shadow-sm">
                  <Eye className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Visibilidade na Liga</h2>
                   <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Controle como você aparece no ranking da plataforma</p>
                </div>
              </div>
              <button 
                type="button"
                disabled={isUpdatingPrivacy || !profile}
                onClick={toggleLigaVisibility}
                className={`w-14 h-8 flex-shrink-0 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-[#1C1C1E] ${profile?.nome_visivel_liga ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"} ${isUpdatingPrivacy ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow-sm transform transition-transform duration-300 ${profile?.nome_visivel_liga ? "translate-x-6" : "translate-x-0"}`} />
              </button>
           </div>
           
           <div className="px-4 py-2">
             <div className={`flex items-center gap-4 p-5 rounded-[1.5rem] transition-colors ${profile?.nome_visivel_liga ? "bg-indigo-50/50 dark:bg-indigo-500/5" : "bg-slate-50 dark:bg-[#252529]"}`}>
                <div className="p-2 rounded-xl bg-white dark:bg-[#2C2C2E] shadow-sm flex-shrink-0">
                  {profile?.nome_visivel_liga ? (
                    <Eye className="w-5 h-5 text-indigo-500" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {profile?.nome_visivel_liga 
                    ? "Seu nome está atualmente visível para os outros alunos na página da Liga."
                    : "Seu nome está oculto na Liga. Você aparecerá como 'Anônimo' no ranking para os demais estudantes."}
                </p>
             </div>
           </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col gap-2">
          
          <div className="flex items-center gap-4 px-4 pt-2 pb-6 border-b border-slate-100 dark:border-[#2C2C2E] mb-4">
            <div className="bg-rose-50 dark:bg-rose-500/10 p-3.5 rounded-2xl shadow-sm">
              <Lock className="w-6 h-6 text-rose-500" />
            </div>
            <div>
               <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Mudança de senha</h2>
               <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Atualize suas credenciais de segurança em ambiente protegido</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {/* Linha: Senha Atual */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-6 py-4 rounded-[2rem] hover:bg-slate-50 dark:hover:bg-[#252529] transition-colors group">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#2C2C2E] shadow-sm border border-slate-100 dark:border-transparent flex flex-shrink-0 items-center justify-center group-hover:scale-105 transition-transform">
                  <Key className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-rose-500 transition-colors" />
                </div>
                <div>
                  <h3 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-[0.15em]">Senha Atual</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Confirme sua identidade</p>
                </div>
              </div>
              <div className="w-full md:w-auto md:min-w-[320px]">
                <input 
                    type="password" required
                    value={passForm.current}
                    onChange={e => setPassForm({...passForm, current: e.target.value})}
                    placeholder="Insira sua senha atual"
                    className="w-full bg-slate-50 dark:bg-[#2C2C2E] border-2 border-transparent focus:border-rose-500/50 hover:bg-white dark:hover:bg-[#323236] rounded-2xl py-3.5 px-6 text-sm font-bold transition-all outline-none shadow-sm inset-0" 
                />
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-[#2C2C2E] mx-10 my-1" />

            {/* Linha: Nova Senha */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-6 py-4 rounded-[2rem] hover:bg-slate-50 dark:hover:bg-[#252529] transition-colors group">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#2C2C2E] shadow-sm border border-slate-100 dark:border-transparent flex flex-shrink-0 items-center justify-center group-hover:scale-105 transition-transform">
                  <Shield className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-[0.15em]">Nova Senha</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Mínimo de 6 caracteres</p>
                </div>
              </div>
              <div className="w-full md:w-auto md:min-w-[320px]">
                <input 
                    type="password" required
                    value={passForm.new}
                    onChange={e => setPassForm({...passForm, new: e.target.value})}
                    placeholder="Defina a nova senha"
                    className="w-full bg-slate-50 dark:bg-[#2C2C2E] border-2 border-transparent focus:border-indigo-500/50 hover:bg-white dark:hover:bg-[#323236] rounded-2xl py-3.5 px-6 text-sm font-bold transition-all outline-none shadow-sm inset-0" 
                />
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-[#2C2C2E] mx-10 my-1" />

            {/* Linha: Confirmar Nova Senha */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-6 py-4 rounded-[2rem] hover:bg-slate-50 dark:hover:bg-[#252529] transition-colors group">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#2C2C2E] shadow-sm border border-slate-100 dark:border-transparent flex flex-shrink-0 items-center justify-center group-hover:scale-105 transition-transform">
                  <Shield className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-[0.15em]">Confirmar Senha</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Repita a nova senha</p>
                </div>
              </div>
              <div className="w-full md:w-auto md:min-w-[320px]">
                <input 
                    type="password" required
                    value={passForm.confirm}
                    onChange={e => setPassForm({...passForm, confirm: e.target.value})}
                    placeholder="Repita a nova senha"
                    className="w-full bg-slate-50 dark:bg-[#2C2C2E] border-2 border-transparent focus:border-indigo-500/50 hover:bg-white dark:hover:bg-[#323236] rounded-2xl py-3.5 px-6 text-sm font-bold transition-all outline-none shadow-sm inset-0" 
                />
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-100 dark:border-[#2C2C2E] flex justify-end gap-4 mt-4 px-4">
            <button 
                type="button"
                onClick={() => router.push("/configuracoes")}
                className="px-8 py-4 font-bold text-slate-500 dark:text-[#A1A1AA] hover:bg-slate-100 dark:hover:bg-[#2C2C2E] rounded-2xl transition-all"
            >
                Cancelar
            </button>
            <button 
                disabled={isUpdating}
                type="submit" 
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black px-12 py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
            >
                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isUpdating ? "Salvando..." : "Salvar Alteração"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
