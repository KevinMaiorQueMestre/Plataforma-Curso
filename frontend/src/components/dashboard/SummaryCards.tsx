import { CheckCircle2, Clock, Target, TrendingUp, TrendingDown } from "lucide-react";

export default function SummaryCards() {
  const summaryData = [
    {
      title: "Questões Resolvidas",
      value: "1.248",
      trend: "+12% esta semana",
      trendPositive: true,
      icon: <Target className="w-6 h-6 text-white" />,
      iconBg: "bg-emerald-500 shadow-lg shadow-emerald-500/20",
      accentBg: "bg-emerald-500/5",
    },
    {
      title: "Taxa de Acerto Global",
      value: "78%",
      trend: "+3.5% este mês",
      trendPositive: true,
      icon: <CheckCircle2 className="w-6 h-6 text-white" />,
      iconBg: "bg-indigo-600 shadow-lg shadow-indigo-600/20",
      accentBg: "bg-indigo-500/5",
    },
    {
      title: "Horas de Estudo",
      value: "32h",
      trend: "-2h semana passada",
      trendPositive: false,
      icon: <Clock className="w-6 h-6 text-white" />,
      iconBg: "bg-amber-500 shadow-lg shadow-amber-500/20",
      accentBg: "bg-amber-500/5",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {summaryData.map((data, index) => (
        <div
          key={index}
          className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-7 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col justify-between transition-all hover:shadow-md group relative overflow-hidden"
        >
          <div className={`absolute top-0 right-0 w-40 h-40 ${data.accentBg} rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none`}></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">{data.title}</p>
              <div className={`p-2.5 rounded-xl ${data.iconBg}`}>
                {data.icon}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-black text-slate-800 dark:text-white tracking-tight">{data.value}</div>
              <div className="flex items-center gap-2">
                {data.trendPositive ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-amber-500" />
                )}
                <p className={`text-xs font-black uppercase tracking-widest ${
                  data.trendPositive ? "text-emerald-500" : "text-amber-500"
                }`}>
                  {data.trend}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
