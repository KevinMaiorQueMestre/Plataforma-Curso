"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const mockData = [
  { name: "Jan", acertos: 65, erros: 35 },
  { name: "Fev", acertos: 70, erros: 30 },
  { name: "Mar", acertos: 78, erros: 22 },
  { name: "Abr", acertos: 82, erros: 18 },
  { name: "Mai", acertos: 88, erros: 12 },
  { name: "Jun", acertos: 90, erros: 10 },
];

export default function EvolutionCharts() {
  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 h-full flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Evolução de Desempenho</h2>
          <p className="text-sm text-slate-500 mt-1">Comparativo de Acertos vs Erros nos últimos 6 meses</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal-500" />
            <span className="text-sm text-slate-600 font-medium">Acertos</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-400" />
            <span className="text-sm text-slate-600 font-medium">Erros</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAcertos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00A896" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00A896" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorErros" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF9F1C" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FF9F1C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 13 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 13 }} />
            <Tooltip
              contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
              labelStyle={{ fontWeight: "bold", color: "#1E293B" }}
            />
            <Area
              type="monotone"
              dataKey="acertos"
              stroke="#00A896"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorAcertos)"
            />
            <Area
              type="monotone"
              dataKey="erros"
              stroke="#FF9F1C"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorErros)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
