"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle, LayoutGrid, BarChart2, Activity, Send, AlertCircle, Book, Target, ChevronDown, ArrowDown, ArrowUp, Trash2, Pencil, X, Loader2, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { listarSimulados, marcarSimuladoAnalisado, type SimuladoDB } from "@/lib/db/simulados";
import { criarProblemaManual, listarProblemas, deletarProblema, atualizarProblema, type ProblemaEstudo, type TipoErro, TIPO_ERRO_COLORS, TIPO_ERRO_LABELS } from "@/lib/db/estudo";
import { getDisciplinasComConteudos, addConteudo, addSubConteudo, type Disciplina, type Conteudo } from "@/lib/db/disciplinas";

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl border border-slate-100 dark:border-[#2C2C2E] shadow-2xl">
        <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-3">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{TIPO_ERRO_LABELS[entry.dataKey as TipoErro]}</span>
              </div>
              <span className="text-xs font-black text-slate-800 dark:text-white">{entry.value}</span>
            </div>
          ))}
          <div className="pt-2 mt-2 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-8">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total</span>
            <span className="text-xs font-black text-indigo-500">{payload.reduce((acc: number, curr: any) => acc + curr.value, 0)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// --- CUSTOM DROPDOWN (Reusable) ---
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
  options: { value: string; label: string }[];
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
              {[...options].sort((a, b) => {
                if (a.value === "") return -1;
                if (b.value === "") return 1;
                return a.label.localeCompare(b.label);
              }).map((opt) => (
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
// --- FIM CUSTOM DROPDOWN ---


export default function KevQuestPage() {
  const [activeTab, setActiveTab] = useState<'simulados' | 'evolucao'>('simulados');
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState("");
  
  // Data
  const [simulados, setSimulados] = useState<SimuladoDB[]>([]);
  const [selectedSimulado, setSelectedSimulado] = useState<SimuladoDB | null>(null);
  const [questoesCadastradas, setQuestoesCadastradas] = useState<ProblemaEstudo[]>([]);
  const [disciplinas, setDisciplinas] = useState<(Disciplina & { conteudos: Conteudo[] })[]>([]);
  
  // Form State
  const [formErro, setFormErro] = useState({
    numQuestao: "",
    disciplinaId: "",
    conteudoId: "",
    subConteudo: "",
    tipoErro: "" as TipoErro | "",
    comentario: ""
  });
  const [editingErroId, setEditingErroId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit Error Modal State
  const [modalEditErro, setModalEditErro] = useState<{ open: boolean; prob: ProblemaEstudo | null }>({ open: false, prob: null });
  const [formEditErro, setFormEditErro] = useState({
    numQuestao: "",
    disciplinaId: "",
    conteudoId: "",
    subConteudo: "",
    tipoErro: "" as TipoErro | "",
    comentario: "",
    prova: "",
    ano: ""
  });
  
  // State Evolução
  const [filterProva, setFilterProva] = useState<string>("all");
  const [filterDisciplina, setFilterDisciplina] = useState<string>("all");
  const [filterErro, setFilterErro] = useState<string>("all");
  const [sortKey, setSortKey] = useState<string>('q_num');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedDiscForPie, setSelectedDiscForPie] = useState<string | null>(null);
  
  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [sims, probs, discips] = await Promise.all([
        listarSimulados(user.id),
        listarProblemas(user.id),
        getDisciplinasComConteudos()
      ]);
      
      setSimulados(sims);
      setQuestoesCadastradas(probs.filter(p => p.origem === 'kevquest' || (p.origem === 'simulado' && p.tipo_erro !== null)));
      setDisciplinas(discips);
      setIsLoaded(true);
    }
    init();
  }, []);

  const currentDisciplina = disciplinas.find(d => d.id === formErro.disciplinaId);
  const opcoesConteudo = currentDisciplina?.conteudos.map(c => ({ value: c.id, label: c.nome })) || [];

  const opcoesDisciplina = disciplinas
    .filter(d => {
      if (!selectedSimulado) return true;

      const titulo = selectedSimulado.titulo_simulado.toUpperCase();
      const modelo = selectedSimulado.modelo_prova;
      const isEnem = modelo === 'ENEM' || titulo.includes('ENEM');

      if (isEnem) {
        const isDia1 = titulo.includes('(DIA 1)');
        const isDia2 = titulo.includes('(DIA 2)');

        if (isDia1) {
          const permitidas = ["Português", "Inglês", "Artes", "História", "Geografia", "Filosofia", "Sociologia"];
          return permitidas.includes(d.nome);
        }
        if (isDia2) {
          const permitidas = ["Biologia", "Física", "Química", "Matemática"];
          return permitidas.includes(d.nome);
        }
      }

      // Se for um simulado de matéria específica (ex: "Simulado de Física")
      if (selectedSimulado.disciplina_id) {
        return d.id === selectedSimulado.disciplina_id;
      }

      return true;
    })
    .map(d => ({ value: d.id, label: d.nome }));

  const handleAddErro = async () => {
    if (!selectedSimulado) return toast.error("Selecione um simulado.");
    if (!formErro.numQuestao.trim()) return toast.error("Preencha o número da questão.");

    const qNum = parseInt(formErro.numQuestao);
    const isEnem = selectedSimulado.modelo_prova === 'ENEM' || (!selectedSimulado.modelo_prova && selectedSimulado.titulo_simulado.toUpperCase().includes('ENEM'));
    const isDia1 = selectedSimulado.titulo_simulado.includes('(Dia 1)');
    const isDia2 = selectedSimulado.titulo_simulado.includes('(Dia 2)');

    if (isEnem) {
      if (isDia1 && (qNum < 1 || qNum > 90)) {
        return toast.error("Questões do Dia 1 do ENEM vão de 1 a 90.");
      }
      if (isDia2 && (qNum < 91 || qNum > 180)) {
        return toast.error("Questões do Dia 2 do ENEM vão de 91 a 180.");
      }
    }

    if (!formErro.disciplinaId) return toast.error("Selecione a disciplina.");
    if (!formErro.conteudoId) return toast.error("Selecione o conteúdo.");
    if (!formErro.tipoErro) return toast.error("Selecione o tipo de erro.");

    setIsSaving(true);
    const discNome = currentDisciplina?.nome || "";
    const contNome = currentDisciplina?.conteudos.find(c => c.id === formErro.conteudoId)?.nome || "";
    
    const matchAno = selectedSimulado.titulo_simulado.match(/\b20\d{2}\b/);
    const anoStr = matchAno ? matchAno[0] : "";

    const titulo = `Q${formErro.numQuestao} - ${selectedSimulado.titulo_simulado}`;

    if (editingErroId) {
       const ok = await atualizarProblema(editingErroId, {
          q_num: formErro.numQuestao,
          disciplinaId: formErro.disciplinaId,
          disciplinaNome: discNome,
          conteudoId: formErro.conteudoId,
          conteudoNome: contNome,
          subConteudo: formErro.subConteudo || null,
          tipo_erro: formErro.tipoErro as TipoErro,
          comentario: formErro.comentario
       });
       if (ok) {
         toast.success("Erro atualizado com sucesso!");
         setQuestoesCadastradas(prev => prev.map(q => q.id === editingErroId ? {
            ...q,
            q_num: formErro.numQuestao,
            disciplina_id: formErro.disciplinaId,
            disciplina_nome: discNome,
            conteudo_id: formErro.conteudoId,
            conteudo_nome: contNome,
            sub_conteudo: formErro.subConteudo || null,
            tipo_erro: formErro.tipoErro as TipoErro,
            comentario: formErro.comentario
         } : q));
         setEditingErroId(null);
         setFormErro({
           numQuestao: "",
           disciplinaId: "",
           conteudoId: "",
           subConteudo: "",
           tipoErro: "",
           comentario: ""
         });
       } else {
         toast.error("Erro ao atualizar.");
       }
       setIsSaving(false);
       return;
    }

    const p = await criarProblemaManual({
      userId,
      titulo,
      agendadoPara: null,
      prioridade: 0,
      origem: 'kevquest',
      prova: selectedSimulado.modelo_prova,
      ano: anoStr,
      corProva: null,
      qNum: formErro.numQuestao,
      disciplinaId: formErro.disciplinaId,
      disciplinaNome: discNome,
      conteudoId: formErro.conteudoId,
      conteudoNome: contNome,
      subConteudo: formErro.subConteudo || null,
      tipoErro: formErro.tipoErro as TipoErro,
      comentario: formErro.comentario
    });

    if (p) {
      toast.success("Erro adicionado ao funil!");
      setQuestoesCadastradas(prev => [p, ...prev]);
      
      // Limpeza tática para acelerar inserção em lote:
      setFormErro(prev => ({
        ...prev,
        numQuestao: "",
        conteudoId: "", // reseta o assunto mas mantém a matéria
        subConteudo: "",
        comentario: ""
      }));
      // Focar de volta no input da questão seria ideal, mas já é um avanço.
    } else {
      toast.error("Erro ao adicionar no banco.");
    }
    setIsSaving(false);
  };

  const questoesDesteSimulado = selectedSimulado 
    ? questoesCadastradas.filter(q => q.titulo.includes(selectedSimulado.titulo_simulado))
    : [];

  const handleDeleteErro = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este erro?")) return;
    const ok = await deletarProblema(id);
    if (ok) {
      setQuestoesCadastradas(prev => prev.filter(q => q.id !== id));
      toast.success("Erro removido do histórico.");
    } else {
      toast.error("Erro ao remover.");
    }
  };

  const handleUpdateErro = async () => {
    if (!modalEditErro.prob) return;
    setIsSaving(true);
    
    const discSel = disciplinas.find(d => d.id === formEditErro.disciplinaId);
    const contSel = discSel?.conteudos.find(c => c.id === formEditErro.conteudoId);

    const ok = await atualizarProblema(modalEditErro.prob.id, {
      q_num: formEditErro.numQuestao,
      disciplinaId: formEditErro.disciplinaId,
      disciplinaNome: discSel?.nome || null,
      conteudoId: formEditErro.conteudoId,
      conteudoNome: contSel?.nome || null,
      subConteudo: formEditErro.subConteudo || null,
      tipo_erro: formEditErro.tipoErro as TipoErro,
      comentario: formEditErro.comentario,
      prova: formEditErro.prova || null,
      ano: formEditErro.ano || null,
      titulo: `Q${formEditErro.numQuestao} - ${formEditErro.prova} ${formEditErro.ano}`
    });

    if (ok) {
      toast.success("Erro atualizado!");
      setQuestoesCadastradas(prev => prev.map(q => q.id === modalEditErro.prob?.id ? {
        ...q,
        q_num: formEditErro.numQuestao,
        disciplina_id: formEditErro.disciplinaId,
        disciplina_nome: discSel?.nome || null,
        conteudo_id: formEditErro.conteudoId,
        conteudo_nome: contSel?.nome || null,
        sub_conteudo: formEditErro.sub_conteudo || null,
        tipo_erro: formEditErro.tipoErro as TipoErro,
        comentario: formEditErro.comentario,
        prova: formEditErro.prova,
        ano: formEditErro.ano,
        titulo: `Q${formEditErro.numQuestao} - ${formEditErro.prova} ${formEditErro.ano}`
      } : q));
      setModalEditErro({ open: false, prob: null });
    } else {
      toast.error("Erro ao atualizar.");
    }
    setIsSaving(false);
  };

  const handleConcluirAnalise = async () => {
    if (!selectedSimulado) return;
    const ok = await marcarSimuladoAnalisado(selectedSimulado.id, selectedSimulado.dados_modelo);
    if (ok) {
      toast.success("Análise do simulado concluída com sucesso!");
      setSimulados(prev => prev.map(s => s.id === selectedSimulado.id ? { ...s, dados_modelo: { ...s.dados_modelo, kevquest_analisado: true } } : s));
      setSelectedSimulado(null);
    } else {
      toast.error("Erro ao concluir análise.");
    }
  };

  const simuladosPendentes = simulados.filter(s => !s.dados_modelo?.kevquest_analisado);

  const questoesEvolucao = questoesCadastradas.filter(q => {
    const provaNome = q.prova || (q.titulo?.toUpperCase().includes('ENEM') ? 'ENEM' : (q.titulo?.toUpperCase().includes('FUVEST') ? 'FUVEST' : 'Outra'));
    if (filterProva !== 'all' && provaNome !== filterProva) return false;
    if (filterDisciplina !== 'all' && q.disciplina_nome !== filterDisciplina) return false;
    if (filterErro !== 'all' && q.tipo_erro !== filterErro) return false;
    return true;
  });

  const uniqueProvas = Array.from(new Set(questoesCadastradas.map(q => q.prova || (q.titulo?.toUpperCase().includes('ENEM') ? 'ENEM' : (q.titulo?.toUpperCase().includes('FUVEST') ? 'FUVEST' : 'Outra'))))).filter((v): v is string => Boolean(v));
  const uniqueDisciplinas = Array.from(new Set(questoesCadastradas.map(q => q.disciplina_nome))).filter((v): v is string => v !== null && v !== undefined);
  const uniqueTiposErro = Array.from(new Set(questoesCadastradas.map(q => q.tipo_erro))).filter((v): v is TipoErro => v !== null && v !== undefined);

  const sortedQuestoesEvolucao = [...questoesEvolucao].sort((a, b) => {
    let valA: string | number = a.created_at || "";
    let valB: string | number = b.created_at || "";

    if (sortKey === 'q_num') {
      valA = parseInt(a.q_num || "0");
      valB = parseInt(b.q_num || "0");
    } else if (sortKey === 'disciplina') {
      valA = a.disciplina_nome || "";
      valB = b.disciplina_nome || "";
    } else if (sortKey === 'erro') {
      valA = a.tipo_erro || "";
      valB = b.tipo_erro || "";
    } else if (sortKey === 'prova') {
      valA = a.titulo || "";
      valB = b.titulo || "";
    }

    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const chartData = uniqueDisciplinas.map(discName => {
    const relatedQuestões = questoesCadastradas.filter(q => 
      q.disciplina_nome === discName && 
      (filterProva === 'all' || (q.prova || (q.titulo?.toUpperCase().includes('ENEM') ? 'ENEM' : (q.titulo?.toUpperCase().includes('FUVEST') ? 'FUVEST' : 'Outra'))) === filterProva)
    );
    
    return {
      name: discName,
      teoria: relatedQuestões.filter(q => q.tipo_erro === 'teoria').length,
      pratica: relatedQuestões.filter(q => q.tipo_erro === 'pratica').length,
      desatencao: relatedQuestões.filter(q => q.tipo_erro === 'desatencao').length,
      total: relatedQuestões.length
    };
  }).filter(d => d.total > 0).sort((a, b) => b.total - a.total);

  // --- DADOS PARA O GRÁFICO DE PIZZA (DRILL-DOWN) ---
  const pieDataDisciplinas = uniqueDisciplinas.map(discName => {
    const count = questoesCadastradas.filter(q => q.disciplina_nome === discName).length;
    return { name: discName, value: count };
  }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  const pieDataConteudos = selectedDiscForPie 
    ? Array.from(new Set(questoesCadastradas
        .filter(q => q.disciplina_nome === selectedDiscForPie)
        .map(q => q.conteudo_nome || "Sem Conteúdo")))
        .map(contName => {
          const count = questoesCadastradas.filter(q => q.disciplina_nome === selectedDiscForPie && (q.conteudo_nome || "Sem Conteúdo") === contName).length;
          return { name: contName, value: count };
        }).filter(d => d.value > 0).sort((a, b) => b.value - a.value)
    : [];

  const activePieData = selectedDiscForPie ? pieDataConteudos : pieDataDisciplinas;
  const totalPie = activePieData.reduce((acc, curr) => acc + curr.value, 0);

  const PIE_COLORS = [
    '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#EF4444', 
    '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6'
  ];

  if (!isLoaded) return <div className="p-8 text-slate-400 font-bold animate-pulse">Carregando KevQuest...</div>;

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-20">
      
      {/* HEADER MINIMALISTA */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
            <div className="bg-[#1B2B5E] p-3 rounded-2xl shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            KevQuest
          </h1>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2 ml-1">
            Análise Qualitativa de Desempenho
          </p>
        </div>
      </header>

      {/* TABS CONTROLS */}
      <div className="bg-white dark:bg-[#1C1C1E] p-2 rounded-[2rem] flex items-center w-full border border-slate-100 dark:border-[#2C2C2E] shadow-sm mb-12">
        {(['simulados', 'evolucao'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-xs font-black rounded-[1.8rem] transition-all duration-300 uppercase tracking-[0.2em] flex items-center justify-center gap-3 ${
              activeTab === tab
                ? 'bg-[#1B2B5E] text-white shadow-xl'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
            }`}
          >
            {tab === 'simulados' ? <LayoutGrid className="w-4 h-4" /> : <BarChart2 className="w-4 h-4" />}
            {tab === 'simulados' ? 'Simulados' : 'Evolução'}
          </button>
        ))}
      </div>

      {/* ABA: SIMULADOS */}
      {activeTab === 'simulados' && (
        <section className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
          
          <div className="bg-white dark:bg-[#1C1C1E] border border-slate-100 dark:border-[#2C2C2E] shadow-sm rounded-[3rem] p-6 lg:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-2xl">
                <Target className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">Simulados Feitos</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Escolha um para analisar</p>
              </div>
            </div>

            {simuladosPendentes.length === 0 ? (
              <div className="bg-slate-50 dark:bg-[#2C2C2E] border-2 border-dashed border-slate-200 dark:border-[#3A3A3C] rounded-[2rem] p-10 flex flex-col items-center justify-center text-center gap-3">
                <Activity className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">Nenhum simulado pendente.</p>
                <p className="text-xs text-slate-400">Todos os simulados já foram analisados ou não há novos lançamentos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {simuladosPendentes.map(sim => {
                  const isSelected = selectedSimulado?.id === sim.id;
                  return (
                    <button
                      key={sim.id}
                      onClick={() => {
                        setSelectedSimulado(isSelected ? null : sim);
                        setFormErro({ numQuestao: "", disciplinaId: "", conteudoId: "", subConteudo: "", tipoErro: "", comentario: "" });
                      }}
                      className={`text-left p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                          : 'border-slate-100 dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] hover:border-slate-200 dark:hover:border-[#3A3A3C]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                          isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          <Book className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-black text-sm leading-tight truncate ${
                            isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-white'
                          }`}>{sim.titulo_simulado}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                            Acertos: {sim.acertos}/{sim.total_questoes}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* FORMULÁRIO DE ANÁLISE */}
          {selectedSimulado && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="lg:col-span-8 bg-white dark:bg-[#1C1C1E] border border-slate-100 dark:border-[#2C2C2E] rounded-[3rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-orange-500" />
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">Análise de Erro</h3>
                  </div>
                  <button 
                    onClick={handleConcluirAnalise}
                    className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-95 border border-emerald-200/50 dark:border-emerald-500/20"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Concluir Análise
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Linha 1 */}
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="sm:w-32">
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Nº Questão</label>
                      {(() => {
                        const isEnem = selectedSimulado?.modelo_prova === 'ENEM' || (!selectedSimulado?.modelo_prova && selectedSimulado?.titulo_simulado?.toUpperCase().includes('ENEM'));
                        const isDia1 = selectedSimulado?.titulo_simulado?.includes('(Dia 1)');
                        const isDia2 = selectedSimulado?.titulo_simulado?.includes('(Dia 2)');
                        
                        let min = 1;
                        let max = 200;
                        let placeholderText = "Ex: 45";
                        
                        if (isEnem) {
                          if (isDia1) { min = 1; max = 90; placeholderText = "1 a 90"; }
                          else if (isDia2) { min = 91; max = 180; placeholderText = "91 a 180"; }
                        }

                        return (
                          <input 
                            type="number"
                            min={min}
                            max={max}
                            placeholder={placeholderText}
                            value={formErro.numQuestao}
                            onChange={e => setFormErro({...formErro, numQuestao: e.target.value})}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) {
                                if (val < min) setFormErro({...formErro, numQuestao: min.toString()});
                                if (val > max) setFormErro({...formErro, numQuestao: max.toString()});
                              }
                            }}
                            className="w-full bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-center"
                          />
                        );
                      })()}
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Disciplina</label>
                      <CustomDropdown
                        value={formErro.disciplinaId}
                        onChange={(v) => setFormErro({...formErro, disciplinaId: v, conteudoId: ""})}
                        options={opcoesDisciplina}
                        placeholder="Selecione..."
                        className="bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Assunto/Conteúdo</label>
                      <CustomDropdown
                        value={formErro.conteudoId}
                        onChange={(v) => setFormErro({...formErro, conteudoId: v, subConteudo: ""})}
                        options={opcoesConteudo}
                        placeholder={formErro.disciplinaId ? "Selecione..." : "Escolha a matéria"}
                        disabled={!formErro.disciplinaId}
                        className="bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 dark:text-white"
                        onAddNewItem={async (val) => {
                          if (!formErro.disciplinaId) return;
                          const added = await addConteudo(formErro.disciplinaId, val);
                          if (added) {
                            setDisciplinas(prev => prev.map(d => {
                              if (d.id === formErro.disciplinaId) {
                                return { ...d, conteudos: [...d.conteudos, added] };
                              }
                              return d;
                            }));
                            setFormErro(prev => ({ ...prev, conteudoId: added.id, subConteudo: "" }));
                            toast.success('Novo conteúdo adicionado!');
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Sub-conteúdo</label>
                      <input 
                        type="text"
                        placeholder={formErro.conteudoId ? "Ex: Estática..." : "Escolha o conteúdo"}
                        disabled={!formErro.conteudoId}
                        value={formErro.subConteudo}
                        onChange={e => setFormErro({...formErro, subConteudo: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:font-medium placeholder:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Linha 2 - Tipo Erro */}
                  <div>
                    <label className="block text-[10px] font-black mb-3 text-slate-400 uppercase tracking-widest">Motivo do Erro</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(['teoria', 'pratica', 'desatencao'] as const).map(tipo => {
                        const isSel = formErro.tipoErro === tipo;
                        return (
                          <button
                            key={tipo}
                            onClick={() => setFormErro({...formErro, tipoErro: tipo})}
                            className={`p-4 rounded-2xl border-2 text-center transition-all ${
                              isSel ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-100 dark:border-[#2C2C2E] hover:border-slate-200 dark:hover:border-[#3A3A3C]'
                            }`}
                          >
                            <p className={`text-sm font-black uppercase tracking-wider ${
                              isSel ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
                            }`}>{TIPO_ERRO_LABELS[tipo]}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Linha 3 - Comentário */}
                  <div>
                    <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Anotação Rápida (Opcional)</label>
                    <textarea 
                      placeholder="Ex: Pegadinha na alternativa C. Revisar fórmula de Bhaskara."
                      value={formErro.comentario}
                      onChange={e => setFormErro({...formErro, comentario: e.target.value})}
                      className="w-full h-24 resize-none bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-medium text-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder-slate-400"
                    />
                  </div>

                  <div className="flex justify-end pt-4 gap-4">
                    {editingErroId && (
                       <button
                         onClick={() => {
                           setEditingErroId(null);
                           setFormErro({
                             numQuestao: "",
                             disciplinaId: "",
                             conteudoId: "",
                             subConteudo: "",
                             tipoErro: "",
                             comentario: ""
                           });
                         }}
                         className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black px-8 py-4 rounded-2xl text-sm uppercase tracking-widest transition-all active:scale-95"
                       >
                         Cancelar
                       </button>
                    )}
                    <button 
                      onClick={handleAddErro}
                      disabled={isSaving}
                      className="flex items-center gap-2 bg-[#1B2B5E] hover:bg-blue-900 text-white font-black px-8 py-4 rounded-2xl text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-900/20 disabled:opacity-50"
                    >
                      {isSaving ? (editingErroId ? "Salvando..." : "Injetando...") : (editingErroId ? "Salvar Alterações" : "Injetar no Funil")}
                      {!isSaving && <Send className="w-4 h-4 ml-2" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* BARRA LATERAL - QUESTÕES CADASTRADAS */}
              <div className="lg:col-span-4 bg-slate-50 dark:bg-[#2C2C2E]/30 border border-slate-100 dark:border-[#2C2C2E] rounded-[3rem] p-6 lg:p-8 flex flex-col h-[600px]">
                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-slate-400" />
                  No Funil ({questoesDesteSimulado.length})
                </h3>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                  {questoesDesteSimulado.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-50">
                      <AlertCircle className="w-8 h-8 text-slate-400 mb-3" />
                      <p className="text-xs font-bold text-slate-500">Nenhum erro analisado para este simulado ainda.</p>
                    </div>
                  ) : (
                    questoesDesteSimulado.map(q => (
                      <div 
                        key={q.id} 
                        onClick={() => {
                          setEditingErroId(q.id);
                          setFormErro({
                            numQuestao: q.q_num || "",
                            disciplinaId: q.disciplina_id || "",
                            conteudoId: q.conteudo_id || "",
                            subConteudo: q.sub_conteudo || "",
                            tipoErro: q.tipo_erro || "",
                            comentario: q.comentario || ""
                          });
                        }}
                        className={`cursor-pointer bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl shadow-sm border relative group transition-all ${editingErroId === q.id ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-100 dark:border-[#3A3A3C] hover:border-slate-200 dark:hover:border-slate-700'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-black text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">Q{q.q_num}</span>
                          <div className="flex items-center gap-2">
                            {q.tipo_erro ? (
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${TIPO_ERRO_COLORS[q.tipo_erro].bg} ${TIPO_ERRO_COLORS[q.tipo_erro].text}`}>
                                {TIPO_ERRO_LABELS[q.tipo_erro]}
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400 animate-pulse">PENDENTE</span>
                            )}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteErro(q.id);
                                }}
                                className="bg-rose-50 dark:bg-rose-500/10 text-rose-500 p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <p className={`text-xs font-bold truncate ${q.disciplina_nome ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 italic'}`}>{q.disciplina_nome || "Sem disciplina"}</p>
                        <p className={`text-[10px] truncate mt-0.5 ${q.conteudo_nome ? 'text-slate-400' : 'text-slate-400 italic'}`}>{q.conteudo_nome || "Sem conteúdo"}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}
        </section>
      )}

      {/* ABA: EVOLUÇÃO (WIP) */}
      {activeTab === 'evolucao' && (
        <section className="space-y-6 animate-in fade-in">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[3rem] border border-slate-100 dark:border-[#2C2C2E] p-6 lg:p-12 mb-8">
            
            {/* GRÁFICO DE PIZZA E RANKING */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 mb-24 items-start">
              
              {/* Lado Esquerdo: Pizza */}
              <div className="bg-slate-50 dark:bg-[#2C2C2E]/20 p-8 rounded-[2.5rem] border border-slate-100 dark:border-[#2C2C2E]">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-[#1C1C1E] p-2.5 rounded-xl shadow-sm">
                      <Activity className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                        {selectedDiscForPie ? `Erros: ${selectedDiscForPie}` : 'Foco por Disciplina'}
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Clique na fatia para detalhar</p>
                    </div>
                  </div>
                  {selectedDiscForPie && (
                    <button 
                      onClick={() => setSelectedDiscForPie(null)}
                      className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest bg-white dark:bg-[#1C1C1E] px-4 py-2 rounded-xl shadow-sm hover:scale-105 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Voltar
                    </button>
                  )}
                </div>

                <div className="h-[350px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        onClick={(data) => {
                          if (!selectedDiscForPie) {
                            setSelectedDiscForPie(data.name);
                          }
                        }}
                        className="cursor-pointer outline-none"
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {activePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const percent = ((data.value / totalPie) * 100).toFixed(1);
                            return (
                              <div className="bg-white dark:bg-[#1C1C1E] p-3 rounded-xl border border-slate-100 dark:border-[#2C2C2E] shadow-xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{data.name}</p>
                                <p className="text-sm font-black text-slate-800 dark:text-white">{data.value} erros ({percent}%)</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Centro da Pizza */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-800 dark:text-white">{totalPie}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Erros</span>
                  </div>
                </div>
              </div>

              {/* Lado Direito: Ranking */}
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 p-2.5 rounded-xl">
                    <Target className="w-5 h-5 text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                    {selectedDiscForPie ? `Assuntos mais falhos` : 'Disciplinas Críticas'}
                  </h3>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                  {activePieData.map((item, index) => {
                    const percent = ((item.value / totalPie) * 100).toFixed(1);
                    return (
                      <motion.div 
                        key={item.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => !selectedDiscForPie && setSelectedDiscForPie(item.name)}
                        className={`group flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          !selectedDiscForPie ? 'hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 shadow-sm' : 'cursor-default border-slate-50 dark:border-[#2C2C2E]'
                        } border-slate-50 dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E]`}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm" style={{ backgroundColor: `${PIE_COLORS[index % PIE_COLORS.length]}20`, color: PIE_COLORS[index % PIE_COLORS.length] }}>
                          {index + 1}º
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 dark:text-white truncate">{item.name}</p>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-800 dark:text-white">{item.value}</p>
                          <p className="text-[10px] font-bold text-slate-400">{percent}%</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* GRÁFICO DE DISTRIBUIÇÃO DE ERROS */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-10">
                <div className="bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-2xl">
                  <BarChart2 className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Distribuição de Erros</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Visão geral por disciplina e tipo de falha</p>
                </div>
              </div>

              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }}
                    />
                    <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="teoria" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} barSize={32} />
                    <Bar dataKey="pratica" stackId="a" fill="#F97316" radius={[0, 0, 0, 0]} barSize={32} />
                    <Bar dataKey="desatencao" stackId="a" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex flex-wrap justify-center gap-8 mt-6">
                {(['teoria', 'pratica', 'desatencao'] as const).map(tipo => (
                  <div key={tipo} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${tipo === 'teoria' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : tipo === 'pratica' ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">{TIPO_ERRO_LABELS[tipo]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between mb-8 gap-4 items-start md:items-center">
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Target className="w-6 h-6 text-indigo-500" />
                  Histórico de Erros
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gerencie os erros lançados nos simulados</p>
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-[#2C2C2E]/50 px-4 py-2 rounded-xl">
                {sortedQuestoesEvolucao.length} questões
              </div>
            </div>

            {/* TABELA DESKTOP */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-slate-50 dark:border-slate-800/50">
                    <th className="pb-4 px-4 w-20 align-top">
                      <button onClick={() => toggleSort('q_num')} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${sortKey === 'q_num' ? 'text-indigo-500' : 'text-slate-400'}`}>
                        Nº {sortKey === 'q_num' && (sortDir === 'desc' ? <ArrowDown className="w-3 h-3"/> : <ArrowUp className="w-3 h-3"/>)}
                      </button>
                    </th>
                    <th className="pb-4 px-4 align-top">
                      <div className="flex flex-col gap-2 items-start">
                        <button onClick={() => toggleSort('prova')} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${sortKey === 'prova' ? 'text-indigo-500' : 'text-slate-400'}`}>
                          Prova {sortKey === 'prova' && (sortDir === 'desc' ? <ArrowDown className="w-3 h-3"/> : <ArrowUp className="w-3 h-3"/>)}
                        </button>
                        <CustomDropdown
                          value={filterProva}
                          onChange={v => setFilterProva(v)}
                          options={[
                            { value: "all", label: "Todas" },
                            ...uniqueProvas.map(p => ({ value: p, label: p }))
                          ]}
                          placeholder="Todas"
                          className="text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none text-slate-600 dark:text-slate-300 w-full max-w-[120px] font-bold"
                          dropdownClasses="min-w-[150px]"
                        />
                      </div>
                    </th>
                    <th className="pb-4 px-4 align-top">
                      <div className="flex flex-col gap-2 items-start">
                        <button onClick={() => toggleSort('disciplina')} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${sortKey === 'disciplina' ? 'text-indigo-500' : 'text-slate-400'}`}>
                          Disciplina e Conteúdo {sortKey === 'disciplina' && (sortDir === 'desc' ? <ArrowDown className="w-3 h-3"/> : <ArrowUp className="w-3 h-3"/>)}
                        </button>
                        <CustomDropdown
                          value={filterDisciplina}
                          onChange={v => setFilterDisciplina(v)}
                          options={[
                            { value: "all", label: "Todas" },
                            ...uniqueDisciplinas.map(d => ({ value: d, label: d }))
                          ]}
                          placeholder="Todas"
                          className="text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none text-slate-600 dark:text-slate-300 w-full max-w-[150px] font-bold"
                          dropdownClasses="min-w-[180px]"
                        />
                      </div>
                    </th>
                    <th className="pb-4 px-4 align-top">
                      <div className="flex flex-col gap-2 items-start">
                        <button onClick={() => toggleSort('erro')} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${sortKey === 'erro' ? 'text-indigo-500' : 'text-slate-400'}`}>
                          Tipo de Erro {sortKey === 'erro' && (sortDir === 'desc' ? <ArrowDown className="w-3 h-3"/> : <ArrowUp className="w-3 h-3"/>)}
                        </button>
                        <CustomDropdown
                          value={filterErro}
                          onChange={v => setFilterErro(v)}
                          options={[
                            { value: "all", label: "Todos" },
                            ...uniqueTiposErro.map(t => ({ value: t, label: TIPO_ERRO_LABELS[t as TipoErro] }))
                          ]}
                          placeholder="Todos"
                          className="text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none text-slate-600 dark:text-slate-300 w-full max-w-[140px] font-bold"
                          dropdownClasses="min-w-[160px]"
                        />
                      </div>
                    </th>
                    <th className="pb-4 px-4 text-right align-top pt-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedQuestoesEvolucao.map(q => (
                    <tr key={q.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                      <td className="py-5 px-4 font-black text-slate-800 dark:text-white">Q{q.q_num}</td>
                      <td className="py-5 px-4 text-xs font-bold text-slate-600 dark:text-slate-400">{q.titulo}</td>
                      <td className="py-5 px-4">
                        <div className="font-bold text-slate-800 dark:text-white text-sm mb-1">{q.disciplina_nome}</div>
                        <div className="text-xs text-slate-400">{q.conteudo_nome}</div>
                        {q.comentario && <div className="text-xs text-indigo-500 dark:text-indigo-400 mt-2 italic font-medium">&quot;{q.comentario}&quot;</div>}
                      </td>
                      <td className="py-5 px-4">
                        {q.tipo_erro && (
                          <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg ${TIPO_ERRO_COLORS[q.tipo_erro].bg} ${TIPO_ERRO_COLORS[q.tipo_erro].text}`}>
                            {TIPO_ERRO_LABELS[q.tipo_erro]}
                          </span>
                        )}
                      </td>
                      <td className="py-5 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => {
                              setModalEditErro({ open: true, prob: q });
                              setFormEditErro({
                                numQuestao: q.q_num || "",
                                disciplinaId: q.disciplina_id || "",
                                conteudoId: q.conteudo_id || "",
                                subConteudo: q.sub_conteudo || "",
                                tipoErro: q.tipo_erro || "",
                                comentario: q.comentario || "",
                                prova: q.prova || "",
                                ano: q.ano || ""
                              });
                            }} 
                            className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                          >
                            <Pencil className="w-4 h-4"/>
                          </button>
                          <button onClick={() => handleDeleteErro(q.id)} className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors">
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sortedQuestoesEvolucao.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-bold text-sm">Nenhum erro registrado para este filtro.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* CARDS MOBILE */}
            <div className="md:hidden space-y-4">
              {sortedQuestoesEvolucao.map(q => (
                <div key={q.id} className="bg-slate-50 dark:bg-[#2C2C2E]/60 rounded-2xl p-4 border border-slate-100 dark:border-white/5 relative">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-black text-slate-800 dark:text-white bg-white dark:bg-slate-800 px-2 py-1 rounded-md shadow-sm border border-slate-100 dark:border-white/5">Q{q.q_num}</span>
                    {q.tipo_erro && (
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${TIPO_ERRO_COLORS[q.tipo_erro].bg} ${TIPO_ERRO_COLORS[q.tipo_erro].text}`}>
                        {TIPO_ERRO_LABELS[q.tipo_erro]}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-black uppercase text-indigo-500 mb-1">{q.titulo}</div>
                  <div className="font-bold text-slate-800 dark:text-white text-sm mb-1">{q.disciplina_nome}</div>
                  <div className="text-xs text-slate-400 mb-3">{q.conteudo_nome}</div>
                  {q.comentario && <div className="text-xs text-indigo-500 dark:text-indigo-400 mb-4 italic font-medium">&quot;{q.comentario}&quot;</div>}
                  
                  <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-white/5 gap-2">
                    <button 
                      onClick={() => {
                        setModalEditErro({ open: true, prob: q });
                        setFormEditErro({
                          numQuestao: q.q_num || "",
                          disciplinaId: q.disciplina_id || "",
                          conteudoId: q.conteudo_id || "",
                          subConteudo: q.sub_conteudo || "",
                          tipoErro: q.tipo_erro || "",
                          comentario: q.comentario || "",
                          prova: q.prova || "",
                          ano: q.ano || ""
                        });
                      }} 
                      className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl text-xs font-bold active:scale-95 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5"/> Editar
                    </button>
                    <button onClick={() => handleDeleteErro(q.id)} className="flex items-center gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl text-xs font-bold active:scale-95 transition-all">
                      <Trash2 className="w-3.5 h-3.5"/> Excluir
                    </button>
                  </div>
                </div>
              ))}
              {sortedQuestoesEvolucao.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm font-bold">Nenhum erro registrado para este filtro.</div>
              )}
            </div>

          </div>
        </section>
      )}

      {/* MODAL EDITAR ERRO */}
      <AnimatePresence>
        {modalEditErro.open && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <Pencil className="w-6 h-6 text-indigo-500" />
                    Editar Registro de Erro
                  </h2>
                  <button onClick={() => setModalEditErro({ open: false, prob: null })} className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Nº Questão</label>
                      <input 
                        type="number"
                        value={formEditErro.numQuestao}
                        onChange={e => setFormEditErro({...formEditErro, numQuestao: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all text-center"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-2">
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Prova</label>
                      <input 
                        type="text"
                        value={formEditErro.prova}
                        onChange={e => setFormEditErro({...formEditErro, prova: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all"
                        placeholder="Ex: ENEM"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Ano</label>
                      <input 
                        type="text"
                        value={formEditErro.ano}
                        onChange={e => setFormEditErro({...formEditErro, ano: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all text-center"
                        placeholder="Ex: 2023"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Disciplina</label>
                      <CustomDropdown
                        value={formEditErro.disciplinaId}
                        onChange={(v) => setFormEditErro({...formEditErro, disciplinaId: v, conteudoId: "", subConteudo: ""})}
                        options={disciplinas.map(d => ({ value: d.id, label: d.nome }))}
                        placeholder="Selecione..."
                        className="bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Conteúdo</label>
                      <CustomDropdown
                        value={formEditErro.conteudoId}
                        onChange={(v) => setFormEditErro({...formEditErro, conteudoId: v, subConteudo: ""})}
                        options={disciplinas.find(d => d.id === formEditErro.disciplinaId)?.conteudos.map(c => ({ value: c.id, label: c.nome })) || []}
                        placeholder={formEditErro.disciplinaId ? "Selecione..." : "Escolha a matéria"}
                        disabled={!formEditErro.disciplinaId}
                        className="bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 dark:text-white"
                      />
                    </div>
                     <div>
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Sub-conteúdo</label>
                      <input 
                        type="text"
                        placeholder={formEditErro.conteudoId ? "Ex: Estática..." : "Escolha o conteúdo"}
                        disabled={!formEditErro.conteudoId}
                        value={formEditErro.sub_conteudo}
                        onChange={e => setFormEditErro({...formEditErro, sub_conteudo: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:font-medium placeholder:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black mb-3 text-slate-400 uppercase tracking-widest">Motivo do Erro</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(['teoria', 'pratica', 'desatencao'] as const).map(tipo => {
                        const isSel = formEditErro.tipoErro === tipo;
                        return (
                          <button
                            key={tipo}
                            onClick={() => setFormEditErro({...formEditErro, tipoErro: tipo})}
                            className={`p-4 rounded-2xl border-2 text-center transition-all ${
                              isSel ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-100 dark:border-[#2C2C2E] hover:border-slate-200 dark:hover:border-[#3A3A3C]'
                            }`}
                          >
                            <p className={`text-sm font-black uppercase tracking-wider ${
                              isSel ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
                            }`}>{TIPO_ERRO_LABELS[tipo]}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Anotação Rápida</label>
                    <textarea 
                      placeholder="Ex: Pegadinha na alternativa C."
                      value={formEditErro.comentario}
                      onChange={e => setFormEditErro({...formEditErro, comentario: e.target.value})}
                      className="w-full h-24 resize-none bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-medium text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-10">
                  <button onClick={() => setModalEditErro({ open: false, prob: null })} className="flex-1 py-4 text-sm font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all uppercase tracking-widest">
                    Cancelar
                  </button>
                  <button onClick={handleUpdateErro} disabled={isSaving || !formEditErro.numQuestao} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-2xl shadow-xl shadow-indigo-600/20 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
