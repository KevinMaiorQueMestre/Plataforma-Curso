"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft, Users, Shield, ShieldOff, Key, PenTool,
  Target, FileText, Clock, CheckCircle2, Brain, Zap,
  BookOpen, BarChart2, Loader2, X, ChevronRight,
  TrendingUp, Calendar, Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Aluno {
  id: string;
  nome: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  avatar_url?: string;
  nivel_acesso?: string;
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
  totalKevQuest: number;
  simulados: any[];
  redacoes: any[];
  sessoes: any[];
}

type Tab = "overview" | "simulados" | "redacoes" | "estudo";

// ─── Página ────────────────────────────────────────────────────────────────────
export default function AlunoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const alunoId = params?.id as string;
  const supabase = createClient();

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [metrics, setMetrics] = useState<AlunoMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Edit
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ nome: "", role: "aluno", is_active: true });
  const [isSaving, setIsSaving] = useState(false);

  const colors = [
    "from-indigo-500 to-violet-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-blue-500 to-cyan-600",
  ];

  useEffect(() => {
    if (!alunoId) return;
    loadAll();
  }, [alunoId]);

  const loadAll = async () => {
    setLoading(true);
    const [profileRes, simRes, redRes, sessRes, tarRes, kqRes] = await Promise.all([
      supabase.from("admin_alunos_view").select("*").eq("id", alunoId).single(),
      supabase.from("simulado_resultados").select("*").eq("aluno_id", alunoId).order("realizado_em", { ascending: false }),
      supabase.from("redacoes_aluno").select("*").eq("aluno_id", alunoId).order("created_at", { ascending: false }),
      supabase.from("sessoes_estudo").select("*").eq("aluno_id", alunoId).order("data", { ascending: false }),
      supabase.from("tarefas").select("*").eq("aluno_id", alunoId),
      supabase.from("kevquest_entries").select("id").eq("aluno_id", alunoId),
    ]);

    if (profileRes.data) setAluno(profileRes.data as Aluno);

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
      totalKevQuest: kqRes.data?.length || 0,
      simulados: sims,
      redacoes: reds,
      sessoes: sess,
    });
    setLoading(false);
  };

  const toggleStatus = async () => {
    if (!aluno) return;
    const { error } = await supabase.from("profiles").update({ is_active: !aluno.is_active }).eq("id", aluno.id);
    if (!error) {
      setAluno(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
      toast.success(aluno.is_active ? "Aluno bloqueado" : "Aluno ativado");
    }
  };

  const openEdit = () => {
    if (!aluno) return;
    setEditForm({ nome: aluno.nome || "", role: aluno.role || "aluno", is_active: aluno.is_active !== false });
    setEditMode(true);
  };

  const saveEdit = async () => {
    if (!aluno) return;
    setIsSaving(true);
    const { error } = await supabase.from("profiles")
      .update({ nome: editForm.nome, role: editForm.role, is_active: editForm.is_active })
      .eq("id", aluno.id);
    if (!error) {
      setAluno(prev => prev ? { ...prev, ...editForm } : null);
      setEditMode(false);
      toast.success("Perfil atualizado!");
    } else {
      toast.error("Erro ao salvar: " + error.message);
    }
    setIsSaving(false);
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Visão Geral", icon: BarChart2 },
    { id: "simulados", label: "Simulados", icon: Target },
    { id: "redacoes", label: "Redações", icon: FileText },
    { id: "estudo", label: "Estudo", icon: BookOpen },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!aluno) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-500 font-bold text-lg">Aluno não encontrado.</p>
        <button onClick={() => router.back()} className="text-indigo-500 font-black flex items-center gap-2 text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
      </div>
    );
  }

  const colorIdx = (aluno.email || "a").charCodeAt(0) % colors.length;
  const initials = (aluno.nome || aluno.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 md:px-0 font-sans animate-in fade-in duration-500">

      {/* ── Botão voltar ── */}
      <button
        onClick={() => router.push("/admin/alunos")}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold text-sm mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Voltar para Gestão
      </button>

      {/* ── Hero do Aluno ── */}
      <div className="relative rounded-[2.5rem] overflow-hidden mb-8 shadow-xl">
        {/* Fundo gradiente */}
        <div className={`bg-gradient-to-br ${colors[colorIdx]} p-8 md:p-10`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-white" />
            <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar grande */}
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-black text-3xl shadow-2xl flex-shrink-0 ring-4 ring-white/30">
              {aluno.avatar_url
                ? <img src={aluno.avatar_url} alt="" className="w-full h-full object-cover rounded-3xl" />
                : initials}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-black text-white">{aluno.nome || "Sem nome"}</h1>
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${aluno.is_active !== false
                    ? "bg-teal-400/20 text-teal-100 ring-1 ring-teal-300/30"
                    : "bg-rose-400/20 text-rose-100 ring-1 ring-rose-300/30"
                  }`}>
                  {aluno.is_active !== false ? "✓ Ativo" : "✗ Bloqueado"}
                </span>
              </div>
              <p className="text-white/70 text-sm mb-1">{aluno.email}</p>
              <p className="text-white/50 text-xs">
                Membro desde {format(new Date(aluno.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>

            {/* Ações */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={openEdit}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all backdrop-blur-sm"
              >
                <PenTool className="w-3.5 h-3.5" /> Editar
              </button>
              <button
                onClick={toggleStatus}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${aluno.is_active !== false
                    ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-100"
                    : "bg-teal-500/20 hover:bg-teal-500/30 text-teal-100"
                  }`}
              >
                {aluno.is_active !== false ? <><ShieldOff className="w-3.5 h-3.5" /> Bloquear</> : <><Shield className="w-3.5 h-3.5" /> Ativar</>}
              </button>
              <button
                onClick={() => toast.info(`E-mail de recuperação enviado para ${aluno.email}`)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all backdrop-blur-sm"
              >
                <Key className="w-3.5 h-3.5" /> Resetar Senha
              </button>
            </div>
          </div>
        </div>

        {/* Barra de estatísticas resumidas */}
        {metrics && (
          <div className="bg-white dark:bg-[#1C1C1E] grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100 dark:divide-[#2C2C2E]">
            {[
              { label: "Simulados", value: metrics.totalSimulados, sub: metrics.totalSimulados ? `Méd. ${metrics.mediaAcertos}/180` : "—", icon: Target, color: "text-indigo-500" },
              { label: "Redações", value: metrics.totalRedacoes, sub: metrics.mediaRedacao ? `Méd. ${metrics.mediaRedacao} pts` : "—", icon: FileText, color: "text-rose-500" },
              { label: "Horas Estudo", value: `${Math.floor(metrics.totalMinEstudo / 60)}h ${metrics.totalMinEstudo % 60}min`, sub: `${metrics.totalSessoes} sessões`, icon: Clock, color: "text-emerald-500" },
              { label: "Tarefas", value: `${metrics.tarefasConcluidas}/${metrics.totalTarefas}`, sub: metrics.totalTarefas ? `${Math.round((metrics.tarefasConcluidas / metrics.totalTarefas) * 100)}%` : "—", icon: CheckCircle2, color: "text-amber-500" },
            ].map(s => (
              <div key={s.label} className="px-6 py-5 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
                </div>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-slate-400">{s.sub}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm overflow-hidden">
        {/* Nav tabs */}
        <div className="flex border-b border-slate-100 dark:border-[#2C2C2E] bg-slate-50/50 dark:bg-[#0A0A0A]">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-[11px] font-black uppercase tracking-wider transition-all border-b-2 ${activeTab === t.id
                  ? "text-indigo-600 dark:text-indigo-400 border-indigo-500 bg-white dark:bg-[#1C1C1E]"
                  : "text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300"
                }`}
            >
              <t.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Conteúdo das tabs */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >

              {/* ── OVERVIEW ── */}
              {activeTab === "overview" && metrics && (
                <div className="space-y-8">
                  {/* Grid métricas */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { icon: Target, label: "Simulados Realizados", val: metrics.totalSimulados, sub: `Média de ${metrics.mediaAcertos}/180 acertos`, color: "indigo" },
                      { icon: FileText, label: "Redações Enviadas", val: metrics.totalRedacoes, sub: metrics.mediaRedacao ? `Média ${metrics.mediaRedacao} pontos` : "Sem notas ainda", color: "rose" },
                      { icon: Clock, label: "Total de Estudo", val: `${Math.floor(metrics.totalMinEstudo / 60)}h ${metrics.totalMinEstudo % 60}min`, sub: `${metrics.totalSessoes} sessões registradas`, color: "emerald" },
                      { icon: CheckCircle2, label: "Tarefas Concluídas", val: `${metrics.tarefasConcluidas}/${metrics.totalTarefas}`, sub: metrics.totalTarefas ? `${Math.round((metrics.tarefasConcluidas / metrics.totalTarefas) * 100)}% de aproveitamento` : "Sem tarefas", color: "amber" },
                      { icon: Brain, label: "KevQuest Entries", val: metrics.totalKevQuest, sub: "flashcards registrados", color: "violet" },
                      { icon: Zap, label: "Engajamento Total", val: metrics.totalSessoes + metrics.totalKevQuest + metrics.totalSimulados, sub: "interações na plataforma", color: "blue" },
                    ].map(c => (
                      <div key={c.label} className={`bg-${c.color}-50 dark:bg-${c.color}-500/10 rounded-2xl p-5`}>
                        <div className="flex items-center gap-2 mb-3">
                          <c.icon className={`w-5 h-5 text-${c.color}-500`} />
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{c.label}</span>
                        </div>
                        <p className={`text-3xl font-black text-${c.color}-600 dark:text-${c.color}-400 mb-1`}>{c.val}</p>
                        <p className="text-xs text-slate-400">{c.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Info da conta */}
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Informações da Conta</h3>
                    <div className="bg-slate-50 dark:bg-[#2C2C2E]/40 rounded-2xl divide-y divide-slate-100 dark:divide-white/5">
                      {[
                        { label: "E-mail", value: aluno.email },
                        { label: "Nome completo", value: aluno.nome || "—" },
                        { label: "Perfil / Role", value: aluno.role?.toUpperCase() || "ALUNO" },
                        { label: "Nível de Acesso", value: aluno.nivel_acesso?.toUpperCase() || "BÁSICO" },
                        { label: "Status atual", value: aluno.is_active !== false ? "✓ Conta Ativa" : "✗ Bloqueada" },
                        { label: "Data de cadastro", value: format(new Date(aluno.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between items-center px-5 py-3.5">
                          <span className="text-sm text-slate-400 font-medium">{r.label}</span>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── SIMULADOS ── */}
              {activeTab === "simulados" && metrics && (
                <div className="space-y-4">
                  {metrics.totalSimulados > 0 && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {[
                        { label: "Total realizados", val: metrics.totalSimulados, color: "text-indigo-500" },
                        { label: "Média de acertos", val: `${metrics.mediaAcertos}/180`, color: "text-violet-500" },
                        { label: "Percentual médio", val: `${Math.round((metrics.mediaAcertos / 180) * 100)}%`, color: "text-blue-500" },
                      ].map(c => (
                        <div key={c.label} className="bg-slate-50 dark:bg-[#2C2C2E]/50 rounded-2xl p-4 text-center">
                          <p className={`text-2xl font-black ${c.color}`}>{c.val}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{c.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {metrics.simulados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300 dark:text-slate-700">
                      <Target className="w-16 h-16 mb-4" />
                      <p className="font-bold text-lg">Nenhum simulado registrado ainda</p>
                    </div>
                  ) : metrics.simulados.map((s: any, i: number) => {
                    const total = (s.linguagens || 0) + (s.humanas || 0) + (s.naturezas || 0) + (s.matematica || 0);
                    const pct = Math.round((total / 180) * 100);
                    return (
                      <div key={s.id} className="bg-slate-50 dark:bg-[#2C2C2E]/60 rounded-2xl p-5 border border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-black text-base text-slate-800 dark:text-white">{s.titulo_simulado || `Simulado #${i + 1}`}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{s.realizado_em ? format(new Date(s.realizado_em), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "—"}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-2xl text-indigo-500">{total}<span className="text-sm text-slate-400 font-bold">/180</span></p>
                            <p className="text-xs text-slate-400">{pct}% de acerto</p>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full mb-4">
                          <div
                            className={`h-full rounded-full transition-all ${pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-5 gap-2 text-center">
                          {[
                            { label: "Linguagens", val: s.linguagens, color: "text-indigo-500" },
                            { label: "Humanas", val: s.humanas, color: "text-amber-500" },
                            { label: "Naturezas", val: s.naturezas, color: "text-emerald-500" },
                            { label: "Matemática", val: s.matematica, color: "text-blue-500" },
                            { label: "Redação", val: s.redacao, color: "text-rose-500" },
                          ].map(a => (
                            <div key={a.label} className="bg-white dark:bg-[#1C1C1E] rounded-xl p-2">
                              <p className="text-[8px] text-slate-400 uppercase mb-1">{a.label}</p>
                              <p className={`font-black text-base ${a.color}`}>{a.val ?? "—"}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── REDAÇÕES ── */}
              {activeTab === "redacoes" && metrics && (
                <div className="space-y-4">
                  {metrics.totalRedacoes > 0 && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {[
                        { label: "Total enviadas", val: metrics.totalRedacoes, color: "text-rose-500" },
                        { label: "Nota média", val: metrics.mediaRedacao ? `${metrics.mediaRedacao} pts` : "—", color: "text-pink-500" },
                        { label: "Com avaliação", val: metrics.redacoes.filter((r: any) => r.nota_redacao).length, color: "text-red-500" },
                      ].map(c => (
                        <div key={c.label} className="bg-slate-50 dark:bg-[#2C2C2E]/50 rounded-2xl p-4 text-center">
                          <p className={`text-2xl font-black ${c.color}`}>{c.val}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{c.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {metrics.redacoes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300 dark:text-slate-700">
                      <FileText className="w-16 h-16 mb-4" />
                      <p className="font-bold text-lg">Nenhuma redação registrada ainda</p>
                    </div>
                  ) : metrics.redacoes.map((r: any) => (
                    <div key={r.id} className="bg-slate-50 dark:bg-[#2C2C2E]/60 rounded-2xl p-5 border border-slate-100 dark:border-white/5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-base text-slate-800 dark:text-white mb-1">{r.tema || "Sem tema definido"}</p>
                          <p className="text-xs text-slate-400">{r.created_at ? format(new Date(r.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "—"}</p>
                        </div>
                        {r.nota_redacao && (
                          <div className="text-right flex-shrink-0">
                            <p className="font-black text-3xl text-rose-500">{r.nota_redacao}</p>
                            <p className="text-xs text-slate-400">pontos</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${r.status === "CONCLUIDA" ? "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400" :
                            r.status === "EM CORREÇÃO" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
                              "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                          }`}>
                          {r.status || "Pendente"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── ESTUDO ── */}
              {activeTab === "estudo" && metrics && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      { label: "Sessões totais", val: metrics.totalSessoes, color: "text-emerald-500" },
                      { label: "Total de horas", val: `${Math.floor(metrics.totalMinEstudo / 60)}h ${metrics.totalMinEstudo % 60}min`, color: "text-indigo-500" },
                      { label: "Média por sessão", val: metrics.totalSessoes ? `${Math.round(metrics.totalMinEstudo / metrics.totalSessoes)} min` : "—", color: "text-amber-500" },
                    ].map(c => (
                      <div key={c.label} className="bg-slate-50 dark:bg-[#2C2C2E]/50 rounded-2xl p-4 text-center">
                        <p className={`text-2xl font-black ${c.color}`}>{c.val}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{c.label}</p>
                      </div>
                    ))}
                  </div>
                  {metrics.sessoes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300 dark:text-slate-700">
                      <BookOpen className="w-16 h-16 mb-4" />
                      <p className="font-bold text-lg">Nenhuma sessão de estudo registrada</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {metrics.sessoes.map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between bg-slate-50 dark:bg-[#2C2C2E]/60 rounded-2xl px-5 py-4 border border-slate-100 dark:border-white/5">
                          <div>
                            <p className="font-bold text-sm text-slate-700 dark:text-slate-200">{s.disciplina || "Estudo Geral"}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{s.data ? format(new Date(s.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "—"}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-lg text-emerald-500">{s.duracao_minutos || 0} <span className="text-xs font-bold text-slate-400">min</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Modal Editar ── */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setEditMode(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 border border-slate-100 dark:border-[#2C2C2E] relative"
            >
              <button onClick={() => setEditMode(false)} className="absolute top-6 right-6 w-8 h-8 bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
              <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                <PenTool className="w-5 h-5 text-indigo-500" /> Editar Perfil
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2 block">E-mail (não editável)</label>
                  <input disabled value={aluno.email} className="w-full bg-slate-100 dark:bg-black/20 text-slate-400 px-4 py-3 rounded-2xl text-sm opacity-60 cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2 block">Nome Completo</label>
                  <input value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })} className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] text-slate-800 dark:text-white font-bold px-4 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2 block">Permissão</label>
                    <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] text-slate-800 dark:text-white font-bold px-4 py-3 rounded-2xl outline-none text-sm">
                      <option value="aluno">Aluno</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2 block">Status</label>
                    <select value={editForm.is_active ? "sim" : "nao"} onChange={e => setEditForm({ ...editForm, is_active: e.target.value === "sim" })} className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] text-slate-800 dark:text-white font-bold px-4 py-3 rounded-2xl outline-none text-sm">
                      <option value="sim">Ativo</option>
                      <option value="nao">Bloqueado</option>
                    </select>
                  </div>
                </div>
              </div>
              <button onClick={saveEdit} disabled={isSaving} className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest disabled:opacity-50">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Salvar Alterações
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
