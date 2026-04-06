"use client";

import { useState, useEffect } from "react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { 
  BookOpen, Target, Plus, X, BarChart2, ChevronDown, Clock, Play, Pause, RotateCcw, 
  Filter, SortAsc, Users, Calendar, Book, PenTool, Layers, CheckSquare,
  ArrowUp, ArrowDown, ArrowUpDown, Maximize2, Minimize2, Edit2
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  MOCK_ESTUDOS,
  MOCK_DISCIPLINAS,
  MOCK_CONTEUDOS
} from "@/lib/kevquestLogic";
import { useRef } from "react";
import { Settings2, Trash2 } from "lucide-react";

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => o.value === value);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left flex justify-between items-center outline-none transition-all ${className} ${disabled ? 'opacity-50 cursor-not-allowed shadow-none' : 'cursor-pointer hover:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'}`}
      >
        <span className="truncate">{selectedOpt ? selectedOpt.label : <span className="opacity-50 font-medium">{placeholder}</span>}</span>
        <ChevronDown className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : 'text-slate-400'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
             initial={{ opacity: 0, y: -8, scale: 0.98 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: -8, scale: 0.98 }}
             transition={{ duration: 0.2, ease: "easeOut" }}
             className={`absolute z-[100] w-full mt-2 bg-white dark:bg-[#1C1C1EE6] backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden ${dropdownClasses}`}
          >
             <div className="max-h-60 overflow-y-auto p-1.5 flex flex-col gap-1 custom-scrollbar">
                {options.map((opt) => (
                   <button
                     key={opt.value}
                     type="button"
                     onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                     }}
                     className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${value === opt.value ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'}`}
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

  // Filtro de disciplina (coluna Disciplina)
  const [filterDisciplina, setFilterDisciplina] = useState("all");

  // Ordenação exclusiva — só uma coluna ordena por vez
  const [sortKey, setSortKey] = useState<'dataIso' | 'performance'>('dataIso');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Modo Foco (Tela Cheia)
  const [isFocusMode, setIsFocusMode] = useState(false);

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

  // EDIT STATE
  const [editingId, setEditingId] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);

  // Configurações editáveis (Estilo KevQuest)
  const [cfgDisciplinas, setCfgDisciplinas] = useState<{id: string, nome: string}[]>(MOCK_DISCIPLINAS);
  const [cfgConteudos, setCfgConteudos] = useState<Record<string, {id: string, nome: string}[]>>(MOCK_CONTEUDOS);
  const [cfgInput, setCfgInput] = useState({ disciplina: "", conteudo: "" });

  // Persistência das configurações
  useEffect(() => {
    const saved = localStorage.getItem('diario_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.disciplinas) setCfgDisciplinas(parsed.disciplinas);
      if (parsed.conteudos) setCfgConteudos(parsed.conteudos);
    }
  }, []);

  useEffect(() => {
    const config = { disciplinas: cfgDisciplinas, conteudos: cfgConteudos };
    localStorage.setItem('diario_config', JSON.stringify(config));
  }, [cfgDisciplinas, cfgConteudos]);

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
    setEditingId(null);
    setModalOpen(true);
    setSeconds(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { tipoEstudo, disciplinaId, conteudoId, tempoH, tempoM, questoesFeitas, acertos, data } = form;

    if (!disciplinaId || !conteudoId || (!tempoH && !tempoM)) {
      toast.error("Preencha Disciplina, Conteúdo e Tempo.");
      return;
    }

    if ((tipoEstudo === 'pratico' || tipoEstudo === 'misto') && (!questoesFeitas || !acertos)) {
      toast.error("Informe questões e acertos.");
      return;
    }

    if (parseInt(acertos) > parseInt(questoesFeitas)) {
      toast.error("Os acertos não podem ultrapassar o número de questões feitas.");
      return;
    }

    const discName = cfgDisciplinas.find(d => d.id === disciplinaId)?.nome || "";
    const contName = cfgConteudos[disciplinaId]?.find(c => c.id === conteudoId)?.nome || "";

    const sessionData = {
      dataIso: data,
      disciplinaId,
      disciplinaNome: discName,
      conteudoId,
      conteudoNome: contName,
      questoesFeitas: tipoEstudo === 'teorico' ? 0 : parseInt(questoesFeitas),
      acertos: tipoEstudo === 'teorico' ? 0 : parseInt(acertos),
      horasEstudo: (parseInt(tempoH) || 0) + (parseInt(tempoM) || 0) / 60,
      tipoEstudo
    };

    let novaLista;
    if (editingId) {
      novaLista = estudos.map(e => e.id === editingId ? { ...e, ...sessionData } : e);
      toast.success("Estudo atualizado!");
    } else {
      const novo = {
        id: "esc_" + Date.now(),
        ...sessionData
      };
      novaLista = [novo, ...estudos];
      toast.success("Estudo registrado!");
    }

    setEstudos(novaLista);
    localStorage.setItem("kevquest_estudos", JSON.stringify(novaLista));
    setModalOpen(false);
    setEditingId(null);
    setForm({ data: format(new Date(), 'yyyy-MM-dd'), disciplinaId: "", conteudoId: "", questoesFeitas: "", acertos: "", tempoH: "", tempoM: "", tipoEstudo: "teorico" });
  };

  // Ordenação — alterna a coluna ativa, se clicar na mesma coluna inverte a direção
  const toggleSort = (key: 'dataIso' | 'performance') => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc'); // padrão ao trocar de coluna
    }
  };

  const handleEdit = (e: any) => {
    setEditingId(e.id);
    const h = Math.floor(e.horasEstudo);
    const m = Math.round((e.horasEstudo - h) * 60);
    setForm({
      data: e.dataIso,
      disciplinaId: e.disciplinaId,
      conteudoId: e.conteudoId,
      questoesFeitas: e.questoesFeitas.toString(),
      acertos: e.acertos.toString(),
      tempoH: h.toString(),
      tempoM: m.toString(),
      tipoEstudo: e.tipoEstudo || "misto"
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta sessão?")) {
      const novaLista = estudos.filter(e => e.id !== id);
      setEstudos(novaLista);
      localStorage.setItem("kevquest_estudos", JSON.stringify(novaLista));
      toast.success("Sessão removida!");
    }
  };

  // Ícone de ordenação para o header
  const SortIcon = ({ column }: { column: 'dataIso' | 'performance' }) => {
    if (sortKey !== column) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />;
    return sortDir === 'desc'
      ? <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
      : <ArrowUp className="w-3.5 h-3.5 text-indigo-500" />;
  };

  const filtered = estudos
    .filter(e => filterDisciplina === "all" || e.disciplinaId === filterDisciplina)
    .sort((a, b) => {
      const dir = sortDir === 'desc' ? -1 : 1;

      if (sortKey === 'dataIso') {
        return (new Date(a.dataIso).getTime() - new Date(b.dataIso).getTime()) * dir;
      }
      
      // performance
      const pA = a.questoesFeitas > 0 ? a.acertos / a.questoesFeitas : 0;
      const pB = b.questoesFeitas > 0 ? b.acertos / b.questoesFeitas : 0;
      return (pA - pB) * dir;
    });

  const totalQ = estudos.reduce((a, b) => a + (b.questoesFeitas || 0), 0);
  const totalA = estudos.reduce((a, b) => a + (b.acertos || 0), 0);
  const diasFaltam = differenceInDays(new Date(2026, 10, 3), new Date());

  if (!isLoaded) return <div className="p-10 font-bold">Carregando...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* HEADER PREMIUM */}
      <header className="flex justify-between items-end mb-6">
        <div className="relative">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4 relative z-10">
            <div className="bg-indigo-600 p-3 rounded-[1.2rem] shadow-lg shadow-indigo-600/20">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            Diário de Estudos
          </h1>
          <div className="flex items-center gap-3 mt-3 relative z-10">
            <div className="h-1 w-12 bg-indigo-500 rounded-full"></div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em]">Gerencie sua evolução diária</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button
             onClick={() => setConfigOpen(true)}
             title="Configurar opções"
             className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
           >
             <Settings2 className="w-5 h-5" />
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        
        {/* MAIN CONTENT */}
        <div className="space-y-6">
          
          {/* TIMER BOX - PREMIUM REDESIGN */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
             
             {/* Background Effects */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 blur-[100px] rounded-full -ml-32 -mb-32"></div>

             {/* Info & Timer */}
             <div className="relative flex items-center gap-6">
                <div className={`relative w-20 h-20 rounded-[2rem] flex items-center justify-center border-2 transition-all duration-500 shadow-2xl ${isRunning ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                  <Clock className={`w-8 h-8 transition-colors duration-500 ${isRunning ? 'text-indigo-400' : 'text-slate-500'}`} />
                  {isRunning && (
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 bg-indigo-500 rounded-[2rem] blur-xl -z-10"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                   <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] leading-tight mb-1">Fluxo de Estudo</h2>
                   <div className="flex items-baseline gap-2">
                      <div className={`text-7xl font-black font-mono tracking-tighter transition-all duration-500 ${isRunning ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-700'}`}>
                        {formatTime(seconds).split(':')[0]}:{formatTime(seconds).split(':')[1]}
                      </div>
                      <div className={`text-3xl font-black font-mono ${isRunning ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-700'}`}>
                        :{formatTime(seconds).split(':')[2]}
                      </div>
                   </div>
                </div>
             </div>

             {/* Controls Group */}
             <div className="relative z-10 flex flex-wrap items-center justify-center gap-5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-inner mt-8 xl:mt-0">
                <div className="flex gap-2">
                   <button 
                     onClick={() => setIsRunning(!isRunning)} 
                     title={isRunning ? "Pausar" : "Começar"}
                     className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all active:scale-90 shadow-2xl ${isRunning ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-700'}`}
                   >
                     {isRunning ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
                   </button>

                   <button 
                     onClick={handleFinish} 
                     title="Finalizar e Registrar"
                     className="w-16 h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] flex items-center justify-center transition-all active:scale-90 shadow-2xl shadow-indigo-600/20"
                   >
                     <CheckSquare className="w-7 h-7" />
                   </button>

                   <button 
                     onClick={() => {
                       setSeconds(0);
                       setIsRunning(false);
                     }} 
                     title="Resetar (Sem confirmação)"
                     className="w-16 h-16 bg-white dark:bg-slate-700/50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200 dark:border-white/5 shadow-md"
                   >
                     <X className="w-7 h-7" />
                   </button>
                </div>
                
                <div className="hidden sm:block w-[2px] h-10 bg-slate-200 dark:bg-white/5 mx-1 rounded-full"></div>

                <button 
                  onClick={() => { setIsRunning(false); setModalOpen(true); }}
                  className="group/btn bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-5 rounded-2xl shadow-xl shadow-indigo-600/20 text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-90 flex items-center gap-3"
                >
                  <Plus className="w-4 h-4 transition-transform group-hover/btn:rotate-90" /> Registro Manual
                </button>

                <div className="hidden sm:block w-[2px] h-10 bg-slate-200 dark:bg-white/5 mx-1 rounded-full"></div>

                <button 
                  onClick={() => setIsFocusMode(true)}
                  className="w-16 h-16 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-xl hover:shadow-indigo-500/10"
                  title="Modo Foco Máximo"
                >
                  <Maximize2 className="w-6 h-6" />
                </button>
             </div>
          </div>

          {/* HISTORICO */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
             <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
                <h2 className="text-xl font-black text-slate-800 dark:text-white">Meu Progresso</h2>
                <div className="text-xs text-slate-400 font-bold flex items-center gap-2">
                  {filtered.length} sessões
                </div>
             </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-slate-100 dark:border-slate-800">
                    <th className="pb-4 px-4">
                      <button 
                        onClick={() => toggleSort('dataIso')}
                        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${sortKey === 'dataIso' ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                      >
                        Data
                        <SortIcon column="dataIso" />
                      </button>
                    </th>
                    <th className="pb-4 px-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Filter className="w-3 h-3" /> Disciplina
                        </span>
                        <select 
                          value={filterDisciplina} 
                          onChange={e => setFilterDisciplina(e.target.value)}
                          className="w-full max-w-[180px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold py-1.5 px-2 outline-none cursor-pointer"
                        >
                          <option value="all">Todas</option>
                          {cfgDisciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                        </select>
                      </div>
                    </th>
                        <th className="pb-4 px-4 text-center">
                          <button 
                            onClick={() => toggleSort('performance')}
                            className={`flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors w-full ${sortKey === 'performance' ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                          >
                            Performance
                            <SortIcon column="performance" />
                          </button>
                        </th>
                        <th className="pb-4 px-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
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
                           <div className={`px-3 py-1 rounded-full text-xs font-black inline-block whitespace-nowrap ${p >= 80 ? 'bg-teal-100 text-teal-600 border border-teal-200 shadow-sm' : p >= 60 ? 'bg-amber-100 text-amber-600 border border-amber-200 shadow-sm' : 'bg-rose-100 text-rose-600 border border-rose-200 shadow-sm'}`}>
                             {p}% <span className="opacity-40 mx-0.5">/</span> {e.acertos}/{e.questoesFeitas}
                           </div>
                        </td>
                        <td className="py-5 px-4 text-right opacity-30 group-hover:opacity-100 transition-all duration-300">
                          <div className="flex items-center justify-end gap-1.5 font-sans">
                             <button 
                               onClick={() => handleEdit(e)} 
                               title="Editar Sessão"
                               className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-all active:scale-90"
                             >
                               <Edit2 className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => handleDelete(e.id)} 
                               title="Excluir Permanentemente"
                               className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all active:scale-90"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
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
                <button onClick={() => { setModalOpen(false); setEditingId(null); }} className="absolute top-8 right-8 text-slate-400 hover:text-slate-800"><X /></button>
                <h2 className="text-2xl font-black mb-8 text-slate-800 dark:text-white">{editingId ? "Editar Evolução" : "Registrar Evolução"}</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="grid grid-cols-3 gap-2">
                      {['teorico', 'pratico', 'misto'].map(t => (
                        <button key={t} type="button" onClick={() => setForm({...form, tipoEstudo: t})} className={`py-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${form.tipoEstudo === t ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'}`}>
                           {t === 'teorico' ? <Book className="w-5 h-5"/> : t === 'pratico' ? <PenTool className="w-5 h-5"/> : <Layers className="w-5 h-5"/>}
                           <span className="text-[10px] font-black uppercase">{t}</span>
                        </button>
                      ))}
                   </div>

                   <CustomDropdown value={form.disciplinaId} onChange={v => setForm({...form, disciplinaId: v, conteudoId: ""})} options={cfgDisciplinas.map(d => ({value: d.id, label: d.nome}))} placeholder="Disciplina" className="p-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold" />
                   <CustomDropdown disabled={!form.disciplinaId} value={form.conteudoId} onChange={v => setForm({...form, conteudoId: v})} options={form.disciplinaId ? (cfgConteudos[form.disciplinaId]?.map(c => ({value: c.id, label: c.nome})) || []) : []} placeholder="Conteúdo" className="p-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold" />

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
                           <input type="number" min="0" value={form.questoesFeitas} onChange={e => {
                             const val = e.target.value;
                             setForm(prev => {
                               const acertosVal = prev.acertos;
                               let newAcertos = acertosVal;
                               if (parseInt(acertosVal) > parseInt(val)) {
                                 newAcertos = val;
                               }
                               return { ...prev, questoesFeitas: val, acertos: newAcertos };
                             });
                           }} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-xl font-black text-center outline-none border-2 border-transparent focus:border-indigo-500 transition-all font-mono" placeholder="00"/>
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-400 uppercase">Acertos</label>
                           <input type="number" min="0" max={form.questoesFeitas} value={form.acertos} onChange={e => {
                             const val = parseInt(e.target.value) || 0;
                             const limit = parseInt(form.questoesFeitas) || 0;
                             if (val > limit) {
                               toast.error(`Limite de ${limit} acertos!`);
                               setForm({...form, acertos: limit.toString()});
                             } else {
                               setForm({...form, acertos: e.target.value});
                             }
                           }} className="w-full bg-teal-50 dark:bg-teal-900/20 p-4 rounded-2xl text-xl font-black text-center outline-none text-teal-600 border-2 border-transparent focus:border-teal-500 transition-all font-mono" placeholder="00"/>
                        </div>
                     </div>
                   )}

                   <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 text-lg">Gravar Estudo</button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY MODO FOCO */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-10 text-white overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-40 -mt-40 z-0"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -ml-40 -mb-40 z-0"></div>

            {/* Header Overlay */}
            <div className="absolute top-10 left-10 right-10 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tighter">Modo Foco Ativo</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Estudo em andamento</p>
                </div>
              </div>

              <button 
                onClick={() => setIsFocusMode(false)}
                className="w-14 h-14 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex items-center justify-center transition-all border border-white/10"
              >
                <Minimize2 className="w-6 h-6" />
              </button>
            </div>

            {/* Timer Central */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative z-10 text-center"
            >
              <div className="text-[12rem] md:text-[18rem] font-black font-mono tracking-tighter tabular-nums leading-none mb-10 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 drop-shadow-2xl">
                {formatTime(seconds)}
              </div>

              <div className="flex items-center justify-center gap-8">
                <button 
                  onClick={() => setIsRunning(!isRunning)}
                  className={`w-28 h-28 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-2xl ${isRunning ? 'bg-amber-500' : 'bg-indigo-600'}`}
                >
                  {isRunning ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-2" />}
                </button>
                <button 
                  onClick={handleFinish}
                  className="w-28 h-28 bg-slate-800 text-white rounded-full flex items-center justify-center transition-all active:scale-90 shadow-xl border border-white/10"
                  title="Finalizar"
                >
                  <CheckSquare className="w-10 h-10" />
                </button>
                <button 
                  onClick={() => {
                    if (confirm("Deseja resetar o cronômetro?")) {
                      setSeconds(0);
                      setIsRunning(false);
                    }
                  }}
                  className="w-28 h-28 bg-rose-600 text-white rounded-full flex items-center justify-center transition-all active:scale-90 shadow-2xl border border-white/10"
                  title="Resetar"
                >
                  <X className="w-10 h-10" />
                </button>
              </div>
            </motion.div>

            <div className="absolute bottom-10 left-0 right-0 text-center z-10">
              <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Mantenha a constância e o foco total.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAINEL DE CONFIGURAÇÃO (ESTILO KEVQUEST) */}
      <AnimatePresence>
        {configOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-start justify-end p-4"
            onClick={() => setConfigOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] w-full max-w-sm h-[calc(100vh-2rem)] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-indigo-600" /> Ajustes de Entradas
                </h2>
                <button onClick={() => setConfigOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5"/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                
                {/* DISCIPLINAS */}
                <section>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4">Minhas Disciplinas</label>
                  <div className="space-y-2">
                    {cfgDisciplinas.map(d => (
                      <div key={d.id} className="group flex items-center gap-2">
                        <div className="flex-1 bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-all uppercase tracking-tight">
                          {d.nome}
                        </div>
                        <button 
                          onClick={() => {
                            if (confirm(`Excluir ${d.nome}? Isso removerá também os conteúdos associados.`)) {
                              setCfgDisciplinas(prev => prev.filter(x => x.id !== d.id));
                              setCfgConteudos(prev => {
                                const copy = { ...prev };
                                delete copy[d.id];
                                return copy;
                              });
                            }
                          }}
                          className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="pt-2 flex gap-2">
                      <input 
                        type="text" placeholder="Nome da Disciplina..." 
                        value={cfgInput.disciplina} 
                        onChange={e => setCfgInput({ ...cfgInput, disciplina: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && cfgInput.disciplina.trim()) {
                            const newId = Date.now().toString();
                            setCfgDisciplinas([...cfgDisciplinas, { id: newId, nome: cfgInput.disciplina }]);
                            setCfgInput({ ...cfgInput, disciplina: "" });
                            toast.success("Disciplina adicionada!");
                          }
                        }}
                        className="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-400 outline-none transition-all"
                      />
                      <button 
                        onClick={() => {
                          if (!cfgInput.disciplina.trim()) return;
                          const newId = Date.now().toString();
                          setCfgDisciplinas([...cfgDisciplinas, { id: newId, nome: cfgInput.disciplina }]);
                          setCfgInput({ ...cfgInput, disciplina: "" });
                          toast.success("Disciplina adicionada!");
                        }}
                        className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all transition-all"
                      >
                        <Plus className="w-5 h-5"/>
                      </button>
                    </div>
                  </div>
                </section>

                {/* CONTEÚDOS (DINÂMICO BASEADO NA DISCIPLINA SELECIONADA NO CONFIG) */}
                <section>
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4">Conteúdos por Disciplina</label>
                   <select 
                     className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-4 text-sm font-black mb-4 outline-none active:ring-2 ring-indigo-500 transition-all text-slate-800 dark:text-white"
                     onChange={(e) => setCfgInput({ ...cfgInput, conteudo: e.target.value })}
                     value={cfgInput.conteudo}
                   >
                     <option value="">Escolha uma disciplina...</option>
                     {cfgDisciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                   </select>

                   {cfgInput.conteudo && (
                     <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        {(cfgConteudos[cfgInput.conteudo] || []).map(c => (
                          <div key={c.id} className="flex items-center gap-2 group">
                            <div className="flex-1 bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 border border-transparent">
                              {c.nome}
                            </div>
                            <button 
                              onClick={() => {
                                setCfgConteudos(prev => ({
                                  ...prev,
                                  [cfgInput.conteudo]: prev[cfgInput.conteudo].filter(x => x.id !== c.id)
                                }));
                              }}
                              className="p-3 text-slate-300 hover:text-rose-500 rounded-xl"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <div className="pt-2 flex gap-2">
                          <input 
                            type="text" placeholder="Nome do Conteúdo..." 
                            className="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-400 outline-none transition-all"
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value;
                                if (!val.trim()) return;
                                setCfgConteudos(prev => ({
                                  ...prev,
                                  [cfgInput.conteudo]: [...(prev[cfgInput.conteudo] || []), { id: Date.now().toString(), nome: val }]
                                }));
                                (e.target as HTMLInputElement).value = "";
                                toast.success("Assunto adicionado!");
                              }
                            }}
                          />
                        </div>
                     </div>
                   )}
                </section>

              </div>

              <div className="p-8 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => setConfigOpen(false)}
                  className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all"
                >
                  Confirmar Ajustes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
