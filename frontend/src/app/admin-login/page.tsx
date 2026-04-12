"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { BrainCircuit, Loader2, Lock, Mail, ArrowRight } from "lucide-react";
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

      // Segurança: Previne que alunos entrem pelo portal administrativo
      if (data?.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        // Se a role não existir ainda ou não for admin
        if (!profile || profile.role !== 'admin') {
          await supabase.auth.signOut();
          toast.error("Acesso Restrito", { description: "Esta área é apenas para a diretoria. Use o /login comum", duration: 5000 });
          setIsLoading(false);
          return;
        }
      }

      toast.success("Login realizado com sucesso!");
      // Redirecionamento via window.location garante que o middleware revalida a sessão
      window.location.href = "/admin"; 

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

      <div className="w-full max-w-md">
        {/* Logo Title */}
        <div className="flex flex-col items-center justify-center mb-10 text-center">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-900/40 transform rotate-3 border border-indigo-700">
            <BrainCircuit className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-serif font-black text-slate-800 dark:text-slate-100 tracking-wide mb-2">
            CENTRAL <span className="text-indigo-600 dark:text-indigo-400">ADMIN</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-[#A1A1AA]">
            Acesso Restrito ao Ecossistema Estudantil
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white dark:bg-[#121212] p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-[#2C2C2E] relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none"></div>

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
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#1C1C1E] border-2 border-slate-200 dark:border-[#2C2C2E] rounded-xl text-sm focus:ring-0 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors dark:text-white"
                    placeholder="admin@diretoria.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#A1A1AA]">Senha Mestra</label>
                  <a href="#" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">Esqueci a master key</a>
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
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#1C1C1E] border-2 border-slate-200 dark:border-[#2C2C2E] rounded-xl text-sm focus:ring-0 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-70 dark:bg-indigo-600 dark:hover:bg-indigo-500 dark:text-white text-white font-bold py-3.5 px-4 rounded-xl shadow-xl shadow-slate-900/10 dark:shadow-[0_0_20px_rgba(79,70,229,0.2)] transition-all active:scale-[0.98]"
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
              Acesso Restrito? <a href="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Ir para Portal do Aluno</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
