import { CheckCircle2, Circle } from "lucide-react";

export default function TarefasPage() {
  const tarefas = [
    { texto: "Revisar anotações de Termodinâmica", status: "completed" },
    { texto: "Finalizar lista de exercícios de Logaritmo", status: "pending" },
    { texto: "Assistir a aula bônus de Redação Nível A", status: "pending" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Agenda de Notas & Metas</h1>
        <p className="text-slate-500 mt-1">Sua lista de afazeres para não se perder nos estudos.</p>
      </header>
      
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <ul className="space-y-2">
          {tarefas.map((t, i) => (
            <li key={i} className="flex items-center gap-4 p-4 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all cursor-pointer">
              {t.status === "completed" ? (
                <CheckCircle2 className="w-5 h-5 text-teal-500" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300" />
              )}
              <span className={`text-sm font-medium ${t.status === "completed" ? "text-slate-400 line-through" : "text-slate-700"}`}>
                {t.texto}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
