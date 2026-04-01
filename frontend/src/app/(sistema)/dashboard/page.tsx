import SummaryCards from "@/components/dashboard/SummaryCards";
import EvolutionCharts from "@/components/dashboard/EvolutionCharts";

export default function EvolucaoPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboards de Evolução</h1>
        <p className="text-slate-500 mt-1">Acompanhe seu progresso e métricas de desempenho.</p>
      </header>

      <section>
        <SummaryCards />
      </section>

      <section className="h-[400px]">
        <EvolutionCharts />
      </section>
    </div>
  );
}
