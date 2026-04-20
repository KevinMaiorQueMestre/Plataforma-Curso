"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { useState, useEffect, useMemo } from "react";
import {
  calcRefacaoDates,
  calcProximaRevisao,
  ESTAGIO_ORDER,
  ESTAGIO_COLORS,
  type EstagioFunil
} from "@/lib/kevquestLogic";
import { Plus, X, AlertTriangle, CheckCircle, Filter, ChevronRight, Edit2, Trash2, ChevronDown, Settings2, Loader2, BarChart2, SendToBack } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  listarKevQuestEntries,
  criarKevQuestEntry,
  atualizarEstagioEntry,
  deletarKevQuestEntry,
  enviarParaEstudo,
  type KevQuestEntry
} from "@/lib/db/kevquest";
import { getDisciplinas, getConteudos, addConteudo, type Disciplina, type Conteudo } from "@/lib/db/disciplinas";
import { getPreferences, updatePreferences } from "@/lib/db/preferences";
import { listarProblemas, criarProblemaManual, type ProblemaEstudo } from "@/lib/db/estudo";
import ModuleTarefasKevQuest from "@/components/tarefas/ModuleTarefasKevQuest";

function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = "",
  hasNewOption = false,
  dropdownClasses = "",
  onAddNewItem
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string; element?: React.ReactNode }[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
  hasNewOption?: boolean;
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
        className={`w-full text-left flex justify-between items-center outline-none ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="truncate">{selectedOpt ? selectedOpt.label : <span className="opacity-50">{placeholder}</span>}</span>
        <ChevronDown className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
             initial={{ opacity: 0, y: -5, scale: 0.98 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: -5, scale: 0.98 }}
             transition={{ duration: 0.15 }}
             className={`absolute z-50 w-full mt-2 bg-white dark:bg-[#1C1C1EE6] backdrop-blur-xl border-2 border-slate-200 dark:border-[#3A3A3C] rounded-xl shadow-2xl overflow-hidden ${dropdownClasses}`}
          >
             <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar flex flex-col gap-1">
                {onAddNewItem && (
                   isAdding ? (
                     <div className="flex gap-2 p-1 border border-indigo-200 dark:border-indigo-500/30 rounded-lg bg-indigo-50/50 dark:bg-indigo-500/10 mb-1">
                       <input 
                         autoFocus 
                         value={newVal} 
                         onChange={e => setNewVal(e.target.value)} 
                         onKeyDown={e => {
                           if (e.key === 'Enter') { e.preventDefault(); handleAddNew(); }
                         }} 
                         placeholder="Digite e Enter..." 
                         className="flex-1 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-slate-700/50 rounded-md px-2 py-1.5 text-sm outline-none w-full" 
                       />
                       <button onClick={handleAddNew} className="bg-indigo-600 text-white px-2 py-1 rounded-md text-xs font-bold active:scale-95 transition-all">OK</button>
                     </div>
                   ) : (
                     <button 
                       type="button" 
                       onClick={(e) => { e.stopPropagation(); setIsAdding(true); }} 
                       className="w-full text-left px-3 py-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm bg-indigo-50/50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg flex items-center gap-2 mb-1 border border-indigo-100 dark:border-transparent transition-colors"
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
                        if (value !== opt.value) {
                          onChange(opt.value);
                        }
                        setIsOpen(false);
                     }}
                     className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${value === opt.value ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-[#2C2C2E] text-slate-700 dark:text-slate-200'} ${opt.value === 'NOVO' ? 'text-indigo-600 dark:text-indigo-400 mt-1 border-t border-slate-100 dark:border-[#3A3A3C] pt-3 flex items-center gap-2' : ''}`}
                   >
                     {opt.element || opt.label}
                   </button>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function KevQuestPage() {
  const [modalOpen, setModalOpen]                 = useState(false);
  const [isLoaded, setIsLoaded]                   = useState(false);
  const [isSaving, setIsSaving]                   = useState(false);
  const [questoes, setQuestoes]                   = useState<any[]>([]);
  const [userId, setUserId]                       = useState<string | null>(null);
  const [activeStage, setActiveStage]             = useState<string>("Todos");
  const [editingId, setEditingId]                 = useState<string | null>(null);
  const [showFunnelFilters, setShowFunnelFilters] = useState(true);
  const [activeTab, setActiveTab]                 = useState<'tarefas' | 'kevquest' | 'evolucao'>('tarefas');
  const [isModalNovoOpen, setIsModalNovoOpen] = useState(false);
  const [isSavingTarefa, setIsSavingTarefa] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [formNovoTarefa, setFormNovoTarefa] = useState({ disciplina: '', conteudo: '', agendado_para: '', prioridade: 0 });

  const handleNovoTarefaKevQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await createClient().auth.getUser();
    if (!user || !formNovoTarefa.disciplina.trim() || !formNovoTarefa.conteudo.trim()) {
      toast.error("Disciplina e Conteúdo são obrigatórios!");
      return;
    }
    setIsSavingTarefa(true);
    
    const titulo = `KevQuest: ${formNovoTarefa.disciplina} - ${formNovoTarefa.conteudo}`.trim();

    const p = await criarProblemaManual({
      userId: user.id,
      titulo,
      agendadoPara: formNovoTarefa.agendado_para || null,
      prioridade: formNovoTarefa.prioridade,
      origem: 'kevquest'
    });
    if (p) {
      toast.success("Tarefa criada!");
      setIsModalNovoOpen(false);
      setFormNovoTarefa({ disciplina: '', conteudo: '', agendado_para: '', prioridade: 0 });
      setRefreshTrigger(prev => prev + 1);
    } else {
      toast.error("Erro ao criar tarefa.");
    }
    setIsSavingTarefa(false);
  };
  const [isSendingToEstudo, setIsSendingToEstudo] = useState<string | null>(null);

  // Modal Avaliação do Erro (Diagnóstico)
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [advancingId, setAdvancingId]           = useState<string | null>(null);
  const [motivoErro, setMotivoErro]             = useState("");
  const [tipoErro, setTipoErro]                 = useState<'teoria' | 'pratica' | 'desatencao' | ''>('');

  // Disciplinas e conteúdos do banco (usados nos dropdowns do modal)
  const [dbDisciplinas, setDbDisciplinas] = useState<Disciplina[]>([]);
  const [dbConteudos,   setDbConteudos]   = useState<Conteudo[]>([]);

  // Configurações editáveis dos dropdowns (ainda em localStorage)
  const [cfgProvas,  setCfgProvas]  = useState<string[]>([]);
  const [cfgCores,   setCfgCores]   = useState<string[]>([]);
  const [cfgMotivos, setCfgMotivos] = useState<string[]>([]);
  const [cfgAnos,    setCfgAnos]    = useState<string[]>([]);

  const [customConteudos, setCustomConteudos] = useState<Record<string, string[]>>({});
  const [isAddingConteudo, setIsAddingConteudo] = useState(false);
  const [newConteudoText,  setNewConteudoText]  = useState("");
  const [isAddingAno, setIsAddingAno]           = useState(false);
  const [newAnoText,  setNewAnoText]            = useState("");

  // Form State
  const [form, setForm] = useState({
    disciplinaId: "",
    disciplina: "",
    conteudoId: "",
    conteudo: "",
    sub_conteudo: "",
    q_num: "",
    prova: "",
    ano: "",
    cor: "",
    estagio: "Quarentena",
    comentario: ""
  });

  // Persistência de configurações (Provas/Cores/Motivos/Anos via global preferences)
  useEffect(() => {
    const loadPrefs = async () => {
      const prefs = await getPreferences();
      setCfgProvas(prefs.provas || []);
      setCfgCores(prefs.cores || []);
      setCfgAnos(prefs.anos || []);
      setCfgMotivos(prefs.motivos || []);
    };
    loadPrefs();
  }, []);

  // ── Carrega userId + entries do banco ──────────────────
  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Carrega disciplinas do banco
      const discs = await getDisciplinas();
      setDbDisciplinas(discs);

      // Carrega entries do funil do aluno
      const entries = await listarKevQuestEntries(user.id);
      // Mapeia para o formato interno da tabela
      setQuestoes(entries.map(mapEntryToRow));
      setIsLoaded(true);
    }
    init();
  }, []);

  // Quando disciplina muda no form, carrega conteúdos correspondentes
  useEffect(() => {
    if (!form.disciplinaId) { setDbConteudos([]); return; }
    getConteudos(form.disciplinaId).then(setDbConteudos);
  }, [form.disciplinaId]);

  // Mapeia um KevQuestEntry para o modelo de linha da tabela UI
  const mapEntryToRow = (e: KevQuestEntry) => ({
    id: e.id,
    data_resolucao: e.created_at,
    disciplinaId: e.disciplina_id,
    disciplina: (e.disciplinas as any)?.nome ?? "—",
    cor_hex: (e.disciplinas as any)?.cor_hex ?? null,
    conteudoId: e.conteudo_id,
    conteudo: (e.conteudos as any)?.nome ?? "—",
    sub_conteudo: e.sub_conteudo ?? "",
    estagio_funil: e.estagio_funil,
    proxima_revisao_at: e.proxima_revisao_at,
    comentario: e.comentario ?? "",
    prova: e.prova ?? "",
    ano: e.ano ?? "",
    cor: e.cor ?? "",
    q_num: e.q_num ?? "",
    tipo_erro: e.tipo_erro ?? null,
    // ref completa para enviarParaEstudo
    _raw: e,
  });

  const saveToStorage = (newList: any[]) => {
    setQuestoes(newList);
  };

  const openNewModal = () => {
    setEditingId(null);
    setForm({ disciplinaId: "", disciplina: "", conteudoId: "", conteudo: "", sub_conteudo: "", q_num: "", prova: "", ano: "", cor: "", estagio: "Quarentena", comentario: "" });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.disciplinaId || !form.estagio) {
      toast.error("Selecione a Matéria e o Estágio.");
      return;
    }
    if (!userId) { toast.error("Sessão expirada."); return; }

    setIsSaving(true);
    try {
      if (editingId) {
        const proximaRevisaoAt = calcProximaRevisao(form.estagio as EstagioFunil);
        const ok = await atualizarEstagioEntry(editingId, form.estagio as EstagioFunil, proximaRevisaoAt);
        if (ok) {
          const novaLista = questoes.map(q =>
            q.id === editingId
              ? { ...q, estagio_funil: form.estagio, proxima_revisao_at: proximaRevisaoAt }
              : q
          );
          saveToStorage(novaLista);
          toast.success("Questão atualizada!");
        }
      } else {
        const proximaRevisaoAt = calcProximaRevisao(form.estagio as EstagioFunil);
        const entry = await criarKevQuestEntry({
          userId,
          disciplinaId: form.disciplinaId,
          conteudoId: form.conteudoId || null,
          subConteudo: form.sub_conteudo || null,
          estagioFunil: form.estagio as EstagioFunil,
          proximaRevisaoAt,
          prova: form.prova || null,
          ano: form.ano || null,
          cor: form.cor || null,
          comentario: form.comentario || null,
          q_num: form.q_num || null,
        });
        if (entry) {
          saveToStorage([mapEntryToRow(entry), ...questoes]);
          toast.success("Questão injetada no KevQuest! 🎯");
        } else {
          toast.error("Erro ao salvar. Tente novamente.");
        }
      }
      setModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdvance = async (id: string, currentStage: string) => {
    if (currentStage === "Quarentena") {
      setAdvancingId(id);
      setMotivoErro("");
      setAdvanceModalOpen(true);
      return;
    }

    const sequence: Record<string, string | null> = {
      "Quarentena": "Diagnostico",
      "Diagnostico": "UTI",
      "UTI": "Refacao",
      "Refacao": "Consolidada",
      "Consolidada": null
    };
    const nextStage = sequence[currentStage] as EstagioFunil | null;
    if (!nextStage) return;

    const proximaRevisaoAt = calcProximaRevisao(nextStage);
    const ok = await atualizarEstagioEntry(id, nextStage, proximaRevisaoAt);
    if (!ok) { toast.error("Erro ao avançar estágio."); return; }

    const novaLista = questoes.map(q =>
      q.id === id ? { ...q, estagio_funil: nextStage, proxima_revisao_at: proximaRevisaoAt } : q
    );
    saveToStorage(novaLista);
    toast.success(`Estágio avançado para: ${nextStage}`);
  };

  const confirmAdvanceToDiagnostico = async () => {
    if (!advancingId) return;
    setIsSaving(true);
    try {
      const proximaRevisaoAt = calcProximaRevisao("Diagnostico");
      const ok = await atualizarEstagioEntry(
        advancingId,
        "Diagnostico",
        proximaRevisaoAt,
        motivoErro,
        tipoErro || undefined
      );
      if (ok) {
        const novaLista = questoes.map(q =>
          q.id === advancingId ? { 
            ...q, 
            estagio_funil: "Diagnostico", 
            proxima_revisao_at: proximaRevisaoAt, 
            comentario: motivoErro || q.comentario,
            tipo_erro: tipoErro || q.tipo_erro
          } : q
        );
        saveToStorage(novaLista);
        toast.success(`Diagnóstico registrado ✓`);
        setAdvanceModalOpen(false);
      } else {
        toast.error("Erro ao avançar estágio.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnviarParaEstudo = async (q: any) => {
    if (!userId) return;
    setIsSendingToEstudo(q.id);
    try {
      const ok = await enviarParaEstudo(q._raw, userId);
      if (ok) toast.success("Enviado para a fila de Estudo! 🎯");
      else toast.error("Erro ao enviar para Estudo.");
    } finally {
      setIsSendingToEstudo(null);
    }
  };

  const handleEdit = (q: any) => {
    setEditingId(q.id);
    setForm({
      disciplinaId: q.disciplinaId || "",
      disciplina: q.disciplina,
      conteudoId: q.conteudoId || "",
      conteudo: q.conteudo,
      sub_conteudo: q.sub_conteudo || "",
      q_num: q.q_num || "",
      prova: q.prova || "",
      ano: q.ano || "",
      cor: q.cor || "",
      estagio: q.estagio_funil || "Quarentena",
      comentario: q.comentario || ""
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este registro permanentemente?")) {
      const ok = await deletarKevQuestEntry(id);
      if (ok) {
        saveToStorage(questoes.filter(q => q.id !== id));
        toast.success("Registro Excluído");
      } else {
        toast.error("Erro ao excluir. Tente novamente.");
      }
    }
  };

  const filteredQuestoes = activeStage === "Todos" 
    ? questoes 
    : questoes.filter(q => q.estagio_funil === activeStage);

  const getTopFrequencies = (field: string) => {
    const counts: Record<string, number> = {};
    filteredQuestoes.forEach(q => {
      const val = q[field] || "Desconhecido";
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  };

  const topDisciplinas = useMemo(() => getTopFrequencies('disciplina'), [filteredQuestoes]);
  const topConteudos = useMemo(() => getTopFrequencies('conteudo'), [filteredQuestoes]);
  const topProvas = useMemo(() => getTopFrequencies('prova'), [filteredQuestoes]);

  const questoesHoje = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return questoes.filter(q => q.data_resolucao.startsWith(today)).length;
  }, [questoes]);

  const noFunil = useMemo(() => questoes.filter(q => q.estagio_funil !== "Consolidada").length, [questoes]);

  if (!isLoaded) return <div className="p-8">Carregando KevQuest...</div>;

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-20">
      
      <header className="flex justify-between items-end mb-6">
        <div className="relative">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#1B2B5E]/10 rounded-full blur-[100px] pointer-events-none"></div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4 relative z-10">
            <div className="bg-[#1B2B5E] p-3 rounded-[1.2rem] shadow-lg shadow-[#1B2B5E]/20">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            KevQuest
          </h1>
          <div className="flex items-center gap-3 mt-3 relative z-10">
            <div className="h-1 w-12 bg-[#F97316] rounded-full"></div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em]">Motor de Análise Qualitativa de Erros</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={openNewModal}
            className="flex items-center gap-2 bg-white dark:bg-[#1C1C1E] text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 font-black px-7 py-4 rounded-2xl text-sm uppercase tracking-widest transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-5 h-5 text-[#F97316]" />
            <span className="hidden sm:inline">Nova Questão</span>
          </button>
          <button 
            onClick={() => setIsModalNovoOpen(true)}
            className="flex items-center gap-2 bg-[#F97316] hover:bg-orange-600 text-white font-black px-7 py-4 rounded-2xl text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nova Tarefa</span>
          </button>
        </div>
      </header>

      {/* TAB CONTROLS */}
      <div className="bg-white dark:bg-[#1C1C1E] p-2 rounded-[2rem] flex items-center w-full border border-slate-100 dark:border-[#2C2C2E] shadow-sm mb-6">
        {(['tarefas', 'kevquest', 'evolucao'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-sm font-black rounded-[1.8rem] transition-all duration-200 uppercase tracking-[0.18em] ${
              activeTab === tab
                ? 'bg-[#1B2B5E] text-white shadow-lg shadow-[#1B2B5E]/20'
                : 'text-slate-400 dark:text-[#A1A1AA] hover:text-slate-600 dark:hover:text-white'
            }`}
          >
            {tab === 'tarefas' ? 'Tarefas' : tab === 'kevquest' ? 'KevQuest' : 'Evolução'}
          </button>
        ))}
      </div>

      {activeTab === 'tarefas' && (
        <ModuleTarefasKevQuest refreshTrigger={refreshTrigger} />
      )}

      {/* --- WIDGETS GLOBAIS --- */}
      {activeTab !== 'tarefas' && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-slate-100 dark:border-[#2C2C2E] shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-black text-slate-800 dark:text-[#FFFFFF] mb-2">{questoesHoje}</span>
          <span className="text-sm font-bold text-slate-500 dark:text-[#A1A1AA] uppercase tracking-wider">Lançadas Hoje</span>
        </div>
        
        <button 
          onClick={() => setShowFunnelFilters(!showFunnelFilters)}
          className={`rounded-3xl p-6 border-2 transition-all flex flex-col items-center justify-center text-center ${showFunnelFilters ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 shadow-inner' : 'bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-[#3A3A3C] shadow-lg hover:border-indigo-300 hover:shadow-indigo-500/20 hover:-translate-y-1'} active:scale-95`}
        >
          <span className={`text-4xl font-black mb-2 ${showFunnelFilters ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-[#FFFFFF]'}`}>{noFunil}</span>
          <span className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${showFunnelFilters ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-[#A1A1AA]'}`}>
            Passando pelo funil {showFunnelFilters ? <ChevronRight className="w-4 h-4 rotate-90 transition-transform" /> : <ChevronRight className="w-4 h-4 transition-transform" />}
          </span>
        </button>

        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-slate-100 dark:border-[#2C2C2E] shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-black text-slate-800 dark:text-[#FFFFFF] mb-2">{questoes.length}</span>
          <span className="text-sm font-bold text-slate-500 dark:text-[#A1A1AA] uppercase tracking-wider">Total Lançadas</span>
        </div>
      </section>
      )}

      {/* --- CARDS / FILTROS DO FUNIL --- */}
      {activeTab !== 'tarefas' && showFunnelFilters && (
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {ESTAGIO_ORDER.map(estagio => {
            const count = questoes.filter(q => q.estagio_funil === estagio).length;
            const colorCode = ESTAGIO_COLORS[estagio as keyof typeof ESTAGIO_COLORS];
            const isActive = activeStage === estagio;
            
            return (
              <button 
                key={estagio}
                onClick={() => setActiveStage(isActive ? "Todos" : estagio)}
                className={`flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all ${isActive ? 'bg-slate-50 dark:bg-[#2C2C2E] border-slate-300 shadow-inner' : 'bg-white dark:bg-[#1C1C1E] border-slate-100 dark:border-[#2C2C2E] shadow-sm hover:border-slate-200 dark:hover:border-[#3A3A3C] dark:hover:bg-[#2C2C2E]/50'} relative active:scale-95`}
              >
                <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center`} style={{ backgroundColor: colorCode + '20', color: colorCode }}>
                  {isActive && <Filter className="w-5 h-5 absolute top-3 right-3 text-slate-300" />}
                  <span className="font-black text-xl" style={{ color: colorCode }}>{count}</span>
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-[#F4F4F5] capitalize text-center leading-tight">{estagio}</span>
              </button>
            )
          })}
        </section>
      )}

      {/* --- SUB-DASHBOARD --- */}
      {activeTab !== 'tarefas' && activeStage !== "Todos" && (
        <section className="bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-3xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: ESTAGIO_COLORS[activeStage as keyof typeof ESTAGIO_COLORS] }}></div>
          
          <h2 className="text-lg font-black mb-6 flex items-center gap-2" style={{ color: ESTAGIO_COLORS[activeStage as keyof typeof ESTAGIO_COLORS] }}>
            <span className="capitalize">{activeStage}</span> Stats
            <span className="text-sm font-semibold text-slate-500 dark:text-[#A1A1AA] bg-white dark:bg-[#1C1C1E] px-2 py-0.5 rounded-full border border-slate-200 dark:border-[#3A3A3C] ml-2">{filteredQuestoes.length} questões</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 border border-slate-100 dark:border-[#2C2C2E] shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">Top Disciplinas</h3>
              {topDisciplinas.length === 0 ? <p className="text-sm text-slate-400">Nenhum dado</p> : (
                <ul className="space-y-3">
                  {topDisciplinas.map(([name, val], i) => (
                    <li key={name} className="flex justify-between items-center text-sm font-bold text-slate-700 dark:text-[#F4F4F5]">
                      <span>{i + 1}. {name}</span>
                      <span className="bg-slate-100 px-2 rounded-md text-slate-600">{val}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 border border-slate-100 dark:border-[#2C2C2E] shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">Top Conteúdos</h3>
              {topConteudos.length === 0 ? <p className="text-sm text-slate-400">Nenhum dado</p> : (
                <ul className="space-y-3">
                  {topConteudos.map(([name, val], i) => (
                    <li key={name} className="flex justify-between items-center text-sm font-bold text-slate-700 dark:text-[#F4F4F5]">
                      <span>{i + 1}. {name}</span>
                      <span className="bg-slate-100 px-2 rounded-md text-slate-600">{val}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}
      {activeTab === 'kevquest' && (
        <>
      <section className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
        <div className="flex justify-between items-center mb-6 px-2">
          <h2 className="text-lg font-bold text-slate-800 dark:text-[#FFFFFF]">
            {activeStage === "Todos" ? "Registro Geral (Todas Etapas)" : `Filtrado: ${activeStage}`}
          </h2>
        </div>

        <div className="overflow-x-auto hidden-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b-2 border-slate-50 dark:border-[#2C2C2E]">
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Data</th>
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Disciplina</th>
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Conteúdo</th>
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredQuestoes.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400 font-medium">Nenhuma questão encontrada.</td></tr>
              ) : (
                filteredQuestoes.map((q) => {
                  const cor = ESTAGIO_COLORS[q.estagio_funil as keyof typeof ESTAGIO_COLORS] || '#94a3b8';
                  return (
                    <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50 dark:border-[#2C2C2E] dark:hover:bg-[#2C2C2E] transition-colors group">
                      <td className="py-4 px-4 text-slate-400 font-medium">
                        {format(new Date(q.data_resolucao), "dd/MM/yy")}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-800 dark:text-[#FFFFFF] capitalize">{q.disciplina}</td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-700 dark:text-[#F4F4F5] block">{q.conteudo}</span>
                        {q.sub_conteudo && <span className="text-xs text-slate-400 block">{q.sub_conteudo}</span>}
                      </td>
                      <td className="py-4 px-4 text-right opacity-50 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-end gap-2">
                          {(q.estagio_funil === 'Refacao' || q.estagio_funil === 'Consolidada') && (
                            <button
                              onClick={() => handleEnviarParaEstudo(q)}
                              disabled={isSendingToEstudo === q.id}
                              title="Enviar para Estudo"
                              className="p-2 text-slate-400 hover:text-[#F97316] hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                            >
                              {isSendingToEstudo === q.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <SendToBack className="w-4 h-4" />}
                            </button>
                          )}
                          {q.estagio_funil !== "Consolidada" && (
                            <button onClick={() => handleAdvance(q.id, q.estagio_funil)} title="Avançar Estágio" className="p-2 text-slate-400 hover:text-[#1B2B5E] hover:bg-blue-50 dark:bg-blue-500/10 rounded-lg transition-colors">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleEdit(q)} title="Editar" className="p-2 text-slate-400 hover:text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:bg-amber-500/10 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(q.id)} title="Excluir" className="p-2 text-slate-400 hover:text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:bg-rose-500/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
      </>
      )}

      {/* TAB EVOLUÇÃO — gráfico Teoria/Prática/Desatenção por disciplina */}
      {activeTab === 'evolucao' && (() => {
        const disciplinasSet = Array.from(new Set(questoes.map(q => q.disciplina)));
        const chartData = disciplinasSet.map(disc => {
          const grupo = questoes.filter(q => q.disciplina === disc);
          return {
            disc,
            teoria:      grupo.filter(q => q.tipo_erro === 'teoria').length,
            pratica:     grupo.filter(q => q.tipo_erro === 'pratica').length,
            desatencao:  grupo.filter(q => q.tipo_erro === 'desatencao').length,
            total:       grupo.length,
          };
        }).filter(d => d.total > 0).sort((a,b) => b.total - a.total);

        const maxTotal = Math.max(...chartData.map(d => d.total), 1);

        return (
          <section className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
            <h2 className="text-lg font-black text-slate-800 dark:text-white mb-1">Erros por Disciplina</h2>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">Segmentado por tipo de erro</p>

            {/* Legenda */}
            <div className="flex gap-6 mb-8">
              {[['#3B82F6','Teoria'],['#F97316','Prática'],['#EF4444','Desatenção']].map(([cor, label]) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: cor}} />
                  <span className="text-xs font-bold text-slate-500">{label}</span>
                </div>
              ))}
            </div>

            {chartData.length === 0 ? (
              <div className="text-center py-16">
                <BarChart2 className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 font-bold text-sm">Registre questões com Diagnóstico para ver o gráfico.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {chartData.map(d => (
                  <div key={d.disc}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-black text-slate-700 dark:text-white capitalize">{d.disc}</span>
                      <span className="text-xs font-bold text-slate-400">{d.total} err{d.total === 1 ? 'o' : 'os'}</span>
                    </div>
                    <div className="flex h-8 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {d.teoria > 0 && (
                        <div
                          className="flex items-center justify-center text-white text-[10px] font-black transition-all"
                          style={{ width: `${(d.teoria / maxTotal) * 100}%`, backgroundColor: '#3B82F6' }}
                        >{d.teoria}</div>
                      )}
                      {d.pratica > 0 && (
                        <div
                          className="flex items-center justify-center text-white text-[10px] font-black transition-all"
                          style={{ width: `${(d.pratica / maxTotal) * 100}%`, backgroundColor: '#F97316' }}
                        >{d.pratica}</div>
                      )}
                      {d.desatencao > 0 && (
                        <div
                          className="flex items-center justify-center text-white text-[10px] font-black transition-all"
                          style={{ width: `${(d.desatencao / maxTotal) * 100}%`, backgroundColor: '#EF4444' }}
                        >{d.desatencao}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })()}

      {/* --- MODAL DE NOVA/EDITAR QUESTÃO --- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] w-full max-w-2xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-slate-100 dark:border-[#2C2C2E]">
              <h2 className="text-2xl font-black text-slate-800 dark:text-[#FFFFFF] flex items-center gap-3">
                {editingId ? "Editar Registro" : "Adicionar à Ficha"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto hidden-scrollbar">
              <div className="p-6 rounded-2xl border-2 transition-all duration-300 bg-slate-50 dark:bg-[#2C2C2E] border-slate-200 dark:border-[#3A3A3C]">
                <label className="block text-xs font-bold mb-3 uppercase tracking-wide text-slate-600 dark:text-[#A1A1AA]">Estágio de Triagem</label>
                <CustomDropdown 
                  value={form.estagio} onChange={v => setForm({...form, estagio: v})}
                  placeholder="Selecione um Estágio"
                  options={ESTAGIO_ORDER.map(est => ({ value: est, label: est }))}
                  className="border-2 rounded-xl px-4 py-3.5 text-sm font-bold bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-[#3A3A3C] text-slate-800 dark:text-[#FFFFFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Matéria</label>
                  <CustomDropdown
                    value={form.disciplinaId}
                    onChange={v => {
                      const disc = dbDisciplinas.find(d => d.id === v);
                      setForm({ ...form, disciplinaId: v, disciplina: disc?.nome ?? "", conteudoId: "", conteudo: "" });
                    }}
                    placeholder="Selecionar..."
                    options={dbDisciplinas.map(d => ({ value: d.id, label: d.nome }))}
                    className="border-2 rounded-xl px-4 py-3 text-sm font-bold bg-slate-50 dark:bg-[#2C2C2E] border-slate-200 dark:border-[#3A3A3C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Conteúdo</label>
                  <CustomDropdown
                      value={form.conteudoId}
                      onChange={v => {
                        const cont = dbConteudos.find(c => c.id === v);
                        setForm({ ...form, conteudoId: v, conteudo: cont?.nome ?? v });
                      }}
                      disabled={!form.disciplinaId}
                      placeholder="Selecionar..."
                      options={dbConteudos.map(c => ({ value: c.id, label: c.nome }))}
                      className="border-2 rounded-xl px-4 py-3 text-sm font-bold bg-slate-50 dark:bg-[#2C2C2E] border-slate-200 dark:border-[#3A3A3C]"
                      onAddNewItem={async (val) => {
                        if (!form.disciplinaId) return;
                        const added = await addConteudo(form.disciplinaId, val);
                        if (added) {
                          setDbConteudos(prev => [...prev, added]);
                          setForm({ ...form, conteudoId: added.id, conteudo: added.nome });
                          toast.success("Novo conteúdo salvo!");
                        }
                      }}
                    />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Num</label>
                  <input 
                    type="text" 
                    value={form.q_num} onChange={e => setForm({...form, q_num: e.target.value})}
                    placeholder="ex: 125"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-bold focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Prova</label>
                  <CustomDropdown 
                    value={form.prova} onChange={v => setForm({...form, prova: v})}
                    placeholder="Prova..."
                    options={cfgProvas.map(p => ({ value: p, label: p }))}
                    className="h-11 border-2 rounded-xl px-4 text-sm bg-slate-50 dark:bg-[#2C2C2E] border-slate-200 dark:border-[#3A3A3C]"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Ano</label>
                  <CustomDropdown 
                    value={form.ano} onChange={v => setForm({...form, ano: v})}
                    placeholder="Ano..."
                    options={cfgAnos.map(a => ({ value: a, label: a }))}
                    className="h-11 border-2 rounded-xl px-4 text-sm bg-slate-50 dark:bg-[#2C2C2E] border-slate-200 dark:border-[#3A3A3C]"
                    onAddNewItem={async (val) => {
                      const novas = [...cfgAnos, val];
                      setCfgAnos(novas);
                      await updatePreferences({ anos: novas });
                      setForm({...form, ano: val});
                      toast.success("Novo ano adicionado!");
                    }}
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Cor</label>
                  <CustomDropdown 
                    value={form.cor} onChange={v => setForm({...form, cor: v})}
                    placeholder="Cor..."
                    options={cfgCores.map(c => ({ value: c, label: c }))}
                    className="h-11 border-2 rounded-xl px-4 text-sm bg-slate-50 dark:bg-[#2C2C2E] border-slate-200 dark:border-[#3A3A3C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Comentários / Motivo do Erro</label>
                <textarea 
                  rows={3}
                  value={form.comentario}
                  onChange={e => setForm({...form, comentario: e.target.value})}
                  placeholder="Descreva o que errou ou observações importantes..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-medium focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="flex-[2] bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DIAGNÓSTICO (QUARENTENA -> DIAGNÓSTICO) --- */}
      {advanceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-[#2C2C2E]">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-[#2C2C2E]">
              <h2 className="text-xl font-black text-slate-800 dark:text-[#FFFFFF] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Diagnóstico de Erro
              </h2>
              <button onClick={() => setAdvanceModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-[#2C2C2E] rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm font-medium text-slate-600 dark:text-[#A1A1AA]">
                Classifique o motivo do erro para avançar ao diagnóstico.
              </p>

              {/* TIPO DE ERRO — obrigatório */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest">Tipo de Erro *</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'teoria',     label: 'Teoria',      desc: 'Não sabia o conteúdo', color: '#3B82F6' },
                    { value: 'pratica',    label: 'Prática',     desc: 'Sabia mas errou',       color: '#F97316' },
                    { value: 'desatencao', label: 'Desatenção',  desc: 'Erro bobo / leitura',  color: '#EF4444' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTipoErro(opt.value)}
                      className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all text-center ${
                        tipoErro === opt.value
                          ? 'border-transparent text-white shadow-lg scale-[1.03]'
                          : 'border-slate-200 dark:border-[#3A3A3C] text-slate-600 dark:text-slate-300 bg-white dark:bg-[#2C2C2E]'
                      }`}
                      style={tipoErro === opt.value ? { backgroundColor: opt.color } : {}}
                    >
                      <span className="text-xs font-black">{opt.label}</span>
                      <span className={`text-[9px] mt-1 leading-tight ${tipoErro === opt.value ? 'text-white/80' : 'text-slate-400'}`}>{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* MOTIVO LIVRE — opcional */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Motivo / Observação (opcional)</label>
                <CustomDropdown
                  value={motivoErro} onChange={v => setMotivoErro(v)}
                  placeholder="Selecione ou adicione..."
                  options={cfgMotivos.map(p => ({ value: p, label: p }))}
                  className="w-full h-12 border-2 rounded-xl px-4 text-sm bg-slate-50 dark:bg-[#2C2C2E] border-slate-200 dark:border-[#3A3A3C] text-slate-800 dark:text-[#FFFFFF]"
                  onAddNewItem={async (val) => {
                    const novas = [...cfgMotivos, val];
                    setCfgMotivos(novas);
                    await updatePreferences({ motivos: novas });
                    setMotivoErro(val);
                    toast.success("Novo motivo adicionado!");
                  }}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => { setAdvanceModalOpen(false); setTipoErro(''); }} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-[#2C2C2E] rounded-xl transition-colors">Cancelar</button>
                <button
                  type="button"
                  onClick={confirmAdvanceToDiagnostico}
                  disabled={isSaving || !tipoErro}
                  className="flex-1 bg-[#1B2B5E] disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all"
                >
                  {isSaving ? "Salvando..." : "Confirmar"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
      {/* Modal Nova Tarefa */}
      {isModalNovoOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] w-full max-w-md shadow-2xl p-8 animate-in fade-in zoom-in-95 relative">
            <button onClick={() => setIsModalNovoOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5"/></button>
            <h2 className="text-2xl font-black mb-6 text-slate-800 dark:text-white flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-[#1B2B5E]" />
              Nova Tarefa
            </h2>
            <form onSubmit={handleNovoTarefaKevQuest} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Disciplina *</label>
                  <input required autoFocus value={formNovoTarefa.disciplina} onChange={e => setFormNovoTarefa({...formNovoTarefa, disciplina: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 font-medium" placeholder="Ex: Matemática..." />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Conteúdo *</label>
                  <input required value={formNovoTarefa.conteudo} onChange={e => setFormNovoTarefa({...formNovoTarefa, conteudo: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 font-medium" placeholder="Ex: Geometria Plana..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Agendar para</label>
                  <input type="date" value={formNovoTarefa.agendado_para} onChange={e => setFormNovoTarefa({...formNovoTarefa, agendado_para: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Prioridade</label>
                  <select value={formNovoTarefa.prioridade} onChange={e => setFormNovoTarefa({...formNovoTarefa, prioridade: parseInt(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 font-medium">
                    <option value={0}>Normal</option>
                    <option value={1}>Urgente</option>
                  </select>
                </div>
              </div>
              <button disabled={isSavingTarefa} type="submit" className="w-full py-4 mt-4 bg-[#F97316] text-white text-sm font-black uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all">Salvar Tarefa</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
