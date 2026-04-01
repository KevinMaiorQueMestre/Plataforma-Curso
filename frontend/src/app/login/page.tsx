"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { PlayCircle, Target, ArrowLeft, Mail, Lock, Loader2, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  // Estados independentes para não travar os dois modais ao mesmo tempo
  const [isLoadingAulas, setIsLoadingAulas] = useState(false);
  const [isLoadingSistema, setIsLoadingSistema] = useState(false);

  const handleLoginAulas = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAulas(true);
    // Simula autenticação do portal externo/aulas
    setTimeout(() => {
      setIsLoadingAulas(false);
      router.push("/aulas");
    }, 1200);
  };

  const handleLoginSistema = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingSistema(true);
    // Simula autenticação do sistema central (diário, kevquest, etc)
    setTimeout(() => {
      setIsLoadingSistema(false);
      router.push("/diario");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-x-hidden font-sans">
      
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-200/40 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Voltar para Home */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-8 left-8 z-20"
      >
        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Home
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
          Acesse os Portais
        </h2>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">
          Faça login diretamente no módulo que você deseja focar neste momento.
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
          className="w-full bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-8 md:p-10 relative overflow-hidden"
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
          <div className="flex flex-col mb-8">
             <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
               <PlayCircle className="w-8 h-8" />
             </div>
             <h3 className="text-2xl font-bold text-slate-800 mb-2">Portal de Aulas</h3>
             <p className="text-slate-500 text-sm leading-relaxed">
               Acesse nosso acervo de videoaulas exclusivas e a trilha principal teórica de disciplinas.
             </p>
          </div>

          {/* Formulário Card 1 */}
          <form onSubmit={handleLoginAulas} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 ml-1 uppercase tracking-wider">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input 
                  type="email" 
                  required
                  placeholder="aluno@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Senha</label>
                <a href="#" className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700">Esqueceu?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-sm"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoadingAulas}
              className="w-full flex items-center justify-center gap-2 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
            >
              {isLoadingAulas ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Entrar nas Aulas"
              )}
            </button>
          </form>
        </motion.div>


        {/* ========================================================== */}
        {/*                 CARD 2: ECOSSISTEMA / SISTEMA              */}
        {/* ========================================================== */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           transition={{ duration: 0.5, delay: 0.2 }}
           className="w-full bg-[#0E172A] rounded-[2rem] border border-slate-800 shadow-xl shadow-teal-900/20 p-8 md:p-10 relative overflow-hidden"
        >
          {/* Decoração superior lateral */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-900/40 to-transparent rounded-bl-[4rem] pointer-events-none"></div>

          {/* Cabeçalho do Card */}
          <div className="flex flex-col mb-8">
             <div className="w-16 h-16 bg-slate-800 border border-slate-700 text-teal-400 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
               <Target className="w-8 h-8" />
             </div>
             <h3 className="text-2xl font-bold text-white mb-2">Ecossistema Sinapse</h3>
             <p className="text-slate-400 text-sm leading-relaxed">
               Diário de exercícios, simulados via KevQuest e painéis potentes de desempenho.
             </p>
          </div>

          {/* Formulário Card 2 */}
          <form onSubmit={handleLoginSistema} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-wider">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input 
                  type="email" 
                  required
                  placeholder="aluno@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all font-medium text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Senha</label>
                <a href="#" className="text-[11px] font-semibold text-teal-400 hover:text-teal-300">Esqueceu?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all font-medium text-sm"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoadingSistema}
              className="w-full flex items-center justify-center gap-2 mt-2 bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-slate-900 py-3.5 rounded-xl font-bold shadow-lg shadow-teal-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
            >
              {isLoadingSistema ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Entrar no Sistema"
              )}
            </button>
          </form>
        </motion.div>
        
      </div>
    </div>
  );
}
