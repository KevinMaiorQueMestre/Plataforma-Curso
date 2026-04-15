"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { BrainCircuit, Loader2, Lock, Mail, ArrowRight, Stethoscope, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Erro no login", { description: error.message });
        setIsLoading(false);
        return;
      }

      // Segurança: Previne que administradores entrem pela interface comum de alunos (o que corromperia o painel)
      if (data?.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        if (profile?.role === 'admin') {
          await supabase.auth.signOut();
          toast.error("Acesso Inválido", { description: "Temos um painel próprio para você! Acesse /admin-login", duration: 5000 });
          setIsLoading(false);
          return;
        }
      }

      toast.success("Login realizado com sucesso!");
      // Redirecionamento via window.location garante que o middleware revalida a sessão
      window.location.href = "/hub"; 

    } catch (err: any) {
      toast.error("Erro inesperado", { description: err.message });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4 selection:bg-teal-200 selection:text-teal-900 dark:selection:bg-teal-800 dark:selection:text-teal-100 transition-colors duration-300">
      
      <div className="absolute top-6 right-6">
        <ThemeSwitcher />
      </div>

      {/* Botão Voltar */}
      <Link
        href="/"
        className="absolute top-6 left-6 group flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-full shadow-sm hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-md transition-all active:scale-95"
      >
        <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-teal-500 transition-colors" />
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors uppercase tracking-wider">Voltar</span>
      </Link>

      {/* Botão discreto de acesso admin - estetoscópio */}
      <Link
        href="/admin-login"
        title="Acesso Administrativo"
        className="absolute bottom-6 left-6 group w-9 h-9 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-xl flex items-center justify-center shadow-sm hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all active:scale-95"
      >
        <Stethoscope className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
      </Link>

      <div className="w-full max-w-md">
        {/* Logo Title */}
        <div className="flex flex-col items-center justify-center mb-10 text-center">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-slate-900/20 transform -rotate-3 border border-slate-700">
            <BrainCircuit className="w-8 h-8 text-teal-400" />
          </div>
          <h1 className="text-3xl font-serif font-black text-slate-800 dark:text-slate-100 tracking-wide mb-2">
            PORTAL DO <span className="text-teal-600 dark:text-teal-400">ALUNO</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-[#A1A1AA]">
            MetAuto All-in-one - Área do Estudante
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white dark:bg-[#121212] p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-[#2C2C2E] relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-bl-full pointer-events-none"></div>

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div className="space-y-4">
              {/* E-mail */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#A1A1AA] ml-1">E-mail de Acesso</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#1C1C1E] border-2 border-slate-200 dark:border-[#2C2C2E] rounded-xl text-sm focus:ring-0 focus:border-teal-500 dark:focus:border-teal-400 transition-colors dark:text-white"
                    placeholder="aluno@plataforma.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#A1A1AA]">Sua Senha</label>
                  <a href="#" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300">Esqueci a senha</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#1C1C1E] border-2 border-slate-200 dark:border-[#2C2C2E] rounded-xl text-sm focus:ring-0 focus:border-teal-500 dark:focus:border-teal-400 transition-colors dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-70 dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-slate-900 text-white font-bold py-3.5 px-4 rounded-xl shadow-xl shadow-slate-900/10 dark:shadow-[0_0_20px_rgba(20,184,166,0.2)] transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            
            <p className="text-center text-xs text-slate-500 dark:text-[#A1A1AA] pt-2">
              Problemas com acesso? <a href="#" className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">Fale com o suporte</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
