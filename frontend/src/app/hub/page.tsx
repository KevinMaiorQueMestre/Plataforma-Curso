"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { PlayCircle, Target, ArrowLeft, Lock, Loader2, Link2, ArrowRight, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type PresenceUser = {
  user_id: string;
  nome: string;
  avatar_url?: string | null;
  online_at: string;
};

export default function HubPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isLoadingAulas,    setIsLoadingAulas]    = useState(false);
  const [isLoadingMentoria, setIsLoadingMentoria] = useState(false);
  const [isLoggingOut,      setIsLoggingOut]      = useState(false);
  const [onlineUsers,       setOnlineUsers]       = useState<PresenceUser[]>([]);
  const [currentUser,       setCurrentUser]       = useState<{ id: string; nome: string; avatar_url?: string | null } | null>(null);

  // ──────────────────────────────────────────────────────────
  // Carrega perfil do aluno logado e inicializa Presence
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    let channel: RealtimeChannel | null = null;

    async function setup() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      // Busca nome e avatar do profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("nome, avatar_url")
        .eq("id", user.id)
        .single();

      if (!mounted) return;

      const me: PresenceUser = {
        user_id: user.id,
        nome: profile?.nome ?? user.email?.split("@")[0] ?? "Aluno",
        avatar_url: profile?.avatar_url ?? null,
        online_at: new Date().toISOString(),
      };

      setCurrentUser({ id: user.id, nome: me.nome, avatar_url: me.avatar_url });

      // Cria o canal de presença (Supabase Realtime)
      channel = supabase.channel("hub_presence", {
        config: { presence: { key: user.id } },
      });

      channel
        .on("presence", { event: "sync" }, () => {
          if (!mounted || !channel) return;
          const state = channel.presenceState<PresenceUser>();
          const users = (Object.values(state).flat() as unknown) as PresenceUser[];
          setOnlineUsers(users);
        })
        .on("presence", { event: "join" }, ({ newPresences }) => {
          if (!mounted) return;
          setOnlineUsers((prev) => {
            const ids = new Set(prev.map((u) => u.user_id));
            const novos = ((newPresences as unknown) as PresenceUser[]).filter((u) => !ids.has(u.user_id));
            return [...prev, ...novos];
          });
        })
        .on("presence", { event: "leave" }, ({ leftPresences }) => {
          if (!mounted) return;
          const leftIds = new Set(((leftPresences as unknown) as PresenceUser[]).map((u) => u.user_id));
          setOnlineUsers((prev) => prev.filter((u) => !leftIds.has(u.user_id)));
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED" && mounted && channel) {
            await channel.track(me);
          }
        });
    }

    setup();

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleAcessoMentoria = () => {
    setIsLoadingMentoria(true);
    setTimeout(() => {
      setIsLoadingMentoria(false);
      router.push("/home");
    }, 600);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Usuários online sem contar o próprio aluno
  const othersOnline = onlineUsers.filter((u) => u.user_id !== currentUser?.id);
  const totalOnline  = onlineUsers.length; // inclui o próprio

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] transition-colors duration-300 flex flex-col items-center justify-center p-6 relative overflow-x-hidden font-sans">

      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-200/40 rounded-full blur-[120px] pointer-events-none" />

      {/* Navegação Topo */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-8 left-8 right-8 z-20 flex justify-between items-center"
      >
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-2 text-slate-500 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white transition-colors font-medium cursor-pointer"
        >
          {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeft className="w-4 h-4" />}
          Sair para Login
        </button>
        <div className="flex items-center gap-4">
          {/* Badge de alunos online */}
          {totalOnline > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-full px-3 py-1.5 shadow-sm"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {totalOnline} {totalOnline === 1 ? "online" : "online"}
              </span>
            </motion.div>
          )}
          <ThemeSwitcher />
        </div>
      </motion.div>

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12 mt-16 md:mt-0 relative z-10"
      >
        <Link href="/" className="flex flex-col items-center cursor-pointer mb-6 hover:opacity-80 transition-opacity">
          <h1 className="text-3xl font-serif text-teal-700 dark:text-teal-400 tracking-widest leading-none font-bold transition-colors">
            PLATAFORMA
          </h1>
          <p className="text-[10px] uppercase font-bold text-teal-500 tracking-[0.3em] mt-1">
            Mentoria
          </p>
        </Link>
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-serif mb-4 transition-colors">
          {currentUser ? `Olá, ${currentUser.nome.split(" ")[0]}!` : "Onde vamos focar hoje?"}
        </h2>
        <p className="text-lg text-slate-500 dark:text-[#A1A1AA] max-w-xl mx-auto transition-colors">
          Escolha o módulo de estudos para acessar a sua mentoria.
        </p>

        {/* Avatares de outros alunos online */}
        {othersOnline.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-2 mt-4"
          >
            <div className="flex -space-x-2">
              {othersOnline.slice(0, 5).map((u) => (
                <div
                  key={u.user_id}
                  title={u.nome}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-teal-400 border-2 border-white dark:border-[#0a0a0a] flex items-center justify-center text-white text-xs font-bold shadow-sm overflow-hidden"
                >
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={u.nome} className="w-full h-full object-cover" />
                  ) : (
                    u.nome.charAt(0).toUpperCase()
                  )}
                </div>
              ))}
              {othersOnline.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#2C2C2E] border-2 border-white dark:border-[#0a0a0a] flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                  +{othersOnline.length - 5}
                </div>
              )}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {othersOnline.length === 1
                ? `${othersOnline[0].nome.split(" ")[0]} também está estudando agora`
                : `${othersOnline.length} colegas estudando agora`}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* CARDS CONTAINER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl relative z-10 pb-16">

        {/* CARD 1: AULAS ONLINE (Em Breve) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full bg-white dark:bg-[#1C1C1E] rounded-[2rem] border border-slate-200 dark:border-[#2C2C2E] shadow-xl shadow-slate-200 dark:shadow-none p-8 md:p-10 relative overflow-hidden flex flex-col justify-between transition-colors duration-300"
        >
          {/* OVERLAY BLOQUEIO */}
          <div className="absolute inset-0 z-30 bg-slate-900/70 backdrop-blur-[2px] flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute w-[150%] flex items-center justify-center -gap-2 opacity-60 -rotate-12 scale-[2] pointer-events-none drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
              {[...Array(20)].map((_, i) => {
                if (i === 10) return <Lock key={i} className="w-20 h-20 text-slate-400 min-w-20 -ml-5 z-10" strokeWidth={2.5} />;
                return <Link2 key={i} className="w-16 h-16 text-slate-400 min-w-16 -ml-4" strokeWidth={2.5} />;
              })}
            </div>
            <div className="relative mt-32 bg-slate-900 border border-slate-700 text-slate-300 px-6 py-2.5 rounded-full font-black shadow-2xl uppercase tracking-widest text-sm z-10">
              Em Breve
            </div>
          </div>

          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50 dark:from-indigo-900/30 to-transparent rounded-bl-[4rem] pointer-events-none" />

          <div className="flex flex-col mb-8 flex-grow">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <PlayCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Portal de Aulas</h3>
            <p className="text-slate-500 dark:text-[#A1A1AA] text-sm leading-relaxed">
              Acesse nosso acervo de videoaulas exclusivas e a trilha principal teórica de disciplinas.
            </p>
          </div>

          <button
            onClick={() => setIsLoadingAulas(true)}
            disabled={isLoadingAulas}
            className="w-full flex items-center justify-center gap-2 mt-auto bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
          >
            {isLoadingAulas ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Acessar Portal <ArrowRight className="w-4 h-4 ml-1" /></>}
          </button>
        </motion.div>

        {/* CARD 2: ECOSSISTEMA / SISTEMA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full bg-white dark:bg-[#0E172A] rounded-[2rem] border border-slate-200 dark:border-[#2C2C2E] shadow-xl shadow-slate-200 dark:shadow-none/50 dark:shadow-teal-900/20 p-8 md:p-10 relative overflow-hidden flex flex-col justify-between transition-colors duration-300"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-50 dark:from-teal-900/40 to-transparent rounded-bl-[4rem] pointer-events-none" />

          <div className="flex flex-col mb-8 flex-grow">
            <div className="w-16 h-16 bg-teal-50 dark:bg-slate-800 border-none dark:border-solid border border-slate-700 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <Target className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Ecossistema Plataforma</h3>
            <p className="text-slate-500 dark:text-[#A1A1AA] text-sm leading-relaxed">
              Diário de exercícios, simulados via KevQuest e painéis potentes de desempenho.
            </p>
          </div>

          <button
            onClick={handleAcessoMentoria}
            disabled={isLoadingMentoria}
            className="w-full flex items-center justify-center gap-2 mt-auto bg-teal-600 hover:bg-teal-700 dark:bg-gradient-to-r dark:from-teal-500 dark:to-teal-400 dark:hover:from-teal-400 dark:hover:to-teal-300 text-white dark:text-slate-900 py-4 rounded-xl font-bold shadow-lg shadow-teal-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
          >
            {isLoadingMentoria ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Acessar Mentoria <ArrowRight className="w-4 h-4 ml-1" /></>}
          </button>
        </motion.div>

      </div>
    </div>
  );
}
