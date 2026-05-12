"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Activity, CheckSquare, MessageSquare,
  RefreshCw, Trash2, Loader2, Radio, Shield,
  FileCheck2, Zap, Megaphone, Send, AlertCircle,
  Pencil, X, Check, Clock, ChevronDown, ChevronUp,
  Infinity as InfinityIcon,
} from "lucide-react";
import { format, addDays, isPast, differenceInDays, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { createClient } from "@/utils/supabase/client";
import { useGlobalPresence } from "@/components/GlobalPresenceProvider";

// ─── Tipos ─────────────────────────────────────────────────────────────────
interface PlatformStats {
  totalAlunos: number;
  alunosAtivos: number;
  alunosBloqueados: number;
  sessoesHoje: number;
  simuladosSemana: number;
  totalPostsMural: number;
  tarefasConcluidas: number;
  tarefasPendentes: number;
}

interface OnlineUser {
  user_id: string;
  nome: string;
  avatar_url?: string;
}

interface Comunicado {
  id: string;
  titulo: string;
  descricao: string;
  created_at: string;
  is_published: boolean;
  expires_at: string | null;
}

// ─── Helper: label de expiração ───────────────────────────────────────────
function expirationLabel(expires_at: string | null): { text: string; color: string } {
  if (!expires_at) return { text: "Sem prazo", color: "text-slate-400" };
  const hoursLeft = differenceInHours(new Date(expires_at), new Date());
  if (hoursLeft < 0) return { text: "Expirado", color: "text-rose-500" };
  if (hoursLeft < 24) return { text: `Expira em ${hoursLeft}h`, color: "text-amber-500" };
  const daysLeft = differenceInDays(new Date(expires_at), new Date());
  return { text: `Expira em ${daysLeft}d`, color: "text-teal-500" };
}

// ─── Opções de duração ────────────────────────────────────────────────────
const DURATION_OPTIONS = [
  { value: "0",  label: "Sem prazo",       icon: "∞"  },
  { value: "1",  label: "1 dia",           icon: "1d" },
  { value: "3",  label: "3 dias",          icon: "3d" },
  { value: "7",  label: "7 dias",          icon: "7d" },
  { value: "15", label: "15 dias",         icon: "15d"},
  { value: "30", label: "30 dias",         icon: "30d"},
] as const;

// ─── Card de Estatística ───────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-3xl p-6 border border-white/5 flex flex-col gap-3 shadow-sm`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${color} opacity-80`}>{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div>
        <p className={`text-4xl font-black tabular-nums ${color}`}>{value}</p>
        {sub && <p className="text-[11px] font-bold text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Página Principal ──────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const supabase = createClient();

  // ── Estatísticas ──────────────────────────────────────────────────────────
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // ── Mural ─────────────────────────────────────────────────────────────────
  const [comunidadePosts, setComunidadePosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // ── Presence ─────────────────────────────────────────────────────────────
  const { onlineUsers } = useGlobalPresence();

  // ── Comunicados ───────────────────────────────────────────────────────────
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loadingComunicados, setLoadingComunicados] = useState(true);
  const [showComunicados, setShowComunicados] = useState(true);

  const [avisoTitle, setAvisoTitle] = useState("");
  const [avisoDesc, setAvisoDesc] = useState("");
  const [avisoDuration, setAvisoDuration] = useState("7");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ─── Fetch estatísticas globais ──────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const hoje = new Date().toISOString().split("T")[0];
      const umaSemanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [profilesRes, sessoesHojeRes, simuladosSemanaRes, muralRes, tarefasRes] =
        await Promise.all([
          supabase.from("profiles").select("id, is_active, role"),
          supabase.from("sessoes_estudo").select("id", { count: "exact" }).gte("created_at", hoje),
          supabase.from("simulado_resultados").select("id", { count: "exact" }).gte("created_at", umaSemanaAtras),
          supabase.from("mural_comunidade").select("id", { count: "exact" }),
          supabase.from("tarefas").select("status"),
        ]);

      const profiles = profilesRes.data || [];
      const alunos = profiles.filter((p: any) => p.role !== "admin");
      const alunosAtivos = alunos.filter((p: any) => p.is_active !== false).length;
      const alunosBloqueados = alunos.filter((p: any) => p.is_active === false).length;

      const tarefas = tarefasRes.data || [];
      const tarefasConcluidas = tarefas.filter((t: any) => t.status === "completed").length;
      const tarefasPendentes = tarefas.filter((t: any) => t.status !== "completed").length;

      setStats({
        totalAlunos: alunos.length,
        alunosAtivos,
        alunosBloqueados,
        sessoesHoje: sessoesHojeRes.count ?? 0,
        simuladosSemana: simuladosSemanaRes.count ?? 0,
        totalPostsMural: muralRes.count ?? 0,
        tarefasConcluidas,
        tarefasPendentes,
      });
    } catch (err) {
      console.error("Erro ao buscar stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // ─── Fetch mural da comunidade ───────────────────────────────────────────
  const fetchCommunityPosts = useCallback(async () => {
    setLoadingPosts(true);
    const { data } = await supabase
      .from("mural_comunidade")
      .select("*, profiles(nome, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(40);
    if (data) setComunidadePosts(data);
    setLoadingPosts(false);
  }, []);

  // ─── Fetch comunicados admin ─────────────────────────────────────────────
  const fetchComunicados = useCallback(async () => {
    setLoadingComunicados(true);
    const { data } = await supabase
      .from("calendario_eventos")
      .select("id, titulo, descricao, created_at, is_published, expires_at")
      .eq("tipo", "aviso_admin")
      .order("created_at", { ascending: false });
    if (data) setComunicados(data as Comunicado[]);
    setLoadingComunicados(false);
  }, []);

  // ─── Calcula expires_at ───────────────────────────────────────────────────
  const computeExpiresAt = (days: string): string | null => {
    if (days === "0") return null;
    return addDays(new Date(), parseInt(days)).toISOString();
  };

  // ─── Publicar / Atualizar comunicado ─────────────────────────────────────
  const handleSendAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avisoTitle.trim() || !avisoDesc.trim()) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const expiresAt = computeExpiresAt(avisoDuration);

      if (editingId) {
        const { error } = await supabase
          .from("calendario_eventos")
          .update({ titulo: avisoTitle, descricao: avisoDesc, expires_at: expiresAt })
          .eq("id", editingId);
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase.from("calendario_eventos").insert({
          user_id: user?.id,
          titulo: avisoTitle,
          descricao: avisoDesc,
          tipo: "aviso_admin",
          date_iso: new Date().toISOString().split("T")[0],
          time_slot: format(new Date(), "HH:mm", { locale: ptBR }),
          color_class: "bg-indigo-500",
          is_published: true,
          expires_at: expiresAt,
        });
        if (error) throw error;
      }

      await fetchComunicados();
      setAvisoTitle("");
      setAvisoDesc("");
      setAvisoDuration("7");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      alert(`❌ Erro ao salvar: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Iniciar edição ───────────────────────────────────────────────────────
  const handleStartEdit = (c: Comunicado) => {
    setEditingId(c.id);
    setAvisoTitle(c.titulo);
    setAvisoDesc(c.descricao ?? "");
    if (!c.expires_at) {
      setAvisoDuration("0");
    } else {
      const daysLeft = Math.max(1, differenceInDays(new Date(c.expires_at), new Date()));
      const closest = ["1", "3", "7", "15", "30"].reduce((prev, cur) =>
        Math.abs(parseInt(cur) - daysLeft) < Math.abs(parseInt(prev) - daysLeft) ? cur : prev
      );
      setAvisoDuration(closest);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setAvisoTitle("");
    setAvisoDesc("");
    setAvisoDuration("7");
  };

  // ─── Apagar comunicado ────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("calendario_eventos").delete().eq("id", id);
      if (error) throw error;
      await fetchComunicados();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      alert(`❌ Erro ao apagar: ${msg}`);
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Moderação mural ──────────────────────────────────────────────────────
  const handleDeleteMuralPost = async (id: string) => {
    if (!confirm("Tem certeza que deseja apagar essa mensagem do mural?")) return;
    try {
      const { error } = await supabase.from("mural_comunidade").delete().eq("id", id);
      if (error) throw error;
      setComunidadePosts((prev) => prev.filter((p: any) => p.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      alert("Erro ao remover: " + msg);
    }
  };

  // ─── Efeito principal ─────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    fetchStats();
    fetchCommunityPosts();
    fetchComunicados();

    // Realtime: novos posts no mural
    const muralChannel = supabase
      .channel("admin_mural_watch")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mural_comunidade" }, () => {
        if (mounted) fetchCommunityPosts();
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(muralChannel);
    };
  }, []);

  const formatTimeAgo = (dateStr: string): string => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s atrás`;
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  const isEditing = !!editingId;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 px-4 md:px-0 font-sans">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
              <div className="bg-indigo-600 p-3 rounded-[1.2rem] shadow-lg shadow-indigo-600/20">
                <Zap className="w-8 h-8 text-white" />
              </div>
              Central de Operações
            </h1>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-3 ml-2">
              Monitoramento e saúde da plataforma em tempo real
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 rounded-2xl px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-xs font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest">
                {onlineUsers.length} online
              </span>
            </div>
            <button
              onClick={() => { fetchStats(); fetchCommunityPosts(); fetchComunicados(); }}
              className="p-2.5 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-xl text-slate-400 hover:text-slate-600 shadow-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── CARDS DE ESTATÍSTICAS ───────────────────────────────────────────── */}
      {loadingStats ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total de Alunos"
            value={stats.totalAlunos}
            sub={`${stats.alunosAtivos} ativos · ${stats.alunosBloqueados} bloq.`}
            color="text-indigo-600 dark:text-indigo-400"
            bg="bg-indigo-50 dark:bg-indigo-500/10"
          />
          <StatCard
            icon={Activity}
            label="Sessões Hoje"
            value={stats.sessoesHoje}
            sub="registros de estudo"
            color="text-teal-600 dark:text-teal-400"
            bg="bg-teal-50 dark:bg-teal-500/10"
          />
          <StatCard
            icon={FileCheck2}
            label="Simulados (7d)"
            value={stats.simuladosSemana}
            sub="últimos 7 dias"
            color="text-violet-600 dark:text-violet-400"
            bg="bg-violet-50 dark:bg-violet-500/10"
          />
          <StatCard
            icon={CheckSquare}
            label="Tarefas"
            value={stats.tarefasConcluidas}
            sub={`${stats.tarefasPendentes} pendentes`}
            color="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-50 dark:bg-emerald-500/10"
          />
        </div>
      ) : null}

      {/* ── GRID PRINCIPAL ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Coluna Esquerda ─────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">

          {/* ── Formulário de Comunicado ──────────────────────────────────── */}
          <div className={`rounded-[2rem] p-6 border shadow-xl relative overflow-hidden transition-all duration-300 ${
            isEditing
              ? "bg-gradient-to-br from-amber-500 to-orange-600 border-amber-400 shadow-amber-500/20"
              : "bg-gradient-to-br from-indigo-600 to-violet-700 border-indigo-500 shadow-indigo-500/20"
          }`}>
            <Megaphone className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 pointer-events-none" />
            <div className="relative z-10">
              <h3 className="font-black text-white mb-5 flex items-center gap-2 text-base">
                {isEditing
                  ? <><Pencil className="w-5 h-5" /> Editar Comunicado</>
                  : <><AlertCircle className="w-5 h-5" /> Comunicado do Sistema</>
                }
              </h3>
              <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-5">
                Avisos de manutenção, atualizações e notícias
              </p>
              <form onSubmit={handleSendAviso} className="space-y-4">
                {/* Título */}
                <div>
                  <label className="text-[10px] uppercase font-black text-white/70 tracking-[0.2em] mb-2 block">
                    Título do Aviso
                  </label>
                  <input
                    type="text"
                    value={avisoTitle}
                    onChange={(e) => setAvisoTitle(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-white/50 outline-none transition-colors backdrop-blur-md disabled:opacity-60"
                    placeholder="Ex: Manutenção programada 🔧"
                  />
                </div>
                {/* Conteúdo */}
                <div>
                  <label className="text-[10px] uppercase font-black text-white/70 tracking-[0.2em] mb-2 block">
                    Mensagem
                  </label>
                  <textarea
                    value={avisoDesc}
                    onChange={(e) => setAvisoDesc(e.target.value)}
                    required
                    rows={3}
                    disabled={isSubmitting}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-white/50 outline-none transition-colors backdrop-blur-md resize-none disabled:opacity-60"
                    placeholder="Descreva o aviso para os alunos..."
                  />
                </div>
                {/* Duração */}
                <div>
                  <label className="text-[10px] uppercase font-black text-white/70 tracking-[0.2em] mb-2 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Exibir na home por
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setAvisoDuration(opt.value)}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition-all border flex flex-col items-center gap-0.5 ${
                          avisoDuration === opt.value
                            ? "bg-white text-indigo-700 border-white shadow-lg scale-[1.03]"
                            : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                        } disabled:opacity-60`}
                      >
                        <span className="text-base leading-none">
                          {opt.value === "0" ? <InfinityIcon className="w-4 h-4 inline" /> : opt.icon}
                        </span>
                        <span className="text-[9px] leading-tight text-center opacity-80">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Botões */}
                <div className="flex gap-2">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                      className="flex-shrink-0 py-3 px-4 bg-white/20 text-white hover:bg-white/30 font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-60"
                    >
                      <X className="w-4 h-4" /> Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-white text-indigo-700 hover:bg-slate-100 font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center gap-2 justify-center disabled:opacity-60"
                  >
                    {isSubmitting
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : isEditing
                        ? <Check className="w-4 h-4" />
                        : <Send className="w-4 h-4" />}
                    {isSubmitting ? "Salvando..." : isEditing ? "Salvar Alterações" : "Publicar Aviso"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Lista de Comunicados Publicados ───────────────────────────── */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm overflow-hidden">
            <button
              onClick={() => setShowComunicados((v) => !v)}
              className="w-full px-6 py-4 flex justify-between items-center bg-slate-50/50 dark:bg-[#1C1C1E] hover:bg-slate-50 dark:hover:bg-[#2C2C2E] transition-colors"
            >
              <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2 text-sm">
                <Megaphone className="w-4 h-4 text-indigo-500" />
                Avisos Publicados
                {!loadingComunicados && (
                  <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {comunicados.length}
                  </span>
                )}
              </h3>
              {showComunicados
                ? <ChevronUp className="w-4 h-4 text-slate-400" />
                : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showComunicados && (
              <div className="divide-y divide-slate-50 dark:divide-[#2C2C2E] max-h-80 overflow-y-auto">
                {loadingComunicados ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                  </div>
                ) : comunicados.length === 0 ? (
                  <div className="py-8 text-center opacity-50">
                    <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-400">Nenhum aviso publicado.</p>
                  </div>
                ) : (
                  comunicados.map((c) => {
                    const expLabel = expirationLabel(c.expires_at);
                    const expired = c.expires_at ? isPast(new Date(c.expires_at)) : false;
                    return (
                      <div
                        key={c.id}
                        className={`px-5 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-[#2C2C2E] transition-colors group ${
                          editingId === c.id ? "bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400" : ""
                        } ${expired ? "opacity-60" : ""}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{c.titulo}</p>
                            {expired && (
                              <span className="flex-shrink-0 text-[9px] font-black bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-full">
                                expirado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{c.descricao}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] text-slate-400 font-medium">{formatTimeAgo(c.created_at)}</p>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span className={`text-[10px] font-black flex items-center gap-0.5 ${expLabel.color}`}>
                              {c.expires_at
                                ? <Clock className="w-2.5 h-2.5" />
                                : <InfinityIcon className="w-2.5 h-2.5" />}
                              {expLabel.text}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(c)}
                            title="Editar"
                            className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={deletingId === c.id}
                            title="Apagar"
                            className="p-2 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-500/30 transition-colors disabled:opacity-50"
                          >
                            {deletingId === c.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* ── Alunos Online Agora ───────────────────────────────────────── */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 dark:border-[#2C2C2E] flex items-center justify-between bg-slate-50/50 dark:bg-[#1C1C1E]">
              <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-teal-500" />
                Alunos Online Agora
              </h3>
              <span className="text-2xl font-black text-teal-500 tabular-nums">{onlineUsers.length}</span>
            </div>
            <div className="p-5 min-h-[80px]">
              {onlineUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 opacity-40">
                  <Users className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-400">Nenhum aluno online.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {onlineUsers.map((u) => (
                    <div key={u.user_id} className="flex items-center gap-3 py-2 px-3 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E]">
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400 overflow-hidden">
                          {u.avatar_url
                            ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />
                            : u.nome?.[0]?.toUpperCase() || "?"}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-teal-500 border-2 border-white dark:border-[#2C2C2E]" />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate flex-1">{u.nome}</span>
                      <span className="text-[9px] font-black text-teal-500 bg-teal-50 dark:bg-teal-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest flex-shrink-0">LIVE</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Status do Sistema ─────────────────────────────────────────── */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 dark:border-[#2C2C2E] bg-slate-50/50 dark:bg-[#1C1C1E]">
              <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-indigo-500" />
                Status do Sistema
              </h3>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: "Banco de Dados",  status: "Operacional", ok: true },
                { label: "Autenticação",    status: "Operacional", ok: true },
                { label: "Armazenamento",   status: "Operacional", ok: true },
                { label: "Realtime",        status: "Conectado",   ok: true },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{s.label}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1 ${
                    s.ok
                      ? "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400"
                      : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.ok ? "bg-teal-500" : "bg-rose-500"}`} />
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── Coluna Direita — Radar da Comunidade ───────────────────────── */}
        <div className="lg:col-span-8">
          <div
            className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm flex flex-col overflow-hidden"
            style={{ minHeight: 520 }}
          >
            <div className="px-6 py-4 border-b border-slate-50 dark:border-[#2C2C2E] flex justify-between items-center bg-slate-50/50 dark:bg-[#1C1C1E]">
              <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
                Radar da Comunidade
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 font-bold px-3 py-1 rounded-full animate-pulse capitalize tracking-widest">
                  Live
                </span>
                <span className="text-xs font-bold text-slate-400">{comunidadePosts.length} msgs</span>
                <button onClick={fetchCommunityPosts} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/20 dark:bg-black/10 custom-scrollbar">
              {loadingPosts ? (
                <div className="flex items-center justify-center h-full py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                </div>
              ) : comunidadePosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 opacity-50">
                  <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-400">Nenhuma mensagem ainda.</p>
                </div>
              ) : (
                comunidadePosts.map((post: any) => (
                  <div key={post.id} className="flex gap-3 items-start group/post">
                    <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 overflow-hidden">
                      {post.profiles?.avatar_url
                        ? <img src={post.profiles.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                        : post.profiles?.nome?.[0] || "?"}
                    </div>
                    <div className="flex-1 bg-white dark:bg-[#2C2C2E] border border-slate-100 dark:border-[#3A3A3C] px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm relative">
                      <div className="absolute top-2 right-2 opacity-0 group-hover/post:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDeleteMuralPost(post.id)}
                          title="Apagar do mural"
                          className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-500/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex justify-between items-baseline mb-0.5 pr-8">
                        <span className="text-xs font-black text-slate-800 dark:text-white">
                          {post.profiles?.nome || "Usuário"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{formatTimeAgo(post.created_at)}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-[95%]">{post.conteudo}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
