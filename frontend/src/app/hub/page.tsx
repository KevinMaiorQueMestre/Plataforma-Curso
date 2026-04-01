"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { PlayCircle, Target, ArrowLeft, Lock, Loader2, Link2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HubPage() {
  const router = useRouter();

  const [isLoadingAulas, setIsLoadingAulas] = useState(false);
  const [isLoadingSistema, setIsLoadingSistema] = useState(false);

  const handleAcessoAulas = () => {
    setIsLoadingAulas(true);
    setTimeout(() => {
      setIsLoadingAulas(false);
      router.push("/aulas");
    }, 600);
  };

  const handleAcessoSistema = () => {
    setIsLoadingSistema(true);
    setTimeout(() => {
      setIsLoadingSistema(false);
      router.push("/diario"); // Redireciona para o diário do aluno logado
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-x-hidden font-sans">
      
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-200/40 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Voltar para Home / Login */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-8 left-8 z-20"
      >
        <Link href="/login" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Login
        </Link>
      </motion.div>

      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12 mt-16 md:mt-0 relative z-10"
      >
        <div className="flex flex-col items-center cursor-default mb-6">
          <h1 className="text-3xl font-serif text-teal-700 tracking-widest leading-none font-bold">
            SINAPSE
          </h1>
          <p className="text-[10px] uppercase font-bold text-teal-500 tracking-[0.3em] mt-1">
            Mentoria
          </p>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight font-serif mb-4">
          Onde vamos focar hoje?
        </h2>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">
          Escolha o módulo de estudos para acessar o seu progresso.
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
          className="w-full bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-8 md:p-10 relative overflow-hidden flex flex-col justify-between"
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
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-[4rem] pointer-events-none"></div>

          {/* Cabeçalho do Card */}
          <div className="flex flex-col mb-8 flex-grow">
             <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
               <PlayCircle className="w-8 h-8" />
             </div>
             <h3 className="text-2xl font-bold text-slate-800 mb-2">Portal de Aulas</h3>
             <p className="text-slate-500 text-sm leading-relaxed">
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
           className="w-full bg-[#0E172A] rounded-[2rem] border border-slate-800 shadow-xl shadow-teal-900/20 p-8 md:p-10 relative overflow-hidden flex flex-col justify-between"
        >
          {/* Decoração superior lateral */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-900/40 to-transparent rounded-bl-[4rem] pointer-events-none"></div>

          {/* Cabeçalho do Card */}
          <div className="flex flex-col mb-8 flex-grow">
             <div className="w-16 h-16 bg-slate-800 border border-slate-700 text-teal-400 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
               <Target className="w-8 h-8" />
             </div>
             <h3 className="text-2xl font-bold text-white mb-2">Ecossistema Sinapse</h3>
             <p className="text-slate-400 text-sm leading-relaxed">
               Diário de exercícios, simulados via KevQuest e painéis potentes de desempenho.
             </p>
          </div>

          <button 
            onClick={handleAcessoSistema}
            disabled={isLoadingSistema}
            className="w-full flex items-center justify-center gap-2 mt-auto bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-slate-900 py-4 rounded-xl font-bold shadow-lg shadow-teal-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
          >
            {isLoadingSistema ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>Acessar Sistema <ArrowRight className="w-4 h-4 ml-1" /></>
            )}
          </button>
        </motion.div>
        
      </div>
    </div>
  );
}
