"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Lock, Loader2, Sparkles, Stethoscope, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simula autenticação unificada
    setTimeout(() => {
      setIsLoading(false);
      router.push("/hub"); // Redireciona para o hub de seleção
    }, 1200);
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
        <Link href="/" className="flex items-center gap-2 text-slate-500 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Home
        </Link>
        <ThemeSwitcher />
      </motion.div>

      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10 mt-16 md:mt-0 relative z-10"
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
          Bem-vindo de volta
        </h2>
        <p className="text-lg text-slate-500 dark:text-[#A1A1AA] max-w-xl mx-auto transition-colors">
          Faça login para acessar suas trilhas, simulados e o diário de estudos.
        </p>
      </motion.div>

      {/* LOGIN CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-[2rem] border border-slate-200 dark:border-[#2C2C2E] shadow-xl shadow-slate-200/50 dark:shadow-none p-8 md:p-10 relative overflow-hidden z-10 transition-colors duration-300"
      >
        {/* Toggle Admin Botão (Flutuante no canto superior) */}
        <button
          type="button"
          onClick={() => setIsAdminMode(!isAdminMode)}
          className="absolute top-6 left-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors tooltip group z-20"
          title={isAdminMode ? "Mudar para acesso do aluno" : "Mudar para acesso do administrador"}
        >
          {isAdminMode ? (
             <GraduationCap className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors" />
          ) : (
             <Stethoscope className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-teal-500 transition-colors" />
          )}
        </button>

        {/* Decoração superior lateral animada */}
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl to-transparent rounded-bl-[4rem] pointer-events-none transition-colors duration-500 ${isAdminMode ? 'from-indigo-50 dark:from-indigo-900/30' : 'from-teal-50 dark:from-teal-900/30'}`}></div>

        {/* Cabeçalho do Card */}
        <div className="flex flex-col mb-8 items-center text-center mt-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={isAdminMode ? "admin-icon" : "aluno-icon"}
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                transition={{ duration: 0.2 }}
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner transition-colors duration-300 ${isAdminMode ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'}`}
              >
                {isAdminMode ? <Stethoscope className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={isAdminMode ? "admin-text" : "aluno-text"}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1 transition-colors duration-300">
                  {isAdminMode ? "Acesso do Administrador" : "Acesso do Aluno"}
                </h3>
                <p className="text-slate-500 dark:text-[#A1A1AA] text-sm transition-colors duration-300">Insira suas credenciais abaixo</p>
              </motion.div>
            </AnimatePresence>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider transition-colors duration-300">E-mail</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="email" 
                required
                placeholder={isAdminMode ? "admin@plataforma.com" : "aluno@email.com"}
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-[#A1A1AA] focus:outline-none focus:ring-2 transition-all font-medium text-sm ${isAdminMode ? 'focus:ring-indigo-500/50 focus:border-indigo-500' : 'focus:ring-teal-500/50 focus:border-teal-500'}`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider transition-colors duration-300">Senha</label>
              <a href="#" className={`text-[11px] font-semibold transition-colors duration-300 ${isAdminMode ? 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300' : 'text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300'}`}>Esqueceu?</a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-[#A1A1AA] focus:outline-none focus:ring-2 transition-all font-medium text-sm ${isAdminMode ? 'focus:ring-indigo-500/50 focus:border-indigo-500' : 'focus:ring-teal-500/50 focus:border-teal-500'}`}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 mt-4 text-white dark:text-slate-900 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none shadow-lg ${
              isAdminMode 
                ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-indigo-500 dark:to-indigo-400 dark:hover:from-indigo-400 dark:hover:to-indigo-300 shadow-indigo-600/20 dark:shadow-indigo-500/20' 
                : 'bg-teal-600 hover:bg-teal-700 dark:bg-gradient-to-r dark:from-teal-500 dark:to-teal-400 dark:hover:from-teal-400 dark:hover:to-teal-300 shadow-teal-600/20 dark:shadow-teal-500/20'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              isAdminMode ? "Autenticar Admin" : "Entrar na Plataforma"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
