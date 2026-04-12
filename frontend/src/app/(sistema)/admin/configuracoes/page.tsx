"use client";

import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { 
  Settings2, 
  Database,
  ChevronRight,
  Settings
} from "lucide-react";
import Link from "next/link";

export default function AdminConfiguracoesPage() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20 px-4">
      <header className="mb-6 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
              <div className="bg-slate-800 dark:bg-white p-3 rounded-[1.2rem] shadow-lg shadow-slate-800/20 dark:shadow-white/20">
                <Settings className="w-8 h-8 text-white dark:text-slate-900" />
              </div>
              Configurações
            </h1>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-3 ml-2">Painel Administrativo</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        
        {/* Linha: Aparência/Interface */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl px-8 py-5 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col sm:flex-row justify-between sm:items-center gap-4 group transition-all hover:bg-slate-50 dark:hover:bg-[#252529]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Aparência do Dashboard</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Alternar entre modo claro e escuro</p>
            </div>
          </div>
          <ThemeSwitcher />
        </div>

        {/* Linha: Edição de Variáveis Padrão */}
        <Link 
          href="/admin/configuracoes/variaveis"
          className="bg-white dark:bg-[#1C1C1E] rounded-3xl px-8 py-5 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex items-center justify-between group transition-all hover:bg-indigo-50 dark:hover:bg-indigo-500/5 active:scale-[0.99]"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Variáveis Padrão da Plataforma</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Controla as opções de categorização e grade curricular</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
}
