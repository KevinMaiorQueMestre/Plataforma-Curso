"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { PlayCircle, Target, ArrowLeft, Lock, Loader2, Link2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default function HubPage() {
  const router = useRouter();

  const [isLoadingAulas, setIsLoadingAulas] = useState(false);
  const [isLoadingMentoria, setIsLoadingMentoria] = useState(false);

  const handleAcessoAulas = () => {
    setIsLoadingAulas(true);
    setTimeout(() => {
      setIsLoadingAulas(false);
      router.push("/aulas");
    }, 600);
  };

  const handleAcessoMentoria = () => {
    setIsLoadingMentoria(true);
    setTimeout(() => {
      setIsLoadingMentoria(false);
      router.push("/diario"); // Redireciona para o diário do aluno logado
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] transition-colors duration-300 flex flex-col items-center justify-center p-6 relative overflow-x-hidden font-sans">
      
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-200/40 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navegação Topo */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-8 left-8 right-8 z-20 flex justify-between items-center"
      >
        <Link href="/login" className="flex items-center gap-2 text-slate-500 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Login
        </Link>
        <ThemeSwitcher />
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
          Onde vamos focar hoje?
        </h2>
        <p className="text-lg text-slate-500 dark:text-[#A1A1AA] max-w-xl mx-auto transition-colors">
          Escolha o módulo de estudos para acessar a sua mentoria.
        </p>
      </motion.div>

      {/* CARDS CONTAINER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl relative z-10 pb-16">
        
        {/* ========================================================== */}
        {/*                   CARD 1: AULAS ONLINE                     */}
        {/* ========================================================== */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full bg-white dark:bg-[#1C1C1E] rounded-[2rem] border border-slate-200 dark:border-[#2C2C2E] shadow-xl shadow-slate-200 dark:shadow-none p-8 md:p-10 relative overflow-hidden flex flex-col justify-between transition-colors duration-300"
        >
          {/* OVERLAY BLOQUEIO (Correntes + Cadeado) */}
          <div className="absolute inset-0 z-30 bg-slate-900/70 backdrop-blur-[2px] flex flex-col items-center justify-center overflow-hidden">
             {/* Efeito Correntes Integradas com Cadeado */}
             <div className="absolute w-[150%] flex items-center justify-center -gap-2 opacity-60 -rotate-12 scale-[2] pointer-events-none drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
                {[...Array(20)].map((_, i) => {
                  if (i === 10) {
                    return <Lock key={i} className="w-20 h-20 text-slate-400 min-w-20 -ml-5 z-10" strokeWidth={2.5} />
                  }
                  return <Link2 key={i} className="w-16 h-16 text-slate-400 min-w-16 -ml-4" strokeWidth={2.5} />
                })}
             </div>
             <div className="relative mt-32 bg-slate-900 border border-slate-700 text-slate-300 px-6 py-2.5 rounded-full font-black shadow-2xl uppercase tracking-widest text-sm z-10">
               Em Breve
             </div>
          </div>

          {/* Decoração superior lateral */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50 dark:from-indigo-900/30 to-transparent rounded-bl-[4rem] pointer-events-none"></div>

          {/* Cabeçalho do Card */}
          <div className="flex flex-col mb-8 flex-grow">
             <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6 shadow-inner transition-colors duration-300">
               <PlayCircle className="w-8 h-8" />
             </div>
             <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 transition-colors duration-300">Portal de Aulas</h3>
             <p className="text-slate-500 dark:text-[#A1A1AA] text-sm leading-relaxed transition-colors duration-300">
               Acesse nosso acervo de videoaulas exclusivas e a trilha principal teórica de disciplinas.
             </p>
          </div>

          <button 
            onClick={handleAcessoAulas}
            disabled={isLoadingAulas}
            className="w-full flex items-center justify-center gap-2 mt-auto bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
          >
            {isLoadingAulas ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>Acessar Portal <ArrowRight className="w-4 h-4 ml-1" /></>
            )}
          </button>
        </motion.div>


        {/* ========================================================== */}
        {/*                 CARD 2: ECOSSISTEMA / SISTEMA              */}
        {/* ========================================================== */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           transition={{ duration: 0.5, delay: 0.2 }}
           className="w-full bg-white dark:bg-[#0E172A] rounded-[2rem] border border-slate-200 dark:border-[#2C2C2E] shadow-xl shadow-slate-200 dark:shadow-none/50 dark:shadow-teal-900/20 p-8 md:p-10 relative overflow-hidden flex flex-col justify-between transition-colors duration-300"
        >
          {/* Decoração superior lateral */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-50 dark:from-teal-900/40 to-transparent rounded-bl-[4rem] pointer-events-none"></div>

          {/* Cabeçalho do Card */}
          <div className="flex flex-col mb-8 flex-grow">
             <div className="w-16 h-16 bg-teal-50 dark:bg-slate-800 border-none dark:border-solid border border-slate-700 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center mb-6 shadow-inner transition-colors duration-300">
               <Target className="w-8 h-8" />
             </div>
             <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 transition-colors duration-300">Ecossistema Plataforma</h3>
             <p className="text-slate-500 dark:text-[#A1A1AA] text-sm leading-relaxed transition-colors duration-300">
               Diário de exercícios, simulados via KevQuest e painéis potentes de desempenho.
             </p>
          </div>

          <button 
            onClick={handleAcessoMentoria}
            disabled={isLoadingMentoria}
            className="w-full flex items-center justify-center gap-2 mt-auto bg-teal-600 hover:bg-teal-700 dark:bg-gradient-to-r dark:from-teal-500 dark:to-teal-400 dark:hover:from-teal-400 dark:hover:to-teal-300 text-white dark:text-slate-900 py-4 rounded-xl font-bold shadow-lg shadow-teal-500/20 dark:shadow-teal-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
          >
            {isLoadingMentoria ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>Acessar Mentoria <ArrowRight className="w-4 h-4 ml-1" /></>
            )}
          </button>
        </motion.div>
        
      </div>
    </div>
  );
}
