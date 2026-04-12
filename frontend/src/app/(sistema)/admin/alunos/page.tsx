"use client";

import React, { useState, useEffect } from "react";
import {
  Users, Shield, ShieldOff, CheckCircle2, Loader2,
  RefreshCw, ChevronRight, BarChart2, FileText,
  Clock, Target, Plus, X, PenTool, Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { createClient } from "@/utils/supabase/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Aluno {
  id: string;
  nome: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  avatar_url?: string;
}

interface AlunoMetrics {
  totalSimulados: number;
  mediaAcertos: number;
  totalRedacoes: number;
  mediaRedacao: number;
  totalSessoes: number;
  totalMinEstudo: number;
  totalTarefas: number;
  tarefasConcluidas: number;
}

// ─── Card Acordeão ────────────────────────────────────────────────────────────
function AlunoAccordionCard({
  aluno,
  onToggleStatus,
}: {
  aluno: Aluno;
  onToggleStatus: (id: string, cur: boolean) => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [expanded, setExpanded] = useState(false);
  const [metrics, setMetrics] = useState<AlunoMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  const colors = [
    "from-indigo-500 to-violet-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-blue-500 to-cyan-600",
  ];
  const colorIdx = aluno.email.charCodeAt(0) % colors.length;
  const initials = (aluno.nome || aluno.email || "?").slice(0, 2).toUpperCase();

  const handleExpand = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !metrics) {
      setLoadingMetrics(true);
      const [simRes, redRes, sessRes, tarRes] = await Promise.all([
        supabase.from("simulado_resultados").select("*").eq("aluno_id", aluno.id),
        supabase.from("redacoes_aluno").select("nota_redacao").eq("aluno_id", aluno.id),
        supabase.from("sessoes_estudo").select("duracao_minutos").eq("aluno_id", aluno.id),
        supabase.from("tarefas").select("concluida").eq("aluno_id", aluno.id),
      ]);
      const sims = simRes.data || [];
      const reds = redRes.data || [];
      const sess = sessRes.data || [];
      const tars = tarRes.data || [];
      const totalAcertos = sims.reduce((a: number, s: any) =>
        a + (s.linguagens || 0) + (s.humanas || 0) + (s.naturezas || 0) + (s.matematica || 0), 0);
      const comNota = reds.filter((r: any) => r.nota_redacao);
      setMetrics({
        totalSimulados: sims.length,
        mediaAcertos: sims.length ? Math.round(totalAcertos / sims.length) : 0,
        totalRedacoes: reds.length,
        mediaRedacao: comNota.length ? Math.round(comNota.reduce((a: number, r: any) => a + r.nota_redacao, 0) / comNota.length) : 0,
        totalSessoes: sess.length,
        totalMinEstudo: sess.reduce((a: number, s: any) => a + (s.duracao_minutos || 0), 0),
        totalTarefas: tars.length,
        tarefasConcluidas: tars.filter((t: any) => t.concluida).length,
      });
      setLoadingMetrics(false);
    }
  };

  const statItems = metrics
    ? [
        { icon: Target, label: "Simulados", value: metrics.totalSimulados, sub: metrics.totalSimulados ? `Média ${metrics.mediaAcertos}/180` : "Nenhum", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
        { icon: FileText, label: "Redações", value: metrics.totalRedacoes, sub: metrics.mediaRedacao ? `Média ${metrics.mediaRedacao} pts` : "Sem nota", color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10" },
        { icon: Clock, label: "Horas Estudo", value: `${Math.round(metrics.totalMinEstudo / 60)}h`, sub: `${metrics.totalSessoes} sessões`, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
        { icon: CheckCircle2, label: "Tarefas", value: `${metrics.tarefasConcluidas}/${metrics.totalTarefas}`, sub: metrics.totalTarefas ? `${Math.round((metrics.tarefasConcluidas / metrics.totalTarefas) * 100)}% feitas` : "Sem tarefas", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
      ]
    : [];

  return (
    <motion.div
      layout
      className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-100 dark:border-[#2C2C2E] shadow-sm overflow-hidden"
    >
      {/* ── Linha collapsed (sempre visível) ── */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none group"
        onClick={handleExpand}
      >
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-white font-black text-xs flex-shrink-0 shadow-md`}>
          {aluno.avatar_url
            ? <img src={aluno.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
            : initials}
        </div>

        {/* Nome + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-800 dark:text-white truncate">
              {aluno.nome || "Sem nome"}
            </span>
            <span className={`flex-shrink-0 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
              aluno.is_active !== false
                ? "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400"
                : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
            }`}>
              {aluno.is_active !== false ? "Ativo" : "Bloq."}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate">{aluno.email}</p>
        </div>

        {/* Botão ver métricas */}
        <span className="flex-shrink-0 flex items-center gap-1 text-[11px] font-black text-indigo-500 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
          Ver métricas
          <motion.span animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.span>
        </span>
      </div>

      {/* ── Painel expandido ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-slate-50 dark:border-[#2C2C2E] pt-4">
              {loadingMetrics ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                </div>
              ) : (
                <>
                  {/* Grid de métricas */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {statItems.map(s => (
                      <div key={s.label} className={`${s.bg} rounded-xl p-3`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
                        </div>
                        <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{s.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Rodapé com ações */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-white/5">
                    {/* Ações rápidas */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); onToggleStatus(aluno.id, aluno.is_active !== false); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                          aluno.is_active !== false
                            ? "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                            : "bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
                        }`}
                      >
                        {aluno.is_active !== false
                          ? <><ShieldOff className="w-3 h-3" /> Bloquear</>
                          : <><Shield className="w-3 h-3" /> Ativar</>}
                      </button>
                    </div>

                    {/* Ver detalhadamente */}
                    <button
                      onClick={e => { e.stopPropagation(); router.push(`/admin/alunos/${aluno.id}`); }}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-indigo-500/20"
                    >
                      Ver detalhadamente
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function AdminGestaoAlunosPage() {
  const supabase = createClient();

  const [users, setUsers] = useState<Aluno[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal criar aluno
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from("admin_alunos_view")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setUsers(data as Aluno[]);
    setLoadingUsers(false);
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_active: !currentStatus }).eq("id", userId);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
    } else {
      toast.error("Erro ao alterar status");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) return;
    setIsCreating(true);
    try {
      const tempSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      const { data, error: signUpError } = await tempSupabase.auth.signUp({
        email: newUserEmail, password: newUserPassword,
      });
      if (signUpError) throw signUpError;
      if (data?.user) {
        await supabase.from("profiles")
          .update({ nome: newUserName, nivel_acesso: "basico", is_active: true })
          .eq("id", data.user.id);
      }
      toast.success("Novo aluno cadastrado com sucesso!");
      setIsCreateModalOpen(false);
      setNewUserName(""); setNewUserEmail(""); setNewUserPassword("");
      fetchUsers();
    } catch (err: any) {
      toast.error("Erro ao criar cadastro", { description: err.message });
    } finally { setIsCreating(false); }
  };

  const filteredUsers = users.filter(u =>
    (u.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20 px-4 md:px-0 font-sans">

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-[1.2rem] shadow-lg shadow-indigo-600/20">
              <Users className="w-8 h-8 text-white" />
            </div>
            Gestão de Alunos
          </h1>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-3 ml-2">
            Controle de acessos, métricas e permissões
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Cadastrar Aluno
        </button>
      </header>

      {/* Toolbar de busca */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-2 rounded-xl">
            {users.length} alunos
          </span>
          <button
            onClick={fetchUsers}
            className="p-2.5 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] text-slate-400 hover:text-slate-600 rounded-xl transition-colors shadow-sm hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lista de Alunos */}
      {loadingUsers ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-slate-50 dark:bg-[#2C2C2E] rounded-full flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Nenhum aluno encontrado</h3>
          <p className="text-slate-500 font-medium">Os alunos cadastrados aparecerão nesta listagem.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredUsers.map(aluno => (
            <AlunoAccordionCard
              key={aluno.id}
              aluno={aluno}
              onToggleStatus={toggleUserStatus}
            />
          ))}
        </div>
      )}

      {/* ─── Modal Criar Aluno ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsCreateModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#1C1C1E] border border-slate-100 dark:border-[#2C2C2E] w-full max-w-md rounded-3xl p-8 shadow-2xl relative"
            >
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-1">Novo Aluno</h2>
              <p className="text-slate-500 text-sm mb-6 font-medium">Cadastre e libere um novo aluno na plataforma.</p>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="text-xs uppercase font-black text-slate-500 tracking-wider mb-2 block">Nome do Aluno</label>
                  <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full bg-slate-50 dark:bg-[#2C2C2E] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white font-bold placeholder:text-slate-400" placeholder="Nome completo" required />
                </div>
                <div>
                  <label className="text-xs uppercase font-black text-slate-500 tracking-wider mb-2 block">Email de Acesso</label>
                  <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-[#2C2C2E] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white font-bold placeholder:text-slate-400" placeholder="aluno@email.com" required />
                </div>
                <div>
                  <label className="text-xs uppercase font-black text-slate-500 tracking-wider mb-2 block">Senha Provisória</label>
                  <input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-[#2C2C2E] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white font-bold placeholder:text-slate-400" placeholder="Mínimo 6 caracteres" required minLength={6} />
                </div>
                <button type="submit" disabled={isCreating} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl mt-4 active:scale-95 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
                  {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Efetivar Cadastro e Liberar Acesso"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
