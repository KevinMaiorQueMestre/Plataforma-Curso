"use client";

import { useEffect, useState } from "react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { createClient } from "@/utils/supabase/client";
import { 
  User, 
  Mail, 
  MapPin, 
  Settings2, 
  LayoutDashboard, 
  ChevronRight, 
  Loader2,
  Database,
  Shield,
  Lock,
  X,
  Key
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function ConfiguracoesPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

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
      setLoading(false);
    }
    loadProfile();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl pb-20">
      <header className="mb-6">
        <h1 className="text-3xl font-black text-slate-800 dark:text-[#FFFFFF] tracking-tight transition-colors">Configurações</h1>
        <p className="text-sm text-slate-500 dark:text-[#A1A1AA] mt-1 font-medium italic transition-colors">Gerencie seu perfil e as variáveis do sistema.</p>
      </header>

      {/* 1. CARD DE PERFIL (DADOS REAIS) */}
      <section className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
        
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : profile ? (
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
            {/*Avatar */}
            <div className="w-32 h-32 rounded-[2rem] bg-slate-100 dark:bg-[#2C2C2E] border-4 border-white dark:border-[#1C1C1E] shadow-xl overflow-hidden flex-shrink-0">
               {profile.avatar_url ? (
                 <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-4xl font-black">
                   {profile.nome?.[0] || "?"}
                 </div>
               )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg mb-3">
                Conta {profile.role || "Aluno"}
              </span>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{profile.nome || "Estudante"}</h2>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6 text-slate-500 dark:text-[#A1A1AA]">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="w-4 h-4" /> {profile.email || "Não informado"}
                </div>
                {profile.nivel_acesso && (
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <LayoutDashboard className="w-4 h-4" /> Plano: {profile.nivel_acesso.toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                 <div className="px-4 py-2 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-100 dark:border-white/5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400">
                    ID: {profile.id.substring(0, 8)}...
                 </div>
                 <div className="px-4 py-2 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-100 dark:border-white/5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400">
                    Desde: {new Date(profile.created_at).toLocaleDateString()}
                 </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-slate-500">Erro ao carregar perfil.</p>
        )}
      </section>

      {/* 2. CONFIGURAÇÕES DO SISTEMA (MINIMALISTAS) */}
      <div className="flex flex-col gap-4">
        
        {/* Linha: Aparência/Interface */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl px-8 py-5 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex items-center justify-between group transition-all hover:bg-slate-50 dark:hover:bg-[#252529]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Aparência do Dashboard</h3>
            </div>
          </div>
          <ThemeSwitcher />
        </div>

        {/* Linha: Edição de Variáveis KevQuest */}
        <Link 
          href="/configuracoes/variaveis"
          className="bg-white dark:bg-[#1C1C1E] rounded-3xl px-8 py-5 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex items-center justify-between group transition-all hover:bg-amber-50 dark:hover:bg-amber-500/5 active:scale-[0.99]"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Variáveis Padrão</h3>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
        </Link>

        {/* Linha: Privacidade (Troca de Senha) */}
        <Link 
          href="/configuracoes/seguranca"
          className="bg-white dark:bg-[#1C1C1E] rounded-3xl px-8 py-5 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex items-center justify-between group transition-all hover:bg-rose-50 dark:hover:bg-rose-500/5 active:scale-[0.99] w-full"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Privacidade & Senha</h3>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
        </Link>

      </div>
    </div>
  );
}
