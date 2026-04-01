"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
        className="text-center mb-10 mt-16 md:mt-0 relative z-10"
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
          Bem-vindo de volta
        </h2>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">
          Faça login para acessar suas trilhas, simulados e o diário de estudos.
        </p>
      </motion.div>

      {/* LOGIN CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-8 md:p-10 relative overflow-hidden z-10"
      >
        {/* Decoração superior lateral */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-50 to-transparent rounded-bl-[4rem] pointer-events-none"></div>

        {/* Cabeçalho do Card */}
        <div className="flex flex-col mb-8 items-center text-center">
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">Acesso do Aluno</h3>
            <p className="text-slate-500 text-sm">Insira suas credenciais abaixo</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-5">
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
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all font-medium text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Senha</label>
              <a href="#" className="text-[11px] font-semibold text-teal-600 hover:text-teal-700">Esqueceu?</a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all font-medium text-sm"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 mt-4 bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Entrar na Plataforma"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
