"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Plus, Trash2, CalendarIcon, Target, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

type AppTask = {
  id: string;
  texto: string;
  status: "completed" | "pending";
  limit_date?: string;
};

export default function TarefasPage() {
  const [tarefas, setTarefas] = useState<AppTask[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [newLimitDate, setNewLimitDate] = useState("");
  
  const supabase = createClient();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('tarefas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setTarefas(data as any);
    }
    setIsLoaded(true);
  };

  const handleAddTask = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTaskText.trim() || isAdding) return;

    setIsAdding(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('tarefas')
      .insert([
        {
          user_id: user?.id,
          texto: newTaskText,
          status: "pending",
          limit_date: newLimitDate || null,
        }
      ])
      .select()
      .single();

    if (error) {
      toast.error("Erro ao adicionar tarefa.");
    } else if (data) {
      setTarefas([data as any, ...tarefas]);
      setNewTaskText("");
      setNewLimitDate("");
      toast.success("Meta adicionada!");
    }
    setIsAdding(false);
  };

  const toggleTaskStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    
    // Otimista
    setTarefas(prev => prev.map(t => 
      t.id === id ? { ...t, status: newStatus as any } : t
    ));

    const { error } = await supabase
      .from('tarefas')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error("Erro ao atualizar status.");
      fetchTasks(); // Rollback
    }
  };

  const removeTask = async (id: string) => {
    // Otimista
    setTarefas(prev => prev.filter(t => t.id !== id));

    const { error } = await supabase
      .from('tarefas')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erro ao remover tarefa.");
      fetchTasks();
    } else {
      toast.success("Meta removida.");
    }
  };

  if (!isLoaded) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const hojeStr = new Date().toISOString().split('T')[0];
  const tarefasHoje = tarefas.filter(t => t.limit_date === hojeStr && t.status === "pending");
  const pendentes = tarefas.filter(t => t.status === "pending").length;
  const concluidas = tarefas.filter(t => t.status === "completed").length;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20 px-4 md:px-0">
      
      {/* HEADER PREMIUM */}
      <header className="mb-2 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-[1.2rem] shadow-lg shadow-indigo-600/20">
              <Target className="w-8 h-8 text-white" />
            </div>
            Metas de Estudo
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <div className="h-1 w-12 bg-indigo-500 rounded-full"></div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em]">Sua trilha de metas diárias e prazos acadêmicos</p>
          </div>
        </div>
      </header>

      {/* STATS CARDS */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 border border-slate-100 dark:border-[#2C2C2E] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] mb-2">Pendentes</p>
          <p className="text-5xl font-black text-amber-500">{pendentes}</p>
        </div>
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 border border-slate-100 dark:border-[#2C2C2E] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] mb-2">Concluídas</p>
          <p className="text-5xl font-black text-emerald-500">{concluidas}</p>
        </div>
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 border border-slate-100 dark:border-[#2C2C2E] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] mb-2">Para Hoje</p>
          <p className="text-5xl font-black text-indigo-500">{tarefasHoje.length}</p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <section className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
        
        <div className="relative z-10 space-y-8">

          {/* Formulário de Nova Tarefa */}
          <form 
            onSubmit={handleAddTask}
            className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-[#2C2C2E]/50 p-4 rounded-[2rem] border border-slate-100 dark:border-white/5 focus-within:border-indigo-500/30 transition-colors"
          >
            <div className="flex-1 w-full">
              <input 
                type="text"
                placeholder="O que você precisa estudar ou fazer?"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="w-full bg-transparent border-none text-sm font-bold text-slate-700 dark:text-white focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none px-4"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative group flex-shrink-0">
                <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-indigo-500 transition-colors" />
                <input 
                  type="date"
                  value={newLimitDate}
                  onChange={(e) => setNewLimitDate(e.target.value)}
                  className="pl-10 pr-3 py-3 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors w-full sm:w-auto h-12"
                />
              </div>
              
              <button 
                type="submit"
                disabled={!newTaskText.trim() || isAdding}
                className="h-12 px-6 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2 flex-shrink-0 font-black text-xs uppercase tracking-widest active:scale-95"
              >
                {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Adicionar
              </button>
            </div>
          </form>

          {/* METAS DE HOJE */}
          {tarefasHoje.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 px-2">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-100 dark:via-indigo-500/10 to-transparent"></div>
                <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                  <CalendarIcon className="w-3.5 h-3.5" /> Metas de Hoje
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-100 dark:via-indigo-500/10 to-transparent"></div>
              </div>
               
              <ul className="space-y-3">
                {tarefasHoje.map(t => (
                  <motion.li
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => toggleTaskStatus(t.id, t.status)}
                    className="group flex items-center justify-between gap-4 p-6 rounded-[2rem] border-2 border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
                        <Circle className="w-6 h-6 text-indigo-500 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-slate-800 dark:text-white leading-tight">{t.texto}</span>
                        <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-1">
                          Programada para hoje
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeTask(t.id); }}
                      className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* TODAS AS METAS */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] px-2">Todas as Metas</h3>
            {tarefas.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                </div>
                <p className="text-slate-400 dark:text-slate-500 font-bold">Nenhuma meta. Hora de descansar!</p>
              </div>
            ) : (
              <ul className="space-y-3">
                <AnimatePresence>
                {(() => {
                  const asOutras = tarefas
                    .filter(t => t.limit_date !== hojeStr || t.status === "completed")
                    .sort((a, b) => {
                      if (a.status === "pending" && b.status === "completed") return -1;
                      if (a.status === "completed" && b.status === "pending") return 1;
                      return 0;
                    });
                  
                  if (asOutras.length === 0 && tarefas.length > 0) {
                    return <p className="text-center py-8 text-sm text-slate-400 dark:text-slate-600 italic font-bold">Sem outras metas pendentes.</p>
                  }

                  return asOutras.map((t) => (
                    <motion.li
                      key={t.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className={`group flex items-center justify-between gap-4 p-5 rounded-[2rem] border transition-all cursor-pointer active:scale-[0.99] ${
                        t.status === "completed" 
                        ? "bg-slate-50/50 dark:bg-[#121212]/30 border-transparent opacity-60" 
                        : "bg-white dark:bg-[#2C2C2E]/30 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 shadow-sm hover:shadow-md"
                      }`}
                      onClick={() => toggleTaskStatus(t.id, t.status)}
                    >
                      <div className="flex items-center gap-4 flex-1 overflow-hidden">
                        {t.status === "completed" ? (
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
                            <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className={`text-base font-black truncate ${t.status === "completed" ? "text-slate-400 dark:text-slate-600 line-through" : "text-slate-800 dark:text-white"}`}>
                            {t.texto}
                          </span>
                          {t.limit_date && (
                            <span className={`text-[10px] mt-1 flex items-center gap-1.5 font-black uppercase tracking-widest ${t.status === "completed" ? "text-slate-400 dark:text-slate-600" : "text-amber-500"}`}>
                              <CalendarIcon className="w-3 h-3" />
                              {t.limit_date === hojeStr ? "Para Hoje" : `Até ${format(parseISO(t.limit_date), "dd 'de' MMMM", { locale: ptBR })}`}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTask(t.id);
                        }}
                        className="p-3 text-slate-300 dark:text-slate-700 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </motion.li>
                  ));
                })()}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
