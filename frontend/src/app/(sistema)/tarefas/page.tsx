"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Plus, Trash2, CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type AppTask = {
  id: string;
  texto: string;
  status: "completed" | "pending";
  limitDate?: string;
};

const INITIAL_TASKS: AppTask[] = [
  { id: "t1", texto: "Revisar anotações de Termodinâmica", status: "completed" },
  { id: "t2", texto: "Finalizar lista de exercícios Logaritmo", status: "pending", limitDate: "2026-04-10" },
  { id: "t3", texto: "Assistir a aula bônus de Redação Nível A", status: "pending" },
];

export default function TarefasPage() {
  const [tarefas, setTarefas] = useState<AppTask[]>(INITIAL_TASKS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Lê do localStorage apenas uma vez no mount cliente
  useEffect(() => {
    const saved = localStorage.getItem("@sinapse/tarefas");
    if (saved) {
      try {
        setTarefas(JSON.parse(saved));
      } catch(e){}
    }
    setIsLoaded(true);
  }, []);

  // Salva no localStorage em toda atualização, contanto que já tenha dado Load
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("@sinapse/tarefas", JSON.stringify(tarefas));
    }
  }, [tarefas, isLoaded]);

  const [newTaskText, setNewTaskText] = useState("");
  const [newLimitDate, setNewLimitDate] = useState("");

  const handleAddTask = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: AppTask = {
      id: crypto.randomUUID(),
      texto: newTaskText,
      status: "pending",
      limitDate: newLimitDate || undefined,
    };

    setTarefas([newTask, ...tarefas]);
    setNewTaskText("");
    setNewLimitDate("");
  };

  const toggleTaskStatus = (id: string) => {
    setTarefas(prev => prev.map(t => 
      t.id === id ? { ...t, status: t.status === "completed" ? "pending" : "completed" } : t
    ));
  };

  const removeTask = (id: string) => {
    setTarefas(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-[#FFFFFF] tracking-tight">Metas e Afazeres</h1>
        <p className="text-slate-500 dark:text-[#A1A1AA] mt-1">Sua lista de afazeres para não se perder nos estudos.</p>
      </header>
      
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col gap-6">
        
        {/* Formulário de Nova Tarefa */}
        <form 
          onSubmit={handleAddTask}
          className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 dark:bg-[#121212]/50 p-3 rounded-2xl border border-slate-200 dark:border-[#2C2C2E] focus-within:border-indigo-500 dark:focus-within:border-indigo-500/50 transition-colors"
        >
          <div className="flex-1 w-full bg-transparent">
            <input 
              type="text"
              placeholder="O que você precisa estudar ou fazer?"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="w-full bg-transparent border-none text-sm font-medium text-slate-700 dark:text-[#F4F4F5] focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-[#A1A1AA] outline-none px-2"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative group flex-shrink-0">
              <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-indigo-500 transition-colors" />
              <input 
                type="date"
                value={newLimitDate}
                onChange={(e) => setNewLimitDate(e.target.value)}
                className="pl-9 pr-3 py-2 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl text-xs font-medium text-slate-600 dark:text-[#E4E4E7] focus:outline-none focus:border-indigo-500 transition-colors w-full sm:w-auto h-10"
              />
            </div>
            
            <button 
              type="submit"
              disabled={!newTaskText.trim()}
              className="h-10 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 dark:shadow-none flex items-center gap-2 flex-shrink-0 font-bold text-xs uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          </div>
        </form>

        {/* Lista de Tarefas */}
        <div className="space-y-2 mt-4">
          {tarefas.length === 0 ? (
            <div className="text-center py-10">
               <p className="text-slate-500 dark:text-[#A1A1AA] text-sm">Nenhuma tarefa no momento. Que bom, hora de descansar!</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {tarefas.map((t) => (
                <li 
                  key={t.id} 
                  className={`group flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                    t.status === "completed" 
                    ? "bg-slate-50/50 dark:bg-[#121212]/30 border-transparent opacity-70" 
                    : "bg-white dark:bg-[#1C1C1E] border-slate-100 dark:border-[#2C2C2E] hover:border-slate-200 dark:hover:border-[#3A3A3C] shadow-sm hover:shadow"
                  }`}
                  onClick={() => toggleTaskStatus(t.id)}
                >
                  <div className="flex items-center gap-4 flex-1 overflow-hidden">
                    {t.status === "completed" ? (
                      <CheckCircle2 className="w-6 h-6 text-teal-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-300 dark:text-[#3A3A3C] flex-shrink-0 group-hover:text-indigo-400 transition-colors" />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className={`text-base font-medium truncate ${t.status === "completed" ? "text-slate-400 dark:text-[#A1A1AA] line-through" : "text-slate-800 dark:text-[#FFFFFF]"}`}>
                        {t.texto}
                      </span>
                      {t.limitDate && (
                         <span className={`text-xs mt-1 flex items-center gap-1 ${t.status === "completed" ? "text-slate-400" : "text-amber-600 dark:text-amber-500"}`}>
                           <CalendarIcon className="w-3 h-3" />
                           Até {format(parseISO(t.limitDate), "dd 'de' MMMM", { locale: ptBR })}
                         </span>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTask(t.id);
                    }}
                    className="p-2 text-slate-300 dark:text-[#3A3A3C] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
