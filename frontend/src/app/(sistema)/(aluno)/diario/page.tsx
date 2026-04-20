"use client";

import { useState, useEffect, useRef } from "react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { 
  BookOpen, Target, Plus, X, BarChart2, ChevronDown, Clock, Play, Pause, RotateCcw, 
  Filter, SortAsc, Users, Calendar, Book, PenTool, Layers, CheckSquare,
  ArrowUp, ArrowDown, ArrowUpDown, Maximize2, Minimize2, Edit2, Trash2, Settings2, Loader2,
  Star, Inbox, CheckCircle2, AlertCircle, Trash
} from "lucide-react";
import {
  listarProblemas, concluirProblema, criarProblemaManual, deletarProblema,
  type ProblemaEstudo, ORIGEM_LABELS, ORIGEM_COLORS, TIPO_ERRO_LABELS, TIPO_ERRO_COLORS
} from "@/lib/db/estudo";
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
  comentario?: string;
  conforto?: number;
  created_at: string;
  disciplinas?: Disciplina;
  conteudos?: Conteudo;
};
type KevQuestItem = {
  id: string;
  titulo: string;
  prova: string | null;
  ano: string | null;
  q_num: string | null;
  tipo_erro: string | null;
  disciplina_nome: string | null;
  conteudo_nome: string | null;
  status: string;
};
type RedacaoItem = {
  id: string;
  status: string;
  nota: number | null;
  tema_titulo: string | null;
  eixo_tematico: string | null;
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
  const [activeTab, setActiveTab] = useState<'atividades' | 'sessoes' | 'evolucao'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('diario_activeTab');
      if (saved === 'evolucao') return 'evolucao';
      if (saved === 'sessoes') return 'sessoes';
    }
    return 'atividades';
  });

  // --- PROBLEMAS DE ESTUDO ---
  const [problemas, setProblemas] = useState<ProblemaEstudo[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [modalConcluir, setModalConcluir] = useState<{ open: boolean; prob: ProblemaEstudo | null }>({
    open: false, prob: null,
  });
  const [modalNovo, setModalNovo] = useState(false);
  const [modalVincular, setModalVincular] = useState<{ open: boolean; tipo: 'kevquest' | 'redacao' | null }>({ open: false, tipo: null });
  const [vincularItems, setVincularItems] = useState<KevQuestItem[] | RedacaoItem[]>([]);
  const [vincularLoading, setVincularLoading] = useState(false);
  const [formVincular, setFormVincular] = useState({ itemId: '', comentario: '' });
  const [formConcluir, setFormConcluir] = useState({
    tempo: '',
    conforto: 0,
    questoesFeitas: '',
    acertos: '',
    revisoes: [] as number[], // dias para revisão
    comentario: '',
  });
  const [formNovo, setFormNovo] = useState({ disciplinaId: '', conteudoId: '', comentario: '' });
  const [isSavingProblema, setIsSavingProblema] = useState(false);

  // Timer State
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Filtros e Ordenação
  const [filterDisciplina, setFilterDisciplina] = useState("all");
  const [sortKey, setSortKey] = useState<'created_at' | 'performance' | 'conforto'>('created_at');
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
    tipoEstudo: "misto",
    comentario: "",
    conforto: 0
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const supabase = createClient();

  // Load Initial Data
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [discRes, contRes] = await Promise.all([
        supabase.from('disciplinas').select('*').order('nome'),
        supabase.from('conteudos').select('*').order('nome')
      ]);

      if (discRes.data) setDisciplinas(discRes.data);
      if (contRes.data) setConteudos(contRes.data);

      const [, probs] = await Promise.all([
        fetchSessions(),
        listarProblemas(user.id)
      ]);
      setProblemas(probs);
      setIsLoaded(true);
    };
    init();
  }, []);

  const refreshProblemas = async () => {
    if (!userId) return;
    setProblemas(await listarProblemas(userId));
  };

  const handleConcluirProblema = async () => {
    if (!modalConcluir.prob) return;
    setIsSavingProblema(true);
    const ok = await concluirProblema(
      modalConcluir.prob.id,
      {
        tempoMin: formConcluir.tempo ? parseInt(formConcluir.tempo) : null,
        conforto: formConcluir.conforto || null,
        questoesFeitas: formConcluir.questoesFeitas ? parseInt(formConcluir.questoesFeitas) : 0,
        acertos: formConcluir.acertos ? parseInt(formConcluir.acertos) : 0,
        comentario: formConcluir.comentario || null,
        revisoes: formConcluir.revisoes
      }
    );
    if (ok) {
      toast.success('Problema concluído!');
      await refreshProblemas();
      await fetchSessions();
      setModalConcluir({ open: false, prob: null });
      setFormConcluir({ tempo: '', conforto: 0, questoesFeitas: '', acertos: '', revisoes: [], comentario: '' });
    } else {
      toast.error('Erro ao concluir problema.');
    }
    setIsSavingProblema(false);
  };

  const handleNovoProblema = async () => {
    if (!userId || !formNovo.disciplinaId) return;
    setIsSavingProblema(true);
    const discSel = disciplinas.find(d => d.id === formNovo.disciplinaId);
    const contSel = conteudos.find(c => c.id === formNovo.conteudoId);
    const titulo = [discSel?.nome, contSel?.nome].filter(Boolean).join(' — ') || 'Estudo Manual';
    const novo = await criarProblemaManual({
      userId,
      titulo,
      disciplinaId: formNovo.disciplinaId || null,
      disciplinaNome: discSel?.nome ?? null,
      conteudoId: formNovo.conteudoId || null,
      conteudoNome: contSel?.nome ?? null,
      comentario: formNovo.comentario.trim() || null,
    });
    if (novo) {
      toast.success('Matéria registrada!');
      setProblemas(prev => [novo, ...prev]);
      setModalNovo(false);
      setFormNovo({ disciplinaId: '', conteudoId: '', comentario: '' });
    } else {
      toast.error('Erro ao registrar.');
    }
    setIsSavingProblema(false);
  };

  const abrirModalVincular = async (tipo: 'kevquest' | 'redacao') => {
    setModalVincular({ open: true, tipo });
    setFormVincular({ itemId: '', comentario: '' });
    setVincularItems([]);
    setVincularLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setVincularLoading(false); return; }

    if (tipo === 'kevquest') {
      const { data } = await supabase
        .from('problemas_estudo')
        .select(`id, titulo, prova, ano, q_num, tipo_erro, disciplina_nome, conteudo_nome, status`)
        .eq('user_id', user.id)
        .or('origem.eq.kevquest,and(origem.eq.simulado,tipo_erro.not.is.null)')
        .order('created_at', { ascending: false });
      if (data) {
        setVincularItems(data.map((d: any) => ({
          id: d.id,
          titulo: d.titulo,
          prova: d.prova,
          ano: d.ano,
          q_num: d.q_num,
          tipo_erro: d.tipo_erro,
          disciplina_nome: d.disciplina_nome,
          conteudo_nome: d.conteudo_nome,
          status: d.status,
        })) as KevQuestItem[]);
      }
    } else {
      const { data } = await supabase
        .from('redacoes_aluno')
        .select(`id, status, nota, temas_redacao(titulo, eixo_tematico)`)
        .eq('aluno_id', user.id)
        .in('status', ['ANALISADA', 'analisada'])
        .order('created_at', { ascending: false });
      if (data) {
        setVincularItems(data.map((d: any) => ({
          id: d.id,
          status: d.status,
          nota: d.nota,
          tema_titulo: d.temas_redacao?.titulo ?? null,
          eixo_tematico: d.temas_redacao?.eixo_tematico ?? null,
        })) as RedacaoItem[]);
      }
    }
    setVincularLoading(false);
  };

  const handleVincular = async () => {
    if (!userId || !formVincular.itemId || !modalVincular.tipo) return;
    setIsSavingProblema(true);

    let titulo = '';
    let origemRefId = formVincular.itemId;
    
    if (modalVincular.tipo === 'kevquest') {
      const item = (vincularItems as KevQuestItem[]).find(i => i.id === formVincular.itemId);
      if (item) {
        titulo = item.titulo || 'Questão KevQuest';
      }
    } else {
      const item = (vincularItems as RedacaoItem[]).find(i => i.id === formVincular.itemId);
      if (item) {
        titulo = item.tema_titulo || `Redação ${item.status}`;
      }
    }

    const novo = await criarProblemaManual({
      userId,
      origem: modalVincular.tipo,
      origemRefId,
      titulo,
      comentario: formVincular.comentario.trim() || null,
      agendadoPara: null,
      prioridade: 0,
    });
    if (novo) {
      toast.success('Vinculado com sucesso!');
      setProblemas(prev => [novo, ...prev]);
      setModalVincular({ open: false, tipo: null });
      setFormVincular({ itemId: '', comentario: '' });
      setVincularItems([]);
    } else {
      toast.error('Erro ao vincular.');
    }
    setIsSavingProblema(false);
  };

  const handleDeletarProblema = async (id: string) => {
    const ok = await deletarProblema(id);
    if (ok) {
      setProblemas(prev => prev.filter(p => p.id !== id));
      toast.success('Problema removido.');
    }
  };

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

    const { tipoEstudo, disciplinaId, conteudoId, tempoH, tempoM, questoesFeitas, acertos, comentario } = form;

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
      comentario: comentario.trim() || null,
      conforto: form.conforto > 0 ? form.conforto : null
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
      setForm({ data: format(new Date(), 'yyyy-MM-dd'), disciplinaId: "", conteudoId: "", questoesFeitas: "", acertos: "", tempoH: "", tempoM: "", tipoEstudo: "misto", comentario: "", conforto: 0 });
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
      tipoEstudo: e.tipo_estudo || "misto",
      comentario: e.comentario || "",
      conforto: e.conforto || 0
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

  const toggleSort = (key: 'created_at' | 'performance' | 'conforto') => {
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
      if (sortKey === 'conforto') {
        const valA = a.conforto || 0;
        const valB = b.conforto || 0;
        return (valA - valB) * dir;
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
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#1B2B5E]/10 rounded-full blur-[100px] pointer-events-none"></div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4 relative z-10">
            <div className="bg-[#1B2B5E] p-3 rounded-[1.2rem] shadow-lg shadow-[#1B2B5E]/20">
              <Layers className="w-8 h-8 text-white" />
            </div>
            Estudo
          </h1>
          <div className="flex items-center gap-3 mt-3 relative z-10">
            <div className="h-1 w-12 bg-[#F97316] rounded-full"></div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em]">Central de Problemas</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-8">
        
        {/* TAB CONTROLS */}
        <div className="bg-white dark:bg-[#1C1C1E] p-2 rounded-[2rem] flex items-center w-full border border-slate-100 dark:border-[#2C2C2E] shadow-sm mb-2">
          <button
            onClick={() => { setActiveTab('atividades'); localStorage.setItem('diario_activeTab', 'atividades'); }}
            className={`flex-1 py-4 text-sm font-black rounded-[1.8rem] transition-all duration-200 uppercase tracking-[0.18em] ${
              activeTab === 'atividades'
                ? 'bg-[#1B2B5E] text-white shadow-lg shadow-[#1B2B5E]/20'
                : 'text-slate-400 dark:text-[#A1A1AA] hover:text-slate-600 dark:hover:text-white'
            }`}
          >
            Atividades
          </button>
          <button
            onClick={() => { setActiveTab('sessoes'); localStorage.setItem('diario_activeTab', 'sessoes'); }}
            className={`flex-1 py-4 text-sm font-black rounded-[1.8rem] transition-all duration-200 uppercase tracking-[0.18em] ${
              activeTab === 'sessoes'
                ? 'bg-[#1B2B5E] text-white shadow-lg shadow-[#1B2B5E]/20'
                : 'text-slate-400 dark:text-[#A1A1AA] hover:text-slate-600 dark:hover:text-white'
            }`}
          >
            Sessões
          </button>
          <button
            onClick={() => { setActiveTab('evolucao'); localStorage.setItem('diario_activeTab', 'evolucao'); }}
            className={`flex-1 py-4 text-sm font-black rounded-[1.8rem] transition-all duration-200 uppercase tracking-[0.18em] ${
              activeTab === 'evolucao'
                ? 'bg-[#1B2B5E] text-white shadow-lg shadow-[#1B2B5E]/20'
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
        ) : activeTab === 'atividades' ? (
          (() => {
            const pendingKevquest = problemas.filter(p => p.status === 'pendente' && p.origem === 'kevquest' && !p.numero_revisao);
            const pendingRedacao = problemas.filter(p => p.status === 'pendente' && p.origem === 'redacao' && !p.numero_revisao);
            const pendingMaterias = problemas.filter(p => p.status === 'pendente' && p.origem === 'manual' && !p.numero_revisao);
            const concluidos = problemas.filter(p => p.status === 'concluido' && !p.numero_revisao).slice(0, 8);

            const ProblemaCard = ({ prob, showDate = true }: { prob: ProblemaEstudo; showDate?: boolean }) => {
              const cor = ORIGEM_COLORS[prob.origem];
              return (
                <div className={`bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 border transition-all hover:shadow-md flex flex-col justify-between h-full ${
                  prob.prioridade === 1
                    ? 'border-orange-200 dark:border-orange-500/30'
                    : 'border-slate-100 dark:border-[#2C2C2E]'
                }`}>
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${cor.bg} ${cor.text} ${cor.darkBg} ${cor.darkText}`}>
                          {ORIGEM_LABELS[prob.origem]}
                        </span>
                        {prob.prioridade === 1 && (
                          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                            Urgente
                          </span>
                        )}
                        {prob.tipo_erro && (
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                            TIPO_ERRO_COLORS[prob.tipo_erro].bg
                          } ${TIPO_ERRO_COLORS[prob.tipo_erro].text}`}>
                            {TIPO_ERRO_LABELS[prob.tipo_erro]}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeletarProblema(prob.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 flex-shrink-0 transition-colors"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="font-black text-slate-800 dark:text-white text-sm leading-snug mb-2">
                      {prob.titulo}
                    </p>
                    {(prob.prova || prob.ano || prob.q_num) && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400 dark:text-slate-500 mb-3">
                        {prob.prova && <span>{prob.prova}</span>}
                        {prob.ano && <span>· {prob.ano}</span>}
                        {prob.cor_prova && <span>· Cor {prob.cor_prova}</span>}
                        {prob.q_num && <span>· Q.{prob.q_num}</span>}
                      </div>
                    )}
                    {prob.comentario && (
                      <p className="text-xs text-slate-400 italic mb-3 line-clamp-2">"{prob.comentario}"</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    {showDate && prob.agendado_para ? (
                      <span className="text-[10px] text-slate-400">
                        Agendado: {new Date(prob.agendado_para + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    ) : <span />}
                    <button
                      onClick={() => { setModalConcluir({ open: true, prob: prob }); }}
                      className="flex items-center gap-1.5 bg-[#1B2B5E] hover:bg-blue-900 text-white text-xs font-black px-4 py-2 rounded-xl uppercase tracking-widest transition-all active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Concluir
                    </button>
                  </div>
                </div>
              );
            };

            return (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* 1. KevQuest */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                        Questões (KevQuest)
                      </h2>
                      <span className="text-xs font-black text-slate-400">({pendingKevquest.length})</span>
                    </div>
                    <button
                      onClick={() => abrirModalVincular('kevquest')}
                      className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95 border border-blue-100 dark:border-blue-900/30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Vincular</span>
                    </button>
                  </div>
                  {pendingKevquest.length === 0 ? (
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 border border-slate-100 dark:border-[#2C2C2E] text-center text-slate-400 text-sm font-medium">
                      Nenhuma questão pendente do KevQuest.
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {pendingKevquest.map(p => <ProblemaCard key={p.id} prob={p} />)}
                    </div>
                  )}
                </div>

                {/* 2. Redação */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <PenTool className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                        Lacunas de Redação
                      </h2>
                      <span className="text-xs font-black text-slate-400">({pendingRedacao.length})</span>
                    </div>
                    <button
                      onClick={() => abrirModalVincular('redacao')}
                      className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95 border border-orange-100 dark:border-orange-900/30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Vincular</span>
                    </button>
                  </div>
                  {pendingRedacao.length === 0 ? (
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 border border-slate-100 dark:border-[#2C2C2E] text-center text-slate-400 text-sm font-medium">
                      Nenhuma lacuna de redação pendente.
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {pendingRedacao.map(p => <ProblemaCard key={p.id} prob={p} />)}
                    </div>
                  )}
                </div>

                {/* 3. Matérias */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      </div>
                      <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                        Estudo de Matérias
                      </h2>
                      <span className="text-xs font-black text-slate-400">({pendingMaterias.length})</span>
                    </div>
                    <button
                      onClick={() => setModalNovo(true)}
                      className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95 shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Registrar Manual</span>
                    </button>
                  </div>
                  {pendingMaterias.length === 0 ? (
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 border border-slate-100 dark:border-[#2C2C2E] text-center text-slate-400 text-sm font-medium">
                      Nenhuma matéria adicionada para estudo.
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {pendingMaterias.map(p => <ProblemaCard key={p.id} prob={p} />)}
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 flex flex-col">
            {/* TIMER BOX */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
               <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">

                  {/* Timer display */}
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className={`relative w-14 h-14 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex-shrink-0 flex items-center justify-center border-2 transition-all duration-500 ${isRunning ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                      <Clock className={`w-6 h-6 md:w-8 md:h-8 ${isRunning ? 'text-indigo-400' : 'text-slate-500'}`} />
                      {isRunning && <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-indigo-500 rounded-[2rem] blur-xl -z-10" />}
                    </div>
                    <div className="flex flex-col flex-1">
                      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Fluxo de Estudo</h2>
                      <div className="flex items-baseline gap-1.5">
                        <div className={`text-4xl md:text-7xl font-black font-mono tracking-tighter ${isRunning ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-700'}`}>
                          {formatTime(seconds).split(':')[0]}:{formatTime(seconds).split(':')[1]}
                        </div>
                        <div className={`text-xl md:text-3xl font-black font-mono ${isRunning ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-700'}`}>
                          :{formatTime(seconds).split(':')[2]}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botões do timer */}
                  <div className="flex items-center gap-2 md:gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-white/5 w-full md:w-auto justify-between md:justify-start">
                    <div className="flex gap-2">
                      <button onClick={() => setIsRunning(!isRunning)} className={`w-12 h-12 md:w-16 md:h-16 rounded-[1.2rem] md:rounded-[1.5rem] flex items-center justify-center transition-all active:scale-95 ${isRunning ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'}`}>
                        {isRunning ? <Pause className="w-5 h-5 md:w-7 md:h-7 fill-current" /> : <Play className="w-5 h-5 md:w-7 md:h-7 fill-current ml-0.5" />}
                      </button>
                      <button onClick={handleFinish} className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 text-white rounded-[1.2rem] md:rounded-[1.5rem] flex items-center justify-center transition-all active:scale-95">
                        <CheckSquare className="w-5 h-5 md:w-7 md:h-7" />
                      </button>
                      <button onClick={() => { setSeconds(0); setIsRunning(false); }} className="w-12 h-12 md:w-16 md:h-16 bg-white dark:bg-slate-700/50 text-slate-400 hover:text-rose-500 rounded-xl md:rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/5 active:scale-95">
                        <X className="w-5 h-5 md:w-7 md:h-7" />
                      </button>
                    </div>
                    <div className="hidden sm:block w-px h-8 md:h-10 bg-slate-200 dark:bg-white/5 mx-1 md:mx-2"></div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setIsFocusMode(true)} className="w-11 h-11 md:w-14 md:h-14 bg-slate-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center active:scale-95 transition-all">
                        <Maximize2 className="w-5 h-5 md:w-6 md:h-6" />
                      </button>
                    </div>
                  </div>
               </div>
            </div>

            {/* HISTORICO */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
               <div className="flex flex-col md:flex-row justify-between mb-6 md:mb-8 gap-3 md:gap-4">
                  <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Histórico de Sessões</h2>
                  <div className="flex items-center gap-3 md:gap-4">
                     <CustomDropdown
                       value={filterDisciplina}
                       onChange={v => setFilterDisciplina(v)}
                       options={[
                         { value: 'all', label: 'Todas Disciplinas' },
                         ...disciplinas.map(d => ({ value: d.id, label: d.nome }))
                       ]}
                       placeholder="Todas Disciplinas"
                       className="min-w-0 w-full md:min-w-[180px] px-3 md:px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-black text-slate-600 dark:text-slate-300"
                       dropdownClasses="min-w-[200px]"
                     />
                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{filtered.length} sessões</div>
                  </div>
               </div>

               {/* TABELA — visível apenas em desktop */}
               <div className="hidden md:block overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="border-b-2 border-slate-50 dark:border-slate-800">
                        <th className="pb-4 px-4">
                          <button onClick={() => toggleSort('created_at')} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${sortKey === 'created_at' ? 'text-indigo-500' : 'text-slate-400'}`}>
                            Data {sortKey === 'created_at' && (sortDir === 'desc' ? <ArrowDown className="w-3 h-3"/> : <ArrowUp className="w-3 h-3"/>)}
                          </button>
                        </th>
                        <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Disciplina / Conteúdo</th>
                        <th className="pb-4 px-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <button onClick={() => toggleSort('performance')} className={`mx-auto flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest ${sortKey === 'performance' ? 'text-indigo-500' : 'text-slate-400'}`}>
                            Performance {sortKey === 'performance' && (sortDir === 'desc' ? <ArrowDown className="w-3 h-3"/> : <ArrowUp className="w-3 h-3"/>)}
                          </button>
                        </th>
                        <th className="pb-4 px-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <button onClick={() => toggleSort('conforto')} className={`mx-auto flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest ${sortKey === 'conforto' ? 'text-indigo-500' : 'text-slate-400'}`}>
                             Avaliação {sortKey === 'conforto' && (sortDir === 'desc' ? <ArrowDown className="w-3 h-3"/> : <ArrowUp className="w-3 h-3"/>)}
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
                              {e.comentario && <div className="text-xs text-indigo-500 dark:text-indigo-400 mt-2 font-medium italic">"{e.comentario}"</div>}
                           </td>
                           <td className="py-5 px-4 text-center">
                              <div className={`px-3 py-1 rounded-full text-[10px] font-black inline-block ${p >= 80 ? 'bg-emerald-100 text-emerald-600' : p >= 60 ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                                {p}% • {e.acertos}/{e.total_questoes}
                              </div>
                            </td>
                            <td className="py-5 px-4 text-center">
                               <div className="flex justify-center gap-0.5">
                                 {[1, 2, 3, 4, 5].map(n => (
                                   <Star key={n} className={`w-3 h-3 ${e.conforto && e.conforto >= n ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                                 ))}
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

               {/* CARDS — visível apenas em mobile */}
               <div className="md:hidden space-y-3">
                 {filtered.map(e => {
                   const p = e.total_questoes > 0 ? Math.round((e.acertos / e.total_questoes) * 100) : 0;
                   const h = (e.duracao_segundos / 3600).toFixed(1);
                   return (
                     <div key={e.id} className="bg-slate-50 dark:bg-[#2C2C2E]/60 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
                       <div className="flex items-start justify-between gap-2 mb-3">
                         <div className="flex-1 min-w-0">
                           <div className="font-black text-slate-800 dark:text-white text-sm">{format(new Date(e.created_at), "dd/MM - EEE", { locale: ptBR })}</div>
                           <div className="text-[10px] font-black uppercase text-indigo-500 mt-0.5 truncate">{e.tipo_estudo} • {h}h</div>
                         </div>
                         <div className={`px-2.5 py-1 rounded-full text-[10px] font-black flex-shrink-0 ${p >= 80 ? 'bg-emerald-100 text-emerald-600' : p >= 60 ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                           {p}%
                         </div>
                       </div>
                       <div className="flex items-center gap-2 mb-3 min-w-0">
                         <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.disciplinas?.cor_hex || '#ccc' }}></div>
                         <span className="font-bold text-slate-800 dark:text-white text-sm truncate flex-1">{e.disciplinas?.nome}</span>
                       </div>
                       {e.conteudos?.nome && (
                         <div className="text-xs text-slate-400 mb-3 pl-5 truncate" title={e.conteudos.nome}>{e.conteudos.nome}</div>
                       )}
                       {e.comentario && (
                         <div className="text-xs text-indigo-500 dark:text-indigo-400 mb-3 max-h-16 overflow-y-auto italic font-medium">"{e.comentario}"</div>
                       )}
                       <div className="flex items-center gap-3 mb-3">
                          <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(n => (
                                <Star key={n} className={`w-3 h-3 ${e.conforto && e.conforto >= n ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                              ))}
                           </div>
                           {e.total_questoes > 0 && (
                             <div className="text-xs text-slate-500">{e.acertos}/{e.total_questoes} acertos</div>
                           )}
                       </div>
                       {/* Ações sempre visíveis no mobile */}
                       <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                         <button onClick={() => handleEdit(e)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-bold active:scale-95 transition-all">
                           <Edit2 className="w-3.5 h-3.5"/> Editar
                         </button>
                         <button onClick={() => handleDelete(e.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold active:scale-95 transition-all">
                           <Trash2 className="w-3.5 h-3.5"/> Excluir
                         </button>
                       </div>
                     </div>
                   );
                 })}
                 {filtered.length === 0 && (
                   <div className="text-center py-10 text-slate-400 text-sm font-bold">Nenhuma sessão registrada ainda.</div>
                 )}
               </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL REGISTRO */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] md:rounded-[3rem] w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
                <button onClick={() => { setModalOpen(false); setEditingId(null); }} className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 z-10"><X /></button>
                <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar flex-1 w-full relative">
                  <h2 className="text-2xl font-black mb-8 text-slate-800 dark:text-white pr-8">{editingId ? "Editar Evolução" : "Registrar Evolução"}</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                     <div className="bg-slate-50 dark:bg-[#1C1C1E] p-2 rounded-[2rem] grid grid-cols-3 gap-2 border border-slate-200 dark:border-white/10">
                      {(['teorico', 'pratico', 'misto'] as const).map(t => (
                        <button key={t} type="button" onClick={() => setForm({...form, tipoEstudo: t})} className={`py-5 rounded-[1.5rem] flex flex-col items-center gap-3 transition-all duration-200 ${
                          form.tipoEstudo === t
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5'
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

                   <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase">Anotações / Comentário (Opcional)</label>
                      <textarea value={form.comentario} onChange={e => setForm({...form, comentario: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-medium outline-none border border-slate-200 dark:border-slate-700 focus:border-indigo-500 resize-none text-slate-800 dark:text-white" rows={3} placeholder="Escreva observações aqui..."></textarea>
                   </div>

                   <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase">Avaliação da Sessão</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, conforto: f.conforto === n ? 0 : n }))}
                            className={`flex-1 py-4 rounded-2xl text-sm font-black transition-all ${
                              form.conforto >= n
                                ? 'bg-amber-400 text-amber-950 shadow-lg shadow-amber-400/20'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-white/5'
                            }`}
                          >
                            {n}★
                          </button>
                        ))}
                      </div>
                   </div>

                   <button disabled={isSaving} type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2">
                     {isSaving ? <Loader2 className="animate-spin w-5 h-5"/> : <CheckSquare className="w-5 h-5"/>}
                     {editingId ? "Atualizar Registro" : "Finalizar e Salvar"}
                   </button>
                </form>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODO FOCO */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-6 md:p-10 text-white">
            <div className="absolute top-6 md:top-10 right-6 md:right-10 flex gap-4">
              <button onClick={() => setIsFocusMode(false)} className="w-12 h-12 md:w-14 md:h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 active:scale-95 transition-all"><Minimize2 className="w-5 h-5 md:w-6 md:h-6"/></button>
            </div>
            <div className="text-[5rem] sm:text-[8rem] md:text-[15rem] font-black font-mono tracking-tighter tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 leading-none">
              {formatTime(seconds)}
            </div>
            <div className="flex gap-5 md:gap-8 mt-8 md:mt-10">
               <button onClick={() => setIsRunning(!isRunning)} className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all ${isRunning ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                 {isRunning ? <Pause className="w-8 h-8 md:w-10 md:h-10 fill-current"/> : <Play className="w-8 h-8 md:w-10 md:h-10 fill-current ml-1"/>}
               </button>
               <button onClick={handleFinish} className="w-20 h-20 md:w-24 md:h-24 bg-white/10 rounded-full flex items-center justify-center border border-white/20 active:scale-90 transition-all"><CheckSquare className="w-8 h-8 md:w-10 md:h-10"/></button>
            </div>
            <p className="mt-10 md:mt-20 text-slate-500 font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] text-[10px] md:text-xs text-center">Mantenha a constância e o foco total.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL — CONCLUIR PROBLEMA */}
      <AnimatePresence>
        {modalConcluir.open && modalConcluir.prob && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white">Concluir Estudo</h2>
                  <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{modalConcluir.prob.titulo}</p>
                </div>
                <button onClick={() => setModalConcluir({ open: false, prob: null })} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"><X className="w-5 h-5"/></button>
              </div>

              <div className="space-y-6">
                {/* TEMPO */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Quanto tempo você estudou? (min)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      min="1"
                      value={formConcluir.tempo}
                      onChange={e => setFormConcluir(f => ({ ...f, tempo: e.target.value }))}
                      placeholder="Ex: 45"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold transition-all"
                    />
                  </div>
                </div>

                {/* REDAÇÃO: COMENTÁRIO */}
                {modalConcluir.prob.origem === 'redacao' ? (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Comentários / Observações</label>
                    <textarea
                      rows={3}
                      value={formConcluir.comentario}
                      onChange={e => setFormConcluir(f => ({ ...f, comentario: e.target.value }))}
                      placeholder="Quais pontos você focou nesta revisão?"
                      className="w-full px-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold transition-all resize-none"
                    />
                  </div>
                ) : (
                  /* KEVQUEST / MANUAL: QUESTÕES E ACERTOS */
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Nº Questões</label>
                      <input
                        type="number"
                        value={formConcluir.questoesFeitas}
                        onChange={e => setFormConcluir(f => ({ ...f, questoesFeitas: e.target.value }))}
                        placeholder="0"
                        className="w-full px-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Acertos</label>
                      <input
                        type="number"
                        value={formConcluir.acertos}
                        onChange={e => setFormConcluir(f => ({ ...f, acertos: e.target.value }))}
                        placeholder="0"
                        className="w-full px-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-center"
                      />
                    </div>
                  </div>
                )}

                {/* REVISÃO ESPAÇADA */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Agendar próximas revisões</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 7, 30, 'Outra'].map(days => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          if (days === 'Outra') {
                            const val = prompt('Em quantos dias você quer revisar?');
                            if (val && !isNaN(parseInt(val))) {
                              const d = parseInt(val);
                              setFormConcluir(f => ({
                                ...f,
                                revisoes: f.revisoes.includes(d) ? f.revisoes.filter(x => x !== d) : [...f.revisoes, d]
                              }));
                            }
                          } else {
                            const d = days as number;
                            setFormConcluir(f => ({
                              ...f,
                              revisoes: f.revisoes.includes(d) ? f.revisoes.filter(x => x !== d) : [...f.revisoes, d]
                            }));
                          }
                        }}
                        className={`py-3 rounded-xl text-[10px] font-black transition-all border ${
                          (days === 'Outra' ? false : formConcluir.revisoes.includes(days as number))
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        {days === 'Outra' ? 'Outra' : `D+${days}`}
                      </button>
                    ))}
                  </div>
                  {formConcluir.revisoes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                       {formConcluir.revisoes.map(r => (
                         <span key={r} className="text-[9px] bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">D+{r}</span>
                       ))}
                    </div>
                  )}
                </div>

                {/* CONFORTO */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Nível de segurança com o tema</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setFormConcluir(f => ({ ...f, conforto: f.conforto === n ? 0 : n }))}
                        className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${
                          formConcluir.conforto >= n
                            ? 'bg-amber-400 text-amber-950'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {n}★
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-10">
                <button
                  onClick={() => setModalConcluir({ open: false, prob: null })}
                  className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 font-black text-xs uppercase tracking-widest transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConcluirProblema}
                  disabled={isSavingProblema || !formConcluir.tempo}
                  className="flex-1 py-4 rounded-2xl bg-[#1B2B5E] text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60 shadow-xl shadow-[#1B2B5E]/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  {isSavingProblema ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Concluir Estudo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL — NOVO PROBLEMA MANUAL */}
      <AnimatePresence>
        {modalNovo && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] w-full max-w-sm shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-800 dark:text-white">Registrar Manual</h2>
                <button onClick={() => setModalNovo(false)} className="text-slate-400 hover:text-slate-700"><X /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Disciplina *</label>
                  <select
                    autoFocus
                    value={formNovo.disciplinaId}
                    onChange={e => setFormNovo(f => ({ ...f, disciplinaId: e.target.value, conteudoId: '' }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#1B2B5E]/20"
                  >
                    <option value="">Selecione a disciplina...</option>
                    {disciplinas.map(d => (
                      <option key={d.id} value={d.id}>{d.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Conteúdo (opcional)</label>
                  <select
                    value={formNovo.conteudoId}
                    onChange={e => setFormNovo(f => ({ ...f, conteudoId: e.target.value }))}
                    disabled={!formNovo.disciplinaId}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#1B2B5E]/20 disabled:opacity-40"
                  >
                    <option value="">Selecione o conteúdo...</option>
                    {conteudos
                      .filter(c => c.disciplina_id === formNovo.disciplinaId)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))
                    }
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Comentário (opcional)</label>
                  <textarea
                    rows={3}
                    value={formNovo.comentario}
                    onChange={e => setFormNovo(f => ({ ...f, comentario: e.target.value }))}
                    placeholder="Ex: Revisar fórmulas de área e volume..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#1B2B5E]/20 resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setModalNovo(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 font-black text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleNovoProblema}
                  disabled={isSavingProblema || !formNovo.disciplinaId}
                  className="flex-1 py-3 rounded-xl bg-slate-700 text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSavingProblema ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Registrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL — VINCULAR PROBLEMA */}
      <AnimatePresence>
        {modalVincular.open && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white">
                    {modalVincular.tipo === 'kevquest' ? '🎯 Vincular Questão' : '✍️ Vincular Redação'}
                  </h2>
                  <p className="text-xs text-slate-400 font-bold mt-1">
                    {modalVincular.tipo === 'kevquest'
                      ? 'Selecione uma questão do seu histórico KevQuest'
                      : 'Selecione uma redação analisada para estudar'}
                  </p>
                </div>
                <button
                  onClick={() => { setModalVincular({ open: false, tipo: null }); setVincularItems([]); }}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5"/>
                </button>
              </div>

              {/* Lista de itens */}
              <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1 custom-scrollbar">
                {vincularLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  </div>
                ) : vincularItems.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <p className="font-black text-sm">Nenhum item encontrado.</p>
                    <p className="text-xs mt-1">
                      {modalVincular.tipo === 'kevquest'
                        ? 'Adicione questões ao KevQuest primeiro.'
                        : 'Você precisa ter redações avaliadas ou devolvidas.'}
                    </p>
                  </div>
                ) : modalVincular.tipo === 'kevquest' ? (
                  (vincularItems as KevQuestItem[]).map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormVincular(f => ({ ...f, itemId: f.itemId === item.id ? '' : item.id }))}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                        formVincular.itemId === item.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-blue-200 dark:hover:border-blue-900/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm text-slate-800 dark:text-white truncate">
                            {item.titulo}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-slate-400">
                            {item.prova && <span>{item.prova}</span>}
                            {item.ano && <span>· {item.ano}</span>}
                            {item.q_num && <span>· Q.{item.q_num}</span>}
                          </div>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full flex-shrink-0 ${
                          item.status === 'concluido' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  (vincularItems as RedacaoItem[]).map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormVincular(f => ({ ...f, itemId: f.itemId === item.id ? '' : item.id }))}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                        formVincular.itemId === item.id
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-orange-200 dark:hover:border-orange-900/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm text-slate-800 dark:text-white truncate">
                            {item.tema_titulo || 'Redação sem tema'}
                          </p>
                          {item.eixo_tematico && (
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.eixo_tematico}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          {item.nota && (
                            <span className="text-xs font-black text-orange-600 dark:text-orange-400">{item.nota} pts</span>
                          )}
                          <span className={`block text-[9px] font-black uppercase px-2 py-1 rounded-full mt-1 ${
                            item.status === 'CONCLUIDA' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            item.status === 'DEVOLVIDA' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            item.status === 'ANALISADA' ? 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400' :
                            'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Campo de comentário */}
              {formVincular.itemId && (
                <div className="mt-4 flex-shrink-0">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Observação / Foco do estudo (opcional)</label>
                  <textarea
                    rows={2}
                    value={formVincular.comentario}
                    onChange={e => setFormVincular(f => ({ ...f, comentario: e.target.value }))}
                    placeholder="Ex: Revisar a teoria de fotossíntese, fui mal nesta questão por falta de conceito..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm transition-all resize-none"
                  />
                </div>
              )}

              {/* Footer */}
              <div className="flex gap-3 mt-6 flex-shrink-0">
                <button
                  onClick={() => { setModalVincular({ open: false, tipo: null }); setVincularItems([]); }}
                  className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleVincular}
                  disabled={isSavingProblema || !formVincular.itemId}
                  className={`flex-1 py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 shadow-xl transition-all hover:scale-[1.02] active:scale-95 ${
                    modalVincular.tipo === 'kevquest'
                      ? 'bg-blue-600 shadow-blue-600/20'
                      : 'bg-orange-500 shadow-orange-500/20'
                  }`}
                >
                  {isSavingProblema ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Adicionar à Fila
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

