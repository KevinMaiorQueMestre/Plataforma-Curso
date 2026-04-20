"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format, addDays, startOfWeek, addWeeks, subWeeks, isToday, isPast, isFuture, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2,
  RefreshCw, BookOpen, Loader2, RotateCcw, Clock, AlertTriangle, Globe
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// --- Types ---
type Revisao = {
  id: string;
  titulo: string;
  agendado_para: string;
  numero_revisao: number;
  disciplina_nome: string | null;
  origem: string;
  status: string;
};

type AdminEvent = {
  id: string;
  title: string;
  dateIso: string;
  description?: string;
};

const TODAY = new Date();
const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const REVISAO_COLORS: Record<number, { bg: string; text: string; badge: string }> = {
  1: { bg: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700/40", text: "text-violet-800 dark:text-violet-300", badge: "bg-violet-600 text-white" },
  2: { bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/40",     text: "text-blue-800 dark:text-blue-300",     badge: "bg-blue-600 text-white"     },
  3: { bg: "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700/40",     text: "text-teal-800 dark:text-teal-300",     badge: "bg-teal-600 text-white"     },
  4: { bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/40", text: "text-emerald-800 dark:text-emerald-300", badge: "bg-emerald-600 text-white" },
};
function getRevisaoCor(n: number) {
  return REVISAO_COLORS[n] ?? REVISAO_COLORS[4];
}

export default function CentralRevisoesPage() {
  const supabase = createClient();
  const [revisoes, setRevisoes] = useState<Revisao[]>([]);
  const [adminEvents, setAdminEvents] = useState<AdminEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [weekRef, setWeekRef] = useState(new Date());
  const [concluding, setConcluding] = useState<string | null>(null);

  const semana = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(weekRef, { weekStartsOn: 1 }), i)
  );

  const fetchRevisoes = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("problemas_estudo")
      .select("id, titulo, agendado_para, numero_revisao, disciplina_nome, origem, status")
      .eq("user_id", user.id)
      .not("numero_revisao", "is", null)
      .order("agendado_para", { ascending: true });

    if (data) setRevisoes(data as Revisao[]);

    const { data: aDb } = await supabase
      .from("calendario_eventos")
      .select("*")
      .eq("tipo", "aviso_admin")
      .eq("is_published", true);
    if (aDb) setAdminEvents(aDb.map(e => ({ id: e.id, title: "👑 " + e.titulo, dateIso: e.date_iso, description: e.descricao })));

    setIsLoaded(true);
  }, []);

  useEffect(() => { fetchRevisoes(); }, []);

  const handleConcluir = async (revisao: Revisao) => {
    setConcluding(revisao.id);
    const { error } = await supabase
      .from("problemas_estudo")
      .update({ status: "concluido", concluido_at: new Date().toISOString() })
      .eq("id", revisao.id);

    if (error) {
      toast.error("Erro ao concluir revisão.");
    } else {
      toast.success(`${revisao.titulo} concluída! ✅`);
      setRevisoes(prev => prev.map(r => r.id === revisao.id ? { ...r, status: "concluido" } : r));
    }
    setConcluding(null);
  };

  // Stats gerais
  const pendentes = revisoes.filter(r => r.status === "pendente");
  const vencidas   = pendentes.filter(r => isPast(parseISO(r.agendado_para + "T23:59:59")));
  const hoje       = pendentes.filter(r => r.agendado_para === format(TODAY, "yyyy-MM-dd"));
  const concluidas = revisoes.filter(r => r.status === "concluido").length;

  if (!isLoaded) return (
    <div className="h-[80vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto pb-20 px-4 md:px-0">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <div className="bg-violet-600 p-3 rounded-[1.2rem] shadow-lg shadow-violet-600/20">
              <RotateCcw className="w-7 h-7 text-white" />
            </div>
            Central de Revisões
          </h1>
          <p className="text-slate-400 mt-2 font-medium text-sm">Revisões agendadas automaticamente ao concluir atividades</p>
        </div>

        {/* Stats rápidos */}
        <div className="flex gap-3 flex-wrap">
          {[
            { label: "Atrasadas", value: vencidas.length, color: "text-rose-500",    bg: "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20" },
            { label: "Hoje",      value: hoje.length,     color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20" },
            { label: "Pendentes", value: pendentes.length, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/20" },
            { label: "Feitas",    value: concluidas,       color: "text-emerald-500",bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20" },
          ].map(s => (
            <div key={s.label} className={`border rounded-2xl px-4 py-3 text-center min-w-[72px] ${s.bg}`}>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </header>

      {/* NAVEGAÇÃO SEMANAL */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm overflow-hidden">

        {/* Barra de nav */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#2C2C2E]">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#2C2C2E] rounded-xl p-1">
            <button onClick={() => setWeekRef(w => subWeeks(w, 1))} className="p-2 hover:bg-white dark:hover:bg-[#3A3A3C] rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2 capitalize">
              {format(semana[0], "d MMM", { locale: ptBR })} – {format(semana[6], "d MMM yyyy", { locale: ptBR })}
            </span>
            <button onClick={() => setWeekRef(w => addWeeks(w, 1))} className="p-2 hover:bg-white dark:hover:bg-[#3A3A3C] rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <button
            onClick={() => setWeekRef(new Date())}
            className="px-4 py-2 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-bold rounded-xl border border-violet-100 dark:border-violet-900/40 hover:bg-violet-100 transition-colors flex items-center gap-1.5"
          >
            <CalendarIcon className="w-3.5 h-3.5" /> Hoje
          </button>
        </div>

        {/* Grid de 7 dias */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-[#2C2C2E] bg-slate-50/50 dark:bg-[#1C1C1E]">
          {semana.map((dia, i) => {
            const isTd = isToday(dia);
            return (
              <div key={i} className={`text-center py-3 px-1 border-r border-slate-100 dark:border-[#2C2C2E] last:border-r-0 ${isTd ? "bg-violet-50 dark:bg-violet-900/20" : ""}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isTd ? "text-violet-500" : "text-slate-400"}`}>{DIAS_SEMANA[i]}</p>
                <div className={`w-8 h-8 mx-auto mt-1 flex items-center justify-center rounded-full text-sm font-black ${isTd ? "bg-violet-600 text-white shadow-md" : "text-slate-700 dark:text-slate-300"}`}>
                  {format(dia, "d")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Eventos por dia */}
        <div className="grid grid-cols-7 min-h-[260px]">
          {semana.map((dia, i) => {
            const dateStr = format(dia, "yyyy-MM-dd");
            const isTd = isToday(dia);
            const dayRevisoes = revisoes.filter(r => r.agendado_para === dateStr);
            const dayAdmin = adminEvents.filter(e => e.dateIso === dateStr);

            return (
              <div key={i} className={`border-r border-slate-100 dark:border-[#2C2C2E] last:border-r-0 p-2 space-y-1.5 ${isTd ? "bg-violet-50/30 dark:bg-violet-900/10" : ""}`}>
                <AnimatePresence>
                  {/* Admin eventos */}
                  {dayAdmin.map(evt => (
                    <motion.div key={evt.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl p-2 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/40">
                      <p className="text-[10px] font-black text-purple-700 dark:text-purple-300 leading-tight flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5 flex-shrink-0" /> {evt.title}
                      </p>
                    </motion.div>
                  ))}

                  {/* Revisões */}
                  {dayRevisoes.map(rev => {
                    const cor = getRevisaoCor(rev.numero_revisao);
                    const done = rev.status === "concluido";
                    const isLoading = concluding === rev.id;
                    const atrasada = !done && isPast(parseISO(rev.agendado_para + "T23:59:59"));

                    return (
                      <motion.div key={rev.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className={`rounded-xl border p-2 transition-all ${done ? "opacity-50" : ""} ${atrasada ? "border-rose-300 dark:border-rose-700/60 bg-rose-50 dark:bg-rose-900/20" : cor.bg}`}>
                        <div className="flex items-start gap-1.5">
                          {/* Badge R1/R2... */}
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0 ${atrasada ? "bg-rose-500 text-white" : cor.badge}`}>
                            R{rev.numero_revisao}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-black leading-tight truncate ${atrasada ? "text-rose-700 dark:text-rose-300" : cor.text} ${done ? "line-through" : ""}`}>
                              {/* Remove o prefixo "R1: " do título para não repetir */}
                              {rev.titulo.replace(/^R\d+:\s*/, "")}
                            </p>
                            {rev.disciplina_nome && (
                              <p className="text-[9px] text-slate-400 truncate mt-0.5">{rev.disciplina_nome}</p>
                            )}
                          </div>
                        </div>

                        {!done && (
                          <button
                            onClick={() => handleConcluir(rev)}
                            disabled={!!concluding}
                            className="mt-1.5 w-full flex items-center justify-center gap-1 py-1 rounded-lg bg-white/60 dark:bg-black/20 hover:bg-white dark:hover:bg-white/10 transition-colors text-[9px] font-black text-slate-600 dark:text-slate-300"
                          >
                            {isLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
                            Feita
                          </button>
                        )}
                        {done && (
                          <div className="mt-1 flex items-center justify-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Concluída
                          </div>
                        )}
                      </motion.div>
                    );
                  })}

                  {dayRevisoes.length === 0 && dayAdmin.length === 0 && (
                    <div className="flex items-center justify-center h-20 opacity-20">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 rotate-90">Livre</span>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO: Atrasadas */}
      {vencidas.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/40 rounded-[2rem] p-6">
          <h2 className="text-sm font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4" /> Revisões Atrasadas ({vencidas.length})
          </h2>
          <div className="space-y-2">
            {vencidas.map(rev => {
              const diasAtraso = differenceInDays(TODAY, parseISO(rev.agendado_para));
              const isLoading = concluding === rev.id;
              return (
                <div key={rev.id} className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 border border-rose-100 dark:border-rose-700/30 flex items-center gap-4">
                  <span className="text-[10px] font-black px-2 py-1 rounded-xl bg-rose-500 text-white flex-shrink-0">R{rev.numero_revisao}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 dark:text-white text-sm truncate">{rev.titulo.replace(/^R\d+:\s*/, "")}</p>
                    <p className="text-[11px] text-rose-500 font-bold">{rev.disciplina_nome} · {diasAtraso}d de atraso</p>
                  </div>
                  <button
                    onClick={() => handleConcluir(rev)}
                    disabled={!!concluding}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-xl flex items-center gap-1.5 flex-shrink-0 transition-colors"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Feita
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CARD INFO */}
      <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/20 dark:to-violet-900/10 border border-violet-100 dark:border-violet-900/40 rounded-[2rem] p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
          <RefreshCw className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h3 className="font-black text-violet-900 dark:text-violet-300 text-sm mb-1">Como funciona</h3>
          <p className="text-xs text-violet-700 dark:text-violet-400/80 leading-relaxed">
            Ao concluir uma atividade na aba <strong>Estudo → Atividades</strong>, você define as datas de revisão (R1, R2, R3...).
            Elas aparecem aqui automaticamente, organizadas por dia. Marque como <strong>Feita</strong> para registrar a conclusão.
          </p>
        </div>
      </div>

    </div>
  );
}
