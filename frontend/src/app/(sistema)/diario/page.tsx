"use client";

import { useState, useEffect } from "react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { 
  BookOpen, Target, Plus, X, BarChart2, ChevronDown, Clock, Play, Pause, RotateCcw, 
  Filter, SortAsc, Users, Calendar, Book, PenTool, Layers, CheckSquare 
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  MOCK_ESTUDOS,
  MOCK_DISCIPLINAS,
  MOCK_CONTEUDOS
} from "@/lib/kevquestLogic";

// --- CUSTOM DROPDOWN ---
function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = "",
  dropdownClasses = ""
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string; element?: React.ReactNode }[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
  dropdownClasses?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOpt = options.find(o => o.value === value);

  return (
    <div className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left flex justify-between items-center outline-none ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="truncate">{selectedOpt ? selectedOpt.label : <span className="opacity-50">{placeholder}</span>}</span>
        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
             initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
             className={`absolute z-50 w-full mt-2 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden ${dropdownClasses}`}
          >
             <div className="max-h-60 overflow-y-auto p-1 flex flex-col">
                {options.map((opt) => (
                   <button
                     key={opt.value}
                     type="button"
                     onClick={() => { onChange(opt.value); setIsOpen(false); }}
                     className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 ${value === opt.value ? 'bg-indigo-50 text-indigo-600' : ''}`}
                   >
                     {opt.label}
                   </button>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- MAIN PAGE ---
export default function HomeEstudosPage() {
  const [estudos, setEstudos] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Timer State
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Filters
  const [filterDisciplina, setFilterDisciplina] = useState("all");
  const [sortBy, setSortBy] = useState("data-desc");

  // Form
  const [form, setForm] = useState({
    data: format(new Date(), 'yyyy-MM-dd'),
    disciplinaId: "",
    conteudoId: "",
    questoesFeitas: "",
    acertos: "",
    tempoH: "",
    tempoM: "",
    tipoEstudo: "teorico"
  });

  // Load Data
  useEffect(() => {
    const stored = localStorage.getItem("kevquest_estudos");
    if (stored) {
      setEstudos(JSON.parse(stored));
    } else {
      setEstudos(MOCK_ESTUDOS);
      localStorage.setItem("kevquest_estudos", JSON.stringify(MOCK_ESTUDOS));
    }
    setIsLoaded(true);
  }, []);

  // --- TIMER LOGIC (CRITICAL FIX) ---
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleFinish = () => {
    setIsRunning(false);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    setForm(prev => ({ ...prev, tempoH: h.toString(), tempoM: m.toString() }));
    setModalOpen(true);
    setSeconds(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { tipoEstudo, disciplinaId, conteudoId, tempoH, tempoM, questoesFeitas, acertos } = form;

    if (!disciplinaId || !conteudoId || (!tempoH && !tempoM)) {
      toast.error("Preencha Disciplina, Conteúdo e Tempo.");
      return;
    }

    if ((tipoEstudo === 'pratico' || tipoEstudo === 'misto') && (!questoesFeitas || !acertos)) {
      toast.error("Informe questões e acertos.");
      return;
    }

    const discName = MOCK_DISCIPLINAS.find(d => d.id === disciplinaId)?.nome || "";
    const contName = MOCK_CONTEUDOS[disciplinaId]?.find(c => c.id === conteudoId)?.nome || "";

    const novo = {
      id: "esc_" + Date.now(),
      dataIso: form.data,
      disciplinaId,
      disciplinaNome: discName,
      conteudoId,
      conteudoNome: contName,
      questoesFeitas: tipoEstudo === 'teorico' ? 0 : parseInt(questoesFeitas),
      acertos: tipoEstudo === 'teorico' ? 0 : parseInt(acertos),
      horasEstudo: (parseInt(tempoH) || 0) + (parseInt(tempoM) || 0) / 60,
      tipoEstudo
    };

    const novaLista = [novo, ...estudos];
    setEstudos(novaLista);
    localStorage.setItem("kevquest_estudos", JSON.stringify(novaLista));
    toast.success("Estudo registrado!");
    setModalOpen(false);
    setForm({ data: format(new Date(), 'yyyy-MM-dd'), disciplinaId: "", conteudoId: "", questoesFeitas: "", acertos: "", tempoH: "", tempoM: "", tipoEstudo: "teorico" });
  };

  // Filter/Sort
  const filtered = estudos
    .filter(e => filterDisciplina === "all" || e.disciplinaId === filterDisciplina)
    .sort((a, b) => {
      if (sortBy === "data-desc") return new Date(b.dataIso).getTime() - new Date(a.dataIso).getTime();
      const pA = a.questoesFeitas > 0 ? a.acertos / a.questoesFeitas : 0;
      const pB = b.questoesFeitas > 0 ? b.acertos / b.questoesFeitas : 0;
      return sortBy === "perf-desc" ? pB - pA : 0;
    });

  const totalQ = estudos.reduce((a, b) => a + (b.questoesFeitas || 0), 0);
  const totalA = estudos.reduce((a, b) => a + (b.acertos || 0), 0);
  const diasFaltam = differenceInDays(new Date(2026, 10, 3), new Date());

  if (!isLoaded) return <div className="p-10 font-bold">Carregando...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <header className="mb-2">
        <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter flex items-center gap-3">
          <BookOpen className="w-10 h-10 text-indigo-600" /> Diário de Estudos
        </h1>
        <p className="text-slate-500 font-bold">Gerencie sua evolução diária.</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        
        {/* MAIN CONTENT */}
        <div className="space-y-6">
          
          {/* TIMER BOX - COMPACT & UNIFIED */}
          <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white border border-slate-800 shadow-2xl flex flex-col xl:flex-row items-center justify-between gap-6 overflow-hidden">
             
             {/* Info & Timer */}
             <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 flex-shrink-0">
                 <Clock className="w-7 h-7 text-indigo-400" />
               </div>
               <div>
                  <h2 className="text-lg font-black leading-tight">Cronômetro</h2>
                  <div className="text-4xl font-black font-mono tracking-tighter text-indigo-400">
                    {formatTime(seconds)}
                  </div>
               </div>
             </div>

             {/* Controls Group */}
             <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-3xl border border-slate-700/50">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsRunning(!isRunning)} 
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg ${isRunning ? 'bg-amber-500 text-white' : 'bg-white text-slate-900'}`}
                  >
                    {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                  </button>
                  <button 
                    onClick={handleFinish} 
                    className="w-14 h-14 bg-slate-700 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg border border-slate-600"
                  >
                    <CheckSquare className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="w-px h-10 bg-slate-700 mx-1"></div>

                <button 
                  onClick={() => { setIsRunning(false); setModalOpen(true); }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-5 py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Registrar Manual
                </button>
             </div>
          </div>

          {/* HISTORICO */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
               <h2 className="text-xl font-black text-slate-800 dark:text-white">Meu Progresso</h2>
               <div className="flex gap-2">
                  <select value={filterDisciplina} onChange={e => setFilterDisciplina(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-black">
                     <option value="all">Todas Disciplinas</option>
                     {MOCK_DISCIPLINAS.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                  </select>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-black">
                     <option value="data-desc">Mais Recentes</option>
                     <option value="perf-desc">Melhor Performance</option>
                  </select>
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-slate-50 dark:border-slate-800">
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Data / Tipo</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Disciplina</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-center">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => {
                    const p = e.questoesFeitas > 0 ? Math.round((e.acertos / e.questoesFeitas) * 100) : 0;
                    return (
                      <tr key={e.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all">
                        <td className="py-5 px-4 whitespace-nowrap">
                          <div className="font-black text-slate-800 dark:text-white">{format(new Date(e.dataIso), "dd/MM - EEEE", { locale: ptBR })}</div>
                          <div className="text-[10px] font-black uppercase text-indigo-500">{e.tipoEstudo || 'misto'} • {e.horasEstudo}h</div>
                        </td>
                        <td className="py-5 px-4 font-bold">
                          <div className="text-slate-800 dark:text-white">{e.disciplinaNome}</div>
                          <div className="text-xs text-slate-400">{e.conteudoNome}</div>
                        </td>
                        <td className="py-5 px-4 text-center">
                          <div className={`px-3 py-1 rounded-full text-xs font-black inline-block ${p >= 80 ? 'bg-teal-100 text-teal-600' : p >= 60 ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                            {p}% ({e.acertos}/{e.questoesFeitas})
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-[#1C1C1E] rounded-[3rem] w-full max-w-md p-10 shadow-2xl relative">
                <button onClick={() => setModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-800"><X /></button>
                <h2 className="text-2xl font-black mb-8 text-slate-800 dark:text-white">Registrar Evolução</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="grid grid-cols-3 gap-2">
                      {['teorico', 'pratico', 'misto'].map(t => (
                        <button key={t} type="button" onClick={() => setForm({...form, tipoEstudo: t})} className={`py-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${form.tipoEstudo === t ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'}`}>
                           {t === 'teorico' ? <Book className="w-5 h-5"/> : t === 'pratico' ? <PenTool className="w-5 h-5"/> : <Layers className="w-5 h-5"/>}
                           <span className="text-[10px] font-black uppercase">{t}</span>
                        </button>
                      ))}
                   </div>

                   <CustomDropdown value={form.disciplinaId} onChange={v => setForm({...form, disciplinaId: v, conteudoId: ""})} options={MOCK_DISCIPLINAS.map(d => ({value: d.id, label: d.nome}))} placeholder="Disciplina" className="p-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold" />
                   <CustomDropdown disabled={!form.disciplinaId} value={form.conteudoId} onChange={v => setForm({...form, conteudoId: v})} options={form.disciplinaId ? (MOCK_CONTEUDOS[form.disciplinaId]?.map(c => ({value: c.id, label: c.nome})) || []) : []} placeholder="Conteúdo" className="p-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold" />

                   <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase">Tempo de Estudo</label>
                      <div className="grid grid-cols-2 gap-2">
                         <div className="relative">
                            <input type="number" min="0" value={form.tempoH} onChange={e => setForm({...form, tempoH: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-xl font-black text-center outline-none border-2 border-transparent focus:border-indigo-500" placeholder="0"/>
                            <span className="absolute bottom-2 right-4 text-[9px] font-black text-slate-400 uppercase">Horas</span>
                         </div>
                         <div className="relative">
                            <input type="number" min="0" max="59" value={form.tempoM} onChange={e => setForm({...form, tempoM: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-xl font-black text-center outline-none border-2 border-transparent focus:border-indigo-500" placeholder="0"/>
                            <span className="absolute bottom-2 right-4 text-[9px] font-black text-slate-400 uppercase">Mins</span>
                         </div>
                      </div>
                   </div>

                   {(form.tipoEstudo !== 'teorico') && (
                     <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-400 uppercase">Questões</label>
                           <input type="number" value={form.questoesFeitas} onChange={e => setForm({...form, questoesFeitas: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-xl font-black text-center outline-none" placeholder="00"/>
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-400 uppercase">Acertos</label>
                           <input type="number" value={form.acertos} onChange={e => setForm({...form, acertos: e.target.value})} className="w-full bg-teal-50 dark:bg-teal-900/20 p-4 rounded-2xl text-xl font-black text-center outline-none text-teal-600" placeholder="00"/>
                        </div>
                     </div>
                   )}

                   <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 text-lg">Gravar Estudo</button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
