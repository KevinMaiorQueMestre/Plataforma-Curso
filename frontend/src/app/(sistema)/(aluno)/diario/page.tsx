"use client";

import { useState, useEffect, useRef } from "react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { 
  BookOpen, Target, Plus, X, BarChart2, ChevronDown, Clock, Play, Pause, RotateCcw, 
  Filter, SortAsc, Users, Calendar, Book, PenTool, Layers, CheckSquare,
  ArrowUp, ArrowDown, ArrowUpDown, Maximize2, Minimize2, Edit2, Trash2, Settings2, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import SummaryCards from "@/components/dashboard/SummaryCards";
import EvolutionCharts from "@/components/dashboard/EvolutionCharts";
import { addConteudo } from "@/lib/db/disciplinas";

// --- TYPES ---
type Disciplina = { id: string; nome: string; cor_hex: string };
type Conteudo = { id: string; disciplina_id: string; nome: string };
type SessaoEstudo = {
  id: string;
  user_id: string;
  disciplina_id: string;
  conteudo_id: string;
  duracao_segundos: number;
  acertos: number;
  total_questoes: number;
  tipo_estudo: string;
  created_at: string;
  disciplinas?: Disciplina;
  conteudos?: Conteudo;
};

// --- CUSTOM DROPDOWN ---
function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = "",
  dropdownClasses = "",
  onAddNewItem
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string; element?: React.ReactNode }[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
  dropdownClasses?: string;
  onAddNewItem?: (val: string) => Promise<void> | void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newVal, setNewVal] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpenRef.current && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => o.value === value);

  const handleAddNew = async () => {
    if (!newVal.trim() || !onAddNewItem) return;
    await onAddNewItem(newVal.trim());
    setNewVal("");
    setIsAdding(false);
    setIsOpen(false);
  };

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
                {onAddNewItem && (
                   isAdding ? (
                     <div className="flex gap-2 p-1 border border-indigo-200 dark:border-indigo-500/30 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/10 mb-1">
                       <input 
                         autoFocus 
                         value={newVal} 
                         onChange={e => setNewVal(e.target.value)} 
                         onKeyDown={e => {
                           if (e.key === 'Enter') { e.preventDefault(); handleAddNew(); }
                         }} 
                         placeholder="Digite e aperte Enter..." 
                         className="flex-1 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-slate-700/50 rounded-lg px-2 py-2 text-sm outline-none w-full shadow-inner" 
                       />
                       <button onClick={handleAddNew} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">OK</button>
                     </div>
                   ) : (
                     <button 
                       type="button" 
                       onClick={(e) => { e.stopPropagation(); setIsAdding(true); }} 
                       className="w-full text-left px-3 py-2.5 text-indigo-600 dark:text-indigo-400 font-black text-sm bg-indigo-50/50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl flex items-center gap-2 mb-1 border border-indigo-100 dark:border-transparent transition-all shadow-sm"
                     >
                       <span className="text-lg leading-none">+</span> Adicionar Outro
                     </button>
                   )
                )}
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
  const [estudos, setEstudos] = useState<SessaoEstudo[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sessoes' | 'evolucao'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('diario_activeTab');
      if (saved === 'evolucao') return 'evolucao';
    }
    return 'sessoes';
  });

  // Timer State
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Filtros e Ordenação
  const [filterDisciplina, setFilterDisciplina] = useState("all");
  const [sortKey, setSortKey] = useState<'created_at' | 'performance'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
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
    tipoEstudo: "misto"
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const supabase = createClient();

  // Load Initial Data
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Disciplinas e Conteúdos
      const [discRes, contRes] = await Promise.all([
        supabase.from('disciplinas').select('*').order('nome'),
        supabase.from('conteudos').select('*').order('nome')
      ]);

      if (discRes.data) setDisciplinas(discRes.data);
      if (contRes.data) setConteudos(contRes.data);

      await fetchSessions();
      setIsLoaded(true);
    }
    init();
  }, []);

  const fetchSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('sessoes_estudo')
      .select(`
        *,
        disciplinas (id, nome, cor_hex),
        conteudos (id, nome)
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (data) setEstudos(data as any);
  };

  // --- TIMER LOGIC ---
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const { tipoEstudo, disciplinaId, conteudoId, tempoH, tempoM, questoesFeitas, acertos } = form;

    if (!disciplinaId || !conteudoId || (!tempoH && !tempoM && seconds === 0)) {
      toast.error("Preencha Disciplina, Conteúdo e Tempo.");
      return;
    }

    setIsSaving(true);
    const totalSegundos = editingId 
      ? (parseInt(tempoH) || 0) * 3600 + (parseInt(tempoM) || 0) * 60
      : (parseInt(tempoH) || 0) * 3600 + (parseInt(tempoM) || 0) * 60 + seconds;
      
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      user_id: user?.id,
      disciplina_id: disciplinaId,
      conteudo_id: conteudoId,
      duracao_segundos: totalSegundos,
      acertos: parseInt(acertos) || 0,
      total_questoes: parseInt(questoesFeitas) || 0,
      tipo_estudo: tipoEstudo,
    };

    let error;
    if (editingId) {
      const res = await supabase.from('sessoes_estudo').update(payload).eq('id', editingId);
      error = res.error;
    } else {
      const res = await supabase.from('sessoes_estudo').insert([payload]);
      error = res.error;
    }

    if (error) {
      toast.error("Erro ao salvar sessão de estudo.");
    } else {
      toast.success(editingId ? "Estudo atualizado!" : "Estudo registrado!");
      setModalOpen(false);
      setEditingId(null);
      setSeconds(0);
      setForm({ data: format(new Date(), 'yyyy-MM-dd'), disciplinaId: "", conteudoId: "", questoesFeitas: "", acertos: "", tempoH: "", tempoM: "", tipoEstudo: "misto" });
      await fetchSessions();
    }
    setIsSaving(false);
  };

  const handleEdit = (e: SessaoEstudo) => {
    setEditingId(e.id);
    const h = Math.floor(e.duracao_segundos / 3600);
    const m = Math.floor((e.duracao_segundos % 3600) / 60);
    setForm({
      data: e.created_at,
      disciplinaId: e.disciplina_id,
      conteudoId: e.conteudo_id,
      questoesFeitas: (e.total_questoes || 0).toString(),
      acertos: (e.acertos || 0).toString(),
      tempoH: h.toString(),
      tempoM: m.toString(),
      tipoEstudo: e.tipo_estudo || "misto"
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta sessão?")) {
      const { error } = await supabase.from('sessoes_estudo').delete().eq('id', id);
      if (error) {
        toast.error("Erro ao remover sessão.");
      } else {
        toast.success("Sessão removida!");
        await fetchSessions();
      }
    }
  };

  const toggleSort = (key: 'created_at' | 'performance') => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = estudos
    .filter(e => filterDisciplina === "all" || e.disciplina_id === filterDisciplina)
    .sort((a, b) => {
      const dir = sortDir === 'desc' ? -1 : 1;
      if (sortKey === 'created_at') {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      }
      const pA = a.total_questoes > 0 ? a.acertos / a.total_questoes : 0;
      const pB = b.total_questoes > 0 ? b.acertos / b.total_questoes : 0;
      return (pA - pB) * dir;
    });

  if (!isLoaded) return (
    <div className="h-[80vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500 px-4 md:px-0">
      
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
      </header>

      <div className="flex flex-col gap-8">
        
        {/* TAB CONTROLS */}
        <div className="bg-white dark:bg-[#1C1C1E] p-2 rounded-[2rem] flex items-center w-full border border-slate-100 dark:border-[#2C2C2E] shadow-sm mb-2">
          <button
            onClick={() => { setActiveTab('sessoes'); localStorage.setItem('diario_activeTab', 'sessoes'); }}
            className={`flex-1 py-4 text-sm font-black rounded-[1.8rem] transition-all duration-200 uppercase tracking-[0.18em] ${
              activeTab === 'sessoes'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 dark:text-[#A1A1AA] hover:text-slate-600 dark:hover:text-white'
            }`}
          >
            Sessões de Estudo
          </button>
          <button
            onClick={() => { setActiveTab('evolucao'); localStorage.setItem('diario_activeTab', 'evolucao'); }}
            className={`flex-1 py-4 text-sm font-black rounded-[1.8rem] transition-all duration-200 uppercase tracking-[0.18em] ${
              activeTab === 'evolucao'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 dark:text-[#A1A1AA] hover:text-slate-600 dark:hover:text-white'
            }`}
          >
            Evolução
          </button>
        </div>

        {activeTab === 'evolucao' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
             <SummaryCards />
             <EvolutionCharts />
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500 flex flex-col">
            {/* TIMER BOX */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
               <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                <div className={`relative w-20 h-20 rounded-[2rem] flex items-center justify-center border-2 transition-all duration-500 ${isRunning ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                  <Clock className={`w-8 h-8 ${isRunning ? 'text-indigo-400' : 'text-slate-500'}`} />
                  {isRunning && <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-indigo-500 rounded-[2rem] blur-xl -z-10" />}
                </div>
                <div className="flex flex-col">
                   <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em] mb-1">Fluxo de Estudo</h2>
                   <div className="flex items-baseline gap-2">
                      <div className={`text-7xl font-black font-mono tracking-tighter ${isRunning ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-700'}`}>
                        {formatTime(seconds).split(':')[0]}:{formatTime(seconds).split(':')[1]}
                      </div>
                      <div className={`text-3xl font-black font-mono ${isRunning ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-700'}`}>
                        :{formatTime(seconds).split(':')[2]}
                      </div>
                   </div>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[2rem] border border-slate-200 dark:border-white/5">
                 <div className="flex gap-2">
                    <button onClick={() => setIsRunning(!isRunning)} className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all ${isRunning ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'}`}>
                      {isRunning ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
                    </button>
                    <button onClick={handleFinish} className="w-16 h-16 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center transition-all">
                      <CheckSquare className="w-7 h-7" />
                    </button>
                    <button onClick={() => { setSeconds(0); setIsRunning(false); }} className="w-16 h-16 bg-white dark:bg-slate-700/50 text-slate-400 hover:text-rose-500 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/5">
                      <X className="w-7 h-7" />
                    </button>
                 </div>
                 <div className="hidden sm:block w-px h-10 bg-slate-200 dark:bg-white/5 mx-2"></div>
                 <button onClick={() => { setIsRunning(false); setModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-4 rounded-2xl text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                   <Plus className="w-4 h-4" /> Registro Manual
                 </button>
                 <button onClick={() => setIsFocusMode(true)} className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                   <Maximize2 className="w-6 h-6" />
                 </button>
              </div>
           </div>
        </div>

        {/* HISTORICO */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
           <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
              <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Meu Progresso Histórico</h2>
              <div className="flex items-center gap-4">
                 <CustomDropdown
                   value={filterDisciplina}
                   onChange={v => setFilterDisciplina(v)}
                   options={[
                     { value: 'all', label: 'Todas Disciplinas' },
                     ...disciplinas.map(d => ({ value: d.id, label: d.nome }))
                   ]}
                   placeholder="Todas Disciplinas"
                   className="min-w-[180px] px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-black text-slate-600 dark:text-slate-300"
                   dropdownClasses="min-w-[200px]"
                 />
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filtered.length} sessões</div>
              </div>
           </div>

           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b-2 border-slate-50 dark:border-slate-800">
                    <th className="pb-4 px-4">
                      <button onClick={() => toggleSort('created_at')} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${sortKey === 'created_at' ? 'text-indigo-500' : 'text-slate-400'}`}>
                        Data {sortKey === 'created_at' && (sortDir === 'desc' ? <ArrowDown className="w-3 h-3"/> : <ArrowUp className="w-3 h-3"/>)}
                      </button>
                    </th>
                    <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Disciplina / Conteúdo</th>
                    <th className="pb-4 px-4 text-center">
                      <button onClick={() => toggleSort('performance')} className={`flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest ${sortKey === 'performance' ? 'text-indigo-500' : 'text-slate-400'}`}>
                        Performance {sortKey === 'performance' && (sortDir === 'desc' ? <ArrowDown className="w-3 h-3"/> : <ArrowUp className="w-3 h-3"/>)}
                      </button>
                    </th>
                    <th className="pb-4 px-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                 </tr>
               </thead>
               <tbody>
                 {filtered.map(e => {
                   const p = e.total_questoes > 0 ? Math.round((e.acertos / e.total_questoes) * 100) : 0;
                   const h = (e.duracao_segundos / 3600).toFixed(1);
                   return (
                     <tr key={e.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                       <td className="py-5 px-4">
                          <div className="font-black text-slate-800 dark:text-white">{format(new Date(e.created_at), "dd/MM - EEEE", { locale: ptBR })}</div>
                          <div className="text-[10px] font-black uppercase text-indigo-500">{e.tipo_estudo} • {h}h dedicada</div>
                       </td>
                       <td className="py-5 px-4 font-bold">
                          <div className="text-slate-800 dark:text-white flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.disciplinas?.cor_hex || '#ccc' }}></div>
                            {e.disciplinas?.nome}
                          </div>
                          <div className="text-xs text-slate-400 ml-4">{e.conteudos?.nome}</div>
                       </td>
                       <td className="py-5 px-4 text-center">
                          <div className={`px-3 py-1 rounded-full text-[10px] font-black inline-block ${p >= 80 ? 'bg-emerald-100 text-emerald-600' : p >= 60 ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                            {p}% • {e.acertos}/{e.total_questoes}
                          </div>
                        </td>
                       <td className="py-5 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center justify-end gap-1">
                             <button onClick={() => handleEdit(e)} className="p-2 text-slate-400 hover:text-amber-500"><Edit2 className="w-4 h-4"/></button>
                             <button onClick={() => handleDelete(e.id)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4"/></button>
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
        )}
      </div>

      {/* MODAL REGISTRO */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-[#1C1C1E] rounded-[3rem] w-full max-w-md p-10 shadow-2xl relative">
                <button onClick={() => { setModalOpen(false); setEditingId(null); }} className="absolute top-8 right-8 text-slate-400 hover:text-slate-800"><X /></button>
                <h2 className="text-2xl font-black mb-8 text-slate-800 dark:text-white">{editingId ? "Editar Evolução" : "Registrar Evolução"}</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="bg-[#1C1C1E] p-2 rounded-[2rem] grid grid-cols-3 gap-2 border border-white/10">
                      {(['teorico', 'pratico', 'misto'] as const).map(t => (
                        <button key={t} type="button" onClick={() => setForm({...form, tipoEstudo: t})} className={`py-5 rounded-[1.5rem] flex flex-col items-center gap-3 transition-all duration-200 ${
                          form.tipoEstudo === t
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}>
                           {t === 'teorico' ? <Book className="w-7 h-7"/> : t === 'pratico' ? <PenTool className="w-7 h-7"/> : <Layers className="w-7 h-7"/>}
                           <span className="text-[10px] font-black uppercase tracking-widest">{t}</span>
                        </button>
                      ))}
                   </div>

                   <CustomDropdown 
                    value={form.disciplinaId} 
                    onChange={v => setForm({...form, disciplinaId: v, conteudoId: ""})} 
                    options={disciplinas.map(d => ({value: d.id, label: d.nome}))} 
                    placeholder="Selecione a Disciplina" 
                    className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold" 
                   />
                   
                    <CustomDropdown 
                     disabled={!form.disciplinaId} 
                     value={form.conteudoId} 
                     onChange={v => setForm({...form, conteudoId: v})} 
                     options={conteudos.filter(c => c.disciplina_id === form.disciplinaId).map(c => ({value: c.id, label: c.nome}))} 
                     placeholder="Selecione o Conteúdo" 
                     className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold" 
                     onAddNewItem={async (val) => {
                        if (!form.disciplinaId) return;
                        const added = await addConteudo(form.disciplinaId, val);
                        if (added) {
                          setConteudos(prev => [...prev, added]);
                          setForm({ ...form, conteudoId: added.id });
                          toast.success("Novo conteúdo salvo!");
                        }
                     }}
                    />

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

                   {form.tipoEstudo !== 'teorico' && (
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-400 uppercase">Questões</label>
                           <input type="number" value={form.questoesFeitas} onChange={e => setForm({...form, questoesFeitas: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-xl font-black text-center outline-none" placeholder="0"/>
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-400 uppercase">Acertos</label>
                           <input type="number" value={form.acertos} onChange={e => setForm({...form, acertos: e.target.value})} className="w-full bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl text-xl font-black text-center outline-none text-emerald-600" placeholder="0"/>
                        </div>
                     </div>
                   )}

                   <button disabled={isSaving} type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2">
                     {isSaving ? <Loader2 className="animate-spin w-5 h-5"/> : <CheckSquare className="w-5 h-5"/>}
                     {editingId ? "Atualizar Registro" : "Finalizar e Salvar"}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODO FOCO */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-10 text-white">
            <div className="absolute top-10 right-10 flex gap-4">
              <button onClick={() => setIsFocusMode(false)} className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10"><Minimize2/></button>
            </div>
            <div className="text-[15rem] font-black font-mono tracking-tighter tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">
              {formatTime(seconds)}
            </div>
            <div className="flex gap-8 mt-10">
               <button onClick={() => setIsRunning(!isRunning)} className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl ${isRunning ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                 {isRunning ? <Pause className="w-10 h-10 fill-current"/> : <Play className="w-10 h-10 fill-current ml-2"/>}
               </button>
               <button onClick={handleFinish} className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center border border-white/20"><CheckSquare className="w-10 h-10"/></button>
            </div>
            <p className="mt-20 text-slate-500 font-bold uppercase tracking-[0.4em] text-xs">Mantenha a constância e o foco total.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
