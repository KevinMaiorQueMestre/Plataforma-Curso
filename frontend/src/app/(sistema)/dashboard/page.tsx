import SummaryCards from "@/components/dashboard/SummaryCards";
import EvolutionCharts from "@/components/dashboard/EvolutionCharts";
import { BarChart2 } from "lucide-react";

export default function EvolucaoPage() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl pb-20 px-4 md:px-0">
      <header className="mb-2 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-[1.2rem] shadow-lg shadow-indigo-600/20">
              <BarChart2 className="w-8 h-8 text-white" />
            </div>
            Dashboards de Evolução
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <div className="h-1 w-12 bg-indigo-500 rounded-full"></div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em]">Acompanhe seu progresso e métricas de desempenho</p>
          </div>
        </div>
      </header>

      <section>
        <SummaryCards />
      </section>

      <section>
        <EvolutionCharts />
      </section>
    </div>
  );
}
