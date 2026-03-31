import { CheckCircle2, Clock, Target } from "lucide-react";

export default function SummaryCards() {
  const summaryData = [
    {
      title: "Questões Resolvidas",
      value: "1.248",
      trend: "+12% esta semana",
      trendPositive: true,
      icon: <Target className="w-6 h-6 text-teal-600" />,
      colorClass: "bg-teal-50",
    },
    {
      title: "Taxa de Acerto Global",
      value: "78%",
      trend: "+3.5% este mês",
      trendPositive: true,
      icon: <CheckCircle2 className="w-6 h-6 text-teal-600" />,
      colorClass: "bg-teal-50",
    },
    {
      title: "Horas de Estudo",
      value: "32h",
      trend: "-2h semana passada",
      trendPositive: false,
      icon: <Clock className="w-6 h-6 text-orange-500" />,
      colorClass: "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {summaryData.map((data, index) => (
        <div
          key={index}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between transition-transform hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">{data.title}</h3>
            <div className={`p-2 rounded-2xl ${data.colorClass}`}>
              {data.icon}
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-800">{data.value}</div>
            <p
              className={`text-sm mt-2 font-medium ${
                data.trendPositive ? "text-teal-600" : "text-orange-500"
              }`}
            >
              {data.trend}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
