"use client";

import React, { useState, useEffect } from "react";
import { Users, Shield, ShieldAlert, ShieldCheck, CheckCircle2, XCircle, Search, Save, AlertTriangle, Plus, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";

type Profile = {
  id: string;
  nome: string;
  avatar_url: string;
  role: string;
  nivel_acesso: string;
  is_active: boolean;
  created_at: string;
};

export default function AdminGestaoAlunosPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // States for user creation
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchAlunos();
  }, []);

  const fetchAlunos = async () => {
    setIsLoaded(false);
    // Filtrar apenas role 'aluno'
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "aluno")
      .order("created_at", { ascending: false });

    if (data && !error) {
      setProfiles(data as Profile[]);
    }
    setIsLoaded(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) return;
    
    setIsCreating(true);

    try {
      // Cria client supabase EFÊMERO focado na criação p/ não matar a sessão do admin atual
      const tempSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      const { data, error: signUpError } = await tempSupabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
      });

      if (signUpError) throw signUpError;

      if (data?.user) {
        // Atualiza o profile criado com o nome via primary client que já tem privilégios admin/auth
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ nome: newUserName, nivel_acesso: 'basico', is_active: true })
          .eq('id', data.user.id);
          
        if (profileError) console.error("Erro ao atualizar profile", profileError);
      }

      toast.success("Novo aluno cadastrado com sucesso!");
      setIsCreateModalOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      fetchAlunos();
    } catch (err: any) {
      toast.error("Erro ao criar cadastro", { description: err.message });
    } finally {
      setIsCreating(false);
    }
  };

  const updateNivelAcesso = async (userId: string, newNivel: string) => {
    setLoadingId(userId);
    const { data, error } = await supabase
      .from("profiles")
      .update({ nivel_acesso: newNivel })
      .eq("id", userId)
      .select()
      .single();

    if (!error && data) {
      setProfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, nivel_acesso: data.nivel_acesso } : p)));
    }
    setLoadingId(null);
  };

  const toggleStatus = async (userId: string, currentStatus: boolean) => {
    setLoadingId(userId);
    const { data, error } = await supabase
      .from("profiles")
      .update({ is_active: !currentStatus })
      .eq("id", userId)
      .select()
      .single();

    if (!error && data) {
      setProfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, is_active: data.is_active } : p)));
    }
    setLoadingId(null);
  };

  const filteredProfiles = profiles.filter((p) => {
     const t = searchTerm.toLowerCase();
     return p.nome?.toLowerCase().includes(t) || p.nivel_acesso?.toLowerCase().includes(t);
  });

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-20 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-600/20">
              <Users className="w-7 h-7 text-white" />
            </div>
            Gestão de Alunos
          </h1>
          <p className="text-slate-500 dark:text-[#A1A1AA] mt-2 font-medium text-lg">Controle de acessos, bloqueios e permissões da plataforma.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Cadastrar Novo Usuário
        </button>
      </header>

      {/* Modal Criar Usuario */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1C1C1E] border border-slate-100 dark:border-[#2C2C2E] w-full max-w-md rounded-3xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Novo Aluno</h2>
            <p className="text-slate-500 text-sm mb-6 font-medium">Cadastre e libere um novo aluno diretamente na base oficial da plataforma.</p>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs uppercase font-black text-slate-500 tracking-wider mb-2 block">Nome do Aluno</label>
                <input 
                  type="text" 
                  value={newUserName} 
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#2C2C2E] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white font-bold placeholder:text-slate-400"
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase font-black text-slate-500 tracking-wider mb-2 block">Email de Acesso</label>
                <input 
                  type="email" 
                  value={newUserEmail} 
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#2C2C2E] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white font-bold placeholder:text-slate-400"
                  placeholder="aluno@email.com"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase font-black text-slate-500 tracking-wider mb-2 block">Senha Provisória</label>
                <input 
                  type="password" 
                  value={newUserPassword} 
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#2C2C2E] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white font-bold placeholder:text-slate-400"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>
              <button 
                type="submit"
                disabled={isCreating}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg mt-6 active:scale-95 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCreating ? <div className="animate-spin w-5 h-5 border-2 border-white rounded-full border-t-transparent"></div> : 'Efetivar Cadastro e Liberar Acesso'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm flex flex-col overflow-hidden min-h-[600px]">
        {/* Toolbar de Busca */}
        <div className="px-8 py-6 border-b border-slate-50 dark:border-[#2C2C2E] flex justify-between items-center bg-slate-50/30 dark:bg-[#1C1C1E]">
           <div className="relative w-full max-w-md">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                 type="text" 
                 placeholder="Buscar por nome ou nível..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-slate-100 dark:bg-[#2C2C2E] border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 outline-none transition-all"
              />
           </div>
        </div>

        {/* Lista/Tabela de Alunos */}
        <div className="p-8">
           {!isLoaded ? (
              <div className="flex items-center justify-center h-40">
                 <div className="animate-spin w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent"></div>
              </div>
           ) : filteredProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                 <div className="w-20 h-20 bg-slate-50 dark:bg-[#2C2C2E] rounded-full flex items-center justify-center mb-4">
                    <Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                 </div>
                 <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Nenhum aluno encontrado</h3>
                 <p className="text-slate-500 font-medium">Os alunos cadastrados aparecerão nesta listagem.</p>
              </div>
           ) : (
              <div className="grid gap-4">
                 {filteredProfiles.map((aluno) => {
                    const isPremium = aluno.nivel_acesso === 'premium';
                    const isPro = aluno.nivel_acesso === 'pro';

                    return (
                       <div key={aluno.id} className="group bg-slate-50/50 dark:bg-[#202022] hover:bg-slate-50 dark:hover:bg-[#252528] border border-slate-100 dark:border-[#2C2C2E] rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300">
                          {/* Info Column */}
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden text-indigo-600 font-black text-lg">
                                {aluno.avatar_url ? (
                                   <img src={aluno.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                   aluno.nome?.substring(0, 2).toUpperCase() || 'AL'
                                )}
                             </div>
                             <div>
                                <h4 className="font-black text-slate-800 dark:text-white text-lg flex items-center gap-2">
                                  {aluno.nome}
                                  {!aluno.is_active && (
                                     <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md uppercase tracking-wider">Bloqueado</span>
                                  )}
                                </h4>
                                <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex gap-2">
                                   <span>Membro desde: {new Date(aluno.created_at).toLocaleDateString()}</span>
                                </div>
                             </div>
                          </div>

                          {/* Control Column */}
                          <div className={`flex flex-wrap md:flex-nowrap items-center gap-4 ${loadingId === aluno.id ? 'opacity-50 pointer-events-none' : ''}`}>
                             
                             {/* Selector de Nível */}
                             <div className="bg-white dark:bg-[#1C1C1E] p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-[#3A3A3C] flex items-center">
                                <button 
                                   onClick={() => updateNivelAcesso(aluno.id, 'basico')}
                                   className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${aluno.nivel_acesso === 'basico' ? 'bg-slate-100 dark:bg-[#2C2C2E] text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                   Básico
                                </button>
                                <button 
                                   onClick={() => updateNivelAcesso(aluno.id, 'pro')}
                                   className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${isPro ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-indigo-500'}`}
                                >
                                   PRO
                                </button>
                                <button 
                                   onClick={() => updateNivelAcesso(aluno.id, 'premium')}
                                   className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${isPremium ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-amber-500'}`}
                                >
                                   <Shield className="w-3.5 h-3.5" /> Premium
                                </button>
                             </div>

                             {/* Botão Block/Unblock */}
                             <button
                                onClick={() => toggleStatus(aluno.id, aluno.is_active)}
                                className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${
                                   aluno.is_active 
                                   ? 'bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600' 
                                   : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100 hover:text-emerald-600'
                                }`}
                                title={aluno.is_active ? 'Bloquear Aluno' : 'Liberar Aluno'}
                             >
                                {aluno.is_active ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                             </button>

                          </div>
                       </div>
                    );
                 })}
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
