"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { useState, useEffect, useMemo } from "react";
import { 
  calcRefacaoDates, 
  ESTAGIO_ORDER,
  ESTAGIO_COLORS
} from "@/lib/kevquestLogic";
import { Plus, X, AlertTriangle, CheckCircle, Flame, Filter, ChevronRight, Edit2, Trash2, ChevronDown, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";

function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = "",
  hasNewOption = false,
  dropdownClasses = ""
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string; element?: React.ReactNode }[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
  hasNewOption?: boolean;
  dropdownClasses?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpenRef.current && containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
  const [modalOpen, setModalOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [questoes, setQuestoes] = useState<any[]>([]);
  const [activeStage, setActiveStage] = useState<string>("Todos");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showFunnelFilters, setShowFunnelFilters] = useState(true);

  // Configurações editáveis dos dropdowns
  const [cfgDisciplinas, setCfgDisciplinas] = useState<string[]>(["Matemática", "Física", "Biologia", "Química", "História", "Geografia", "Português", "Inglês"]);
  const [cfgProvas, setCfgProvas] = useState<string[]>(["ENEM 2023", "ENEM 2022", "FUVEST 2024", "UNICAMP 2024", "Simulado Hexag"]);
  const [cfgCores, setCfgCores] = useState<string[]>(["Azul", "Amarela", "Rosa", "Branca", "Cinza", "Verde"]);
  const [cfgMotivos, setCfgMotivos] = useState<string[]>(["Falta de Atenção", "Não sabia a matéria", "Falta de tempo", "Interpretação", "Cálculo Básico"]);
  const [cfgInput, setCfgInput] = useState({ disciplina: "", prova: "", cor: "", conteudo: "", ano: "", motivo: "" });
  
  // Custom Input States
  const [customConteudos, setCustomConteudos] = useState<Record<string, string[]>>({
    "Matemática": ["Geometria", "Álgebra", "Funções"],
    "Física": ["Mecânica", "Termodinâmica", "Eletromagnetismo"],
    "Biologia": ["Citologia", "Ecologia", "Genética"]
  });
  const [cfgAnos, setCfgAnos] = useState<string[]>(["2024", "2023", "2022", "2021", "2020", "2019", "2018"]);
  
  // Persistência das configurações
  useEffect(() => {
    const savedCfg = localStorage.getItem('kevquest_config');
    if (savedCfg) {
      const parsed = JSON.parse(savedCfg);
      if (parsed.disciplinas) setCfgDisciplinas(parsed.disciplinas);
      if (parsed.provas) setCfgProvas(parsed.provas);
      if (parsed.cores) setCfgCores(parsed.cores);
      if (parsed.conteudos) setCustomConteudos(parsed.conteudos);
      if (parsed.anos) setCfgAnos(parsed.anos);
      if (parsed.motivos) setCfgMotivos(parsed.motivos);
    }
  }, []);

  useEffect(() => {
    const config = {
      disciplinas: cfgDisciplinas,
      provas: cfgProvas,
      cores: cfgCores,
      conteudos: customConteudos,
      anos: cfgAnos,
      motivos: cfgMotivos
    };
    localStorage.setItem('kevquest_config', JSON.stringify(config));
  }, [cfgDisciplinas, cfgProvas, cfgCores, customConteudos, cfgAnos]);
  const [customAnos, setCustomAnos] = useState<string[]>([]);
  
  const [isAddingConteudo, setIsAddingConteudo] = useState(false);
  const [newConteudoText, setNewConteudoText] = useState("");
  const [isAddingAno, setIsAddingAno] = useState(false);
  const [newAnoText, setNewAnoText] = useState("");

  // Form State
  const [form, setForm] = useState({
    disciplina: "",
    conteudo: "",
    sub_conteudo: "",
    q_num: "",
    prova: "",
    ano: "",
    cor: "",
    estagio: "Quarentena",
    comentario: ""
  });

  useEffect(() => {
    const stored = localStorage.getItem('kevquest_questoes');
    if (stored) {
      setQuestoes(JSON.parse(stored));
    } else {
      const initial = [
        {
          id: "q1", data_resolucao: new Date().toISOString(),
          disciplina: "Física", conteudo: "Cinemática", sub_conteudo: "MRUV",
          prova: "ENEM 2023", estagio_funil: "Diagnostico"
        },
        {
          id: "q2", data_resolucao: new Date().toISOString(),
          disciplina: "Biologia", conteudo: "Genética", sub_conteudo: "Leis de Mendel",
          prova: "ENEM 2022", estagio_funil: "UTI"
        },
        {
          id: "q3", data_resolucao: new Date().toISOString(),
          disciplina: "Matemática", conteudo: "Geometria", sub_conteudo: "Áreas Plana",
          prova: "Simulado Hexag", estagio_funil: "Refacao",
          ...calcRefacaoDates(new Date()) 
        }
      ];
      setQuestoes(initial);
      localStorage.setItem('kevquest_questoes', JSON.stringify(initial));
    }
    setIsLoaded(true);
  }, []);

  // Sync to Storage on Save
  const saveToStorage = (newList: any[]) => {
    setQuestoes(newList);
    localStorage.setItem('kevquest_questoes', JSON.stringify(newList));
  };

  const openNewModal = () => {
    setEditingId(null);
    setForm({ disciplina: "", conteudo: "", sub_conteudo: "", q_num: "", prova: "", ano: "", cor: "", estagio: "Quarentena", comentario: "" });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.disciplina || !form.conteudo || !form.estagio) {
      toast.error("Preencha Disciplina, Conteúdo e Estágio");
      return;
    }

    let nQ = {
      id: editingId || ("kq_" + Date.now()),
      data_resolucao: new Date().toISOString(), // Mantém agora p/ simplicidade no update
      disciplina: form.disciplina,
      conteudo: form.conteudo,
      sub_conteudo: form.sub_conteudo,
      q_num: form.q_num,
      prova: form.prova,
      ano: form.ano,
      cor: form.cor,
      estagio_funil: form.estagio,
      comentario: form.comentario,
      ...(form.estagio === "Refacao" ? calcRefacaoDates(new Date()) : {})
    };

    let novaLista = [];
    if (editingId) {
      // Se Editando, preserva a data original de resolução
      const original = questoes.find(q => q.id === editingId);
      if (original) nQ.data_resolucao = original.data_resolucao;
      novaLista = questoes.map(q => q.id === editingId ? nQ : q);
      toast.success("Questão atualizada com sucesso!");
    } else {
      novaLista = [nQ, ...questoes];
      toast.success("Questão salva com sucesso!");
    }

    saveToStorage(novaLista);
    setModalOpen(false);
  };

  // --- Operadores de Tabela ---
  const handleAdvance = (id: string, currentStage: string) => {
    const sequence: Record<string, string | null> = {
      "Quarentena": "Diagnostico",
      "Diagnostico": "UTI",
      "UTI": "Refacao",
      "Refacao": "Consolidada",
      "Consolidada": null
    };
    
    const nextStage = sequence[currentStage];
    if (!nextStage) return;

    let targetQuestao: any = null;
    const novaLista = questoes.map(q => {
      if (q.id === id) {
        targetQuestao = { 
          ...q, 
          estagio_funil: nextStage,
          ...(nextStage === "Refacao" ? calcRefacaoDates(new Date()) : {})
        };
        return targetQuestao;
      }
      return q;
    });

    saveToStorage(novaLista);
    toast.success(`Estágio avançado para: ${nextStage}`);

    // Se avançou para Diagnóstico, abre o modal de edição automaticamente
    if (nextStage === "Diagnostico" && targetQuestao) {
      setTimeout(() => {
        handleEdit(targetQuestao);
        toast.info("Por favor, preencha o diagnóstico do erro agora.");
      }, 300);
    }
  };

  const handleEdit = (q: any) => {
    setEditingId(q.id);
    setForm({
      disciplina: q.disciplina,
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

  const confirmAddConteudo = () => {
    if (newConteudoText.trim()) {
      setCustomConteudos(prev => {
        const atual = prev[form.disciplina] || [];
        if (!atual.includes(newConteudoText)) {
          return { ...prev, [form.disciplina]: [...atual, newConteudoText] };
        }
        return prev;
      });
      setForm(prev => {
        if (prev.conteudo === newConteudoText) return prev;
        return { ...prev, conteudo: newConteudoText };
      });
      setIsAddingConteudo(false);
      setNewConteudoText("");
    }
  };

  const confirmAddAno = () => {
    if (newAnoText.trim()) {
      setCustomAnos(prev => {
        if (!prev.includes(newAnoText)) {
          return [...prev, newAnoText];
        }
        return prev;
      });
      setForm(prev => {
        if (prev.ano === newAnoText) return prev;
        return { ...prev, ano: newAnoText };
      });
      setIsAddingAno(false);
      setNewAnoText("");
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este registro permanentemente?")) {
      const novaLista = questoes.filter(q => q.id !== id);
      saveToStorage(novaLista);
      toast.success("Registro Excluído");
    }
  };

  // --- Filtros e Dashboards Dybâmicos ---
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
      .slice(0, 3); // Top 3
  };

  const topDisciplinas = useMemo(() => getTopFrequencies('disciplina'), [filteredQuestoes]);
  const topConteudos = useMemo(() => getTopFrequencies('conteudo'), [filteredQuestoes]);
  const topProvas = useMemo(() => getTopFrequencies('prova'), [filteredQuestoes]);

  const questoesHoje = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return questoes.filter(q => q.data_resolucao.startsWith(today)).length;
  }, [questoes]);

  const noFunil = useMemo(() => questoes.filter(q => q.estagio_funil !== "Consolidada").length, [questoes]);

  const streakDias = 12; // Valor fictício p/ UX, conectar ao DB depois

  if (!isLoaded) return <div className="p-8">Carregando KevQuest...</div>;

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-20">
      
      <header className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-[#FFFFFF] tracking-tight flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-indigo-600 dark:text-indigo-400" /> KevQuest
          </h1>
          <p className="text-slate-500 dark:text-[#A1A1AA] mt-1 font-medium">Motor de Análise Qualitativa de Erros</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfigOpen(true)}
            title="Configurar opções dos campos"
            className="p-3 rounded-xl border border-slate-200 dark:border-[#2C2C2E] text-slate-400 dark:text-[#A1A1AA] hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2C2C2E] transition-all active:scale-95"
          >
            <Settings2 className="w-5 h-5" />
          </button>
          <button 
            onClick={openNewModal}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-slate-900/20 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Nova Questão
          </button>
        </div>
      </header>

      {/* --- WIDGETS GLOBAIS --- */}
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

      {/* --- CARDS / FILTROS DO FUNIL (OCULTÁVEL) --- */}
      {showFunnelFilters && (
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

      {/* --- SUB-DASHBOARD (Aparece Apenas Se Há Filtro Ativo) --- */}
      {activeStage !== "Todos" && (
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

            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 border border-slate-100 dark:border-[#2C2C2E] shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">Top Provas Fontes</h3>
              {topProvas.length === 0 ? <p className="text-sm text-slate-400">Nenhum dado</p> : (
                <ul className="space-y-3">
                  {topProvas.map(([name, val], i) => (
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

      {/* --- TABELA ATIVA --- */}
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
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Prova</th>
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estágio Atual</th>
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Diagnóstico</th>
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredQuestoes.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400 font-medium">Nenhuma questão encontrada com este filtro.</td></tr>
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
                      <td className="py-4 px-4 text-slate-500 dark:text-[#A1A1AA] font-medium">{q.prova || "—"}</td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span 
                          className="px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 capitalize border"
                          style={{ backgroundColor: cor + "15", color: cor, borderColor: cor + "30" }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cor }}></span>
                          {q.estagio_funil}
                        </span>
                      </td>
                      <td className="py-4 px-4 min-w-[150px] max-w-[250px]">
                        <p className="text-xs text-slate-500 dark:text-[#A1A1AA] line-clamp-2 italic" title={q.comentario}>
                          {q.comentario || <span className="opacity-30">Sem anotações...</span>}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-right opacity-50 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-end gap-2">
                          {q.estagio_funil !== "Consolidada" && (
                            <button onClick={() => handleAdvance(q.id, q.estagio_funil)} title="Avançar Estágio" className="p-2 text-slate-400 hover:text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:bg-indigo-500/10 rounded-lg transition-colors">
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

      {/* --- MODAL DE NOVA/EDITAR QUESTÃO --- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] w-full max-w-2xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-slate-100 dark:border-[#2C2C2E]">
              <h2 className="text-2xl font-black text-slate-800 dark:text-[#FFFFFF] flex items-center gap-3">
                {editingId ? <Edit2 className="w-6 h-6 text-amber-500" /> : <Plus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
                {editingId ? "Editar Registro" : "Adicionar à Ficha"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto hidden-scrollbar">
              
              {/* ESTÁGIO DA QUESTÃO (FIRST INPUT NOW) */}
              <div className={`p-6 rounded-2xl border-2 transition-all duration-300 ${form.estagio === 'Diagnostico' ? 'bg-orange-50 dark:bg-orange-500/10/50 border-orange-400 shadow-[0_0_20px_rgba(251,146,60,0.15)] ring-4 ring-orange-400/10' : 'bg-slate-50 dark:bg-[#2C2C2E] border-slate-200 dark:border-[#3A3A3C]'}`}>
                <label className={`block text-xs font-bold mb-3 uppercase tracking-wide flex items-center gap-2 ${form.estagio === 'Diagnostico' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-[#A1A1AA]'}`}>
                  {form.estagio === 'Diagnostico' ? <AlertTriangle className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-slate-300"></div>}
                  Estágio de Triagem da Questão
                </label>
                <CustomDropdown 
                  value={form.estagio} onChange={v => setForm({...form, estagio: v})}
                  placeholder="Selecione um Estágio"
                  options={ESTAGIO_ORDER.map(est => ({ value: est, label: `${est} - Etapa KevQuest` }))}
                  className={`border-2 rounded-xl px-4 py-3.5 text-sm font-bold transition-all ${form.estagio === 'Diagnostico' ? 'bg-white dark:bg-[#1C1C1E] border-orange-300 text-orange-900 dark:text-[#FFFFFF]' : 'bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-[#3A3A3C] text-slate-800 dark:text-[#FFFFFF] focus-within:border-indigo-400'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-[#A1A1AA] mb-2 uppercase tracking-wide">Disciplina do Erro</label>
                  <CustomDropdown 
                    value={form.disciplina} onChange={v => setForm({...form, disciplina: v, conteudo: ""})}
                    placeholder="Selecionar Área..."
                    options={cfgDisciplinas.map(d => ({ value: d, label: d }))}
                    className="border-2 border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3.5 text-sm text-slate-800 dark:text-[#FFFFFF] bg-slate-50 dark:bg-[#2C2C2E] focus-within:bg-white dark:focus-within:bg-[#121212] focus-within:border-indigo-400 font-bold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-[#A1A1AA] mb-2 uppercase tracking-wide">Conteúdo Errado</label>
                  {isAddingConteudo ? (
                    <div className="relative flex w-full border-2 border-slate-200 dark:border-[#3A3A3C] rounded-xl overflow-hidden bg-slate-50 dark:bg-[#2C2C2E] focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all h-[54px] shadow-sm">
                       <input 
                         type="text" autoFocus
                         placeholder="Qual o nome do assunto?"
                         value={newConteudoText}
                         onChange={e => setNewConteudoText(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), confirmAddConteudo())}
                         className="flex-1 h-full pl-4 pr-10 text-sm text-slate-800 dark:text-[#FFFFFF] bg-transparent focus:outline-none font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600"
                       />
                       <button 
                         type="button" 
                         onClick={() => setIsAddingConteudo(false)} 
                         className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#3A3A3C] transition-all"
                         title="Voltar para seleção"
                       >
                         <X className="w-4 h-4" />
                       </button>
                    </div>
                  ) : (
                    <CustomDropdown 
                      value={form.conteudo} 
                      onChange={v => {
                        if (v === "NOVO") {
                          setIsAddingConteudo(true);
                          setNewConteudoText("");
                        } else {
                          setForm({...form, conteudo: v});
                        }
                      }}
                      disabled={!form.disciplina}
                      placeholder="Selecionar Assunto..."
                      options={[
                        ...(form.disciplina ? (customConteudos[form.disciplina]?.map(c => ({ value: c, label: c })) || []) : []),
                        ...(form.disciplina ? [{ value: "NOVO", label: "+ Adicionar Novo" }] : [])
                      ]}
                      className="border-2 border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3.5 text-sm text-slate-800 dark:text-[#FFFFFF] bg-slate-50 dark:bg-[#2C2C2E] focus-within:bg-white dark:focus-within:bg-[#121212] focus-within:border-indigo-400 font-bold transition-all h-[54px]"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-[#A1A1AA] mb-2 uppercase tracking-wide">Sub-Conteúdo <span className="text-slate-300 dark:text-slate-600">(Opcional)</span></label>
                  <input type="text" placeholder="Ex: Análise Combinatória" value={form.sub_conteudo} onChange={e => setForm({...form, sub_conteudo: e.target.value})} className="w-full border-2 border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-[#FFFFFF] bg-transparent focus:outline-none focus:border-indigo-400 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-[#A1A1AA] mb-2 uppercase tracking-wide">Nº da Questão <span className="text-slate-300 dark:text-slate-600">(Opcional)</span></label>
                  <input type="text" placeholder="Ex: Questão 42" value={form.q_num} onChange={e => setForm({...form, q_num: e.target.value})} className="w-full border-2 border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-[#FFFFFF] bg-transparent focus:outline-none focus:border-indigo-400 font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 dark:text-[#A1A1AA] mb-2 uppercase tracking-wide">Prova (Fonte)</label>
                  <CustomDropdown 
                    value={form.prova} onChange={v => setForm({...form, prova: v})}
                    placeholder="Selecione..."
                    options={cfgProvas.map(p => ({ value: p, label: p }))}
                    className="border-2 border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-[#FFFFFF] focus-within:border-indigo-400 font-medium bg-slate-50 dark:bg-[#2C2C2E] h-[52px]"
                    dropdownClasses="bottom-full mb-2"
                  />
                </div>
                
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 dark:text-[#A1A1AA] mb-2 uppercase tracking-wide">Ano</label>
                  {isAddingAno ? (
                    <div className="relative flex w-full border-2 border-slate-200 dark:border-[#3A3A3C] rounded-xl overflow-hidden bg-slate-50 dark:bg-[#2C2C2E] focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all h-[52px] shadow-sm">
                       <input 
                         type="text" autoFocus
                         placeholder="Ex: 2025"
                         value={newAnoText}
                         onChange={e => setNewAnoText(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), confirmAddAno())}
                         className="flex-1 h-full pl-4 pr-10 text-sm text-slate-800 dark:text-[#FFFFFF] bg-transparent focus:outline-none font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600"
                       />
                       <button 
                         type="button" 
                         onClick={() => setIsAddingAno(false)} 
                         className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#3A3A3C] transition-all"
                         title="Voltar para seleção"
                       >
                         <X className="w-4 h-4" />
                       </button>
                    </div>
                  ) : (
                    <CustomDropdown 
                      value={form.ano} 
                      onChange={v => {
                        if (v === "NOVO") {
                          setIsAddingAno(true);
                          setNewAnoText("");
                        } else {
                          setForm({...form, ano: v});
                        }
                      }}
                      placeholder="Ano..."
                      options={[
                        ...cfgAnos.map(a => ({ value: a, label: a })),
                        { value: "NOVO", label: "+ Novo Ano" }
                      ]}
                      className="border-2 border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-[#FFFFFF] focus-within:border-indigo-400 font-medium bg-slate-50 dark:bg-[#2C2C2E] h-[52px]"
                      dropdownClasses="bottom-full mb-2"
                    />
                  )}
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 dark:text-[#A1A1AA] mb-2 uppercase tracking-wide">Cor <span className="text-slate-300 dark:text-slate-600">(Opc)</span></label>
                <CustomDropdown 
                  value={form.cor} onChange={v => setForm({...form, cor: v})} 
                  placeholder="Nenhuma"
                  options={[
                    { value: "", label: "Nenhuma" },
                    ...cfgCores.map(c => ({ value: c, label: c }))
                  ]}
                  className="border-2 border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-[#FFFFFF] focus-within:border-indigo-400 font-medium bg-slate-50 dark:bg-[#2C2C2E] h-[52px]"
                  dropdownClasses="bottom-full mb-2"
                />
                </div>
              </div>

              {form.estagio === "Diagnostico" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-bold text-orange-600 dark:text-orange-400 mb-2 uppercase tracking-wide flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Diagnóstico do Erro
                  </label>
                  <CustomDropdown 
                    value={form.comentario} 
                    onChange={v => setForm({...form, comentario: v})}
                    placeholder="Selecione o motivo do erro..."
                    options={cfgMotivos.map(m => ({ value: m, label: m }))}
                    className="border-2 border-orange-200 dark:border-orange-900/30 rounded-xl px-4 py-3.5 text-sm text-slate-800 dark:text-[#FFFFFF] bg-orange-50/30 dark:bg-orange-900/10 focus-within:border-orange-400 font-bold transition-all"
                  />
                </div>
              )}

              {form.estagio !== "Diagnostico" && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-[#A1A1AA] mb-2 uppercase tracking-wide">Anotações do Erro</label>
                  <textarea rows={3} placeholder="O que te fez errar essa questão? Faltou base ou só desatenção?" value={form.comentario} onChange={e => setForm({...form, comentario: e.target.value})} className="w-full border-2 border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-[#FFFFFF] bg-transparent focus:outline-none focus:border-indigo-400 resize-none font-medium"></textarea>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-[#2C2C2E] flex gap-4">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-4 font-bold text-slate-500 dark:text-[#A1A1AA] hover:bg-slate-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/20 active:scale-95 transition-all text-lg">
                  {editingId ? "Salvar Alterações" : "Injetar no Motor KevQuest"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* --- MODAL DE CONFIGURAÇÃO --- */}
      <AnimatePresence>
        {configOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-start justify-end p-4"
            onClick={() => setConfigOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#1C1C1E] rounded-[1.5rem] w-full max-w-sm h-[calc(100vh-2rem)] shadow-2xl border border-slate-100 dark:border-[#2C2C2E] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-[#2C2C2E] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#2C2C2E] flex items-center justify-center">
                    <Settings2 className="w-4 h-4 text-slate-600 dark:text-[#A1A1AA]" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-800 dark:text-white">Configurações</h2>
                    <p className="text-xs text-slate-400 dark:text-[#71717A]">Opções dos campos</p>
                  </div>
                </div>
                <button onClick={() => setConfigOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-[#2C2C2E] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Conteúdo scrollável */}
              <div className="overflow-y-auto flex-1 p-6 space-y-8 custom-scrollbar">

                {/* DISCIPLINAS */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 dark:text-[#71717A] uppercase tracking-wider mb-3">Disciplinas</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {cfgDisciplinas.map(d => (
                      <span key={d} className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 dark:bg-[#2C2C2E] text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg group/tag">
                        {d}
                        <button 
                          onClick={() => {
                            const novoNome = prompt("Editar nome da disciplina:", d);
                            if (novoNome && novoNome.trim() && novoNome !== d) {
                              setCfgDisciplinas(prev => prev.map(x => x === d ? novoNome.trim() : x));
                              // Atualiza o mapeamento de conteúdos
                              setCustomConteudos(prev => {
                                const newMap = { ...prev };
                                if (newMap[d]) {
                                  newMap[novoNome.trim()] = newMap[d];
                                  delete newMap[d];
                                }
                                return newMap;
                              });
                            }
                          }}
                          className="text-slate-400 hover:text-indigo-500 opacity-0 group-hover/tag:opacity-100 transition-all"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => setCfgDisciplinas(prev => prev.filter(x => x !== d))} className="text-slate-400 hover:text-rose-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nova disciplina..."
                      value={cfgInput.disciplina}
                      onChange={e => setCfgInput(p => ({...p, disciplina: e.target.value}))}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && cfgInput.disciplina.trim()) {
                          setCfgDisciplinas(p => p.includes(cfgInput.disciplina.trim()) ? p : [...p, cfgInput.disciplina.trim()]);
                          setCfgInput(p => ({...p, disciplina: ""}));
                        }
                      }}
                      className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-[#3A3A3C] bg-slate-50 dark:bg-[#2C2C2E] text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      onClick={() => {
                        if (cfgInput.disciplina.trim()) {
                          setCfgDisciplinas(p => p.includes(cfgInput.disciplina.trim()) ? p : [...p, cfgInput.disciplina.trim()]);
                          setCfgInput(p => ({...p, disciplina: ""}));
                        }
                      }}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* CONTEÚDOS POR DISCIPLINA (Agora abaixo de Disciplinas) */}
                <div className="pt-2">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-[#71717A] uppercase tracking-wider mb-4">Conteúdos por Disciplina</h3>
                  <div className="space-y-4">
                    <CustomDropdown 
                      value={cfgInput.disciplina} 
                      onChange={v => setCfgInput(p => ({...p, disciplina: v}))}
                      placeholder="Selecione a disciplina para editar conteúdos..."
                      options={cfgDisciplinas.map(d => ({ value: d, label: d }))}
                      className="border border-slate-200 dark:border-[#3A3A3C] rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-[#2C2C2E]"
                    />
                    
                    {cfgInput.disciplina && (
                      <div className="space-y-3 animate-in fade-in duration-200">
                        <div className="flex flex-wrap gap-2">
                          {(customConteudos[cfgInput.disciplina] || []).map(cont => (
                            <span key={cont} className="flex items-center gap-1.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-md group/ctag">
                              {cont}
                              <button 
                                onClick={() => {
                                  const novo = prompt("Editar conteúdo:", cont);
                                  if (novo && novo.trim() && novo !== cont) {
                                    setCustomConteudos(prev => ({
                                      ...prev,
                                      [cfgInput.disciplina]: prev[cfgInput.disciplina].map(x => x === cont ? novo.trim() : x)
                                    }));
                                  }
                                }}
                                className="opacity-0 group-hover/ctag:opacity-100 hover:text-indigo-600 transition-all"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                              </button>
                              <button 
                                onClick={() => setCustomConteudos(prev => ({
                                  ...prev,
                                  [cfgInput.disciplina]: prev[cfgInput.disciplina].filter(x => x !== cont)
                                }))}
                                className="hover:text-rose-500 transition-colors"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={`Novo conteúdo para ${cfgInput.disciplina}...`}
                            value={cfgInput.conteudo}
                            onChange={e => setCfgInput(p => ({...p, conteudo: e.target.value}))}
                            className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-[#3A3A3C] bg-white dark:bg-[#121212] text-slate-800 dark:text-white"
                          />
                          <button
                            onClick={() => {
                              if (cfgInput.conteudo.trim()) {
                                setCustomConteudos(prev => {
                                  const atual = prev[cfgInput.disciplina] || [];
                                  if (atual.includes(cfgInput.conteudo.trim())) return prev;
                                  return { ...prev, [cfgInput.disciplina]: [...atual, cfgInput.conteudo.trim()] };
                                });
                                setCfgInput(p => ({...p, conteudo: ""}));
                              }
                            }}
                            className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PROVAS */}
                <div className="border-t border-slate-100 dark:border-[#2C2C2E] pt-6">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-[#71717A] uppercase tracking-wider mb-3">Provas / Fontes</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {cfgProvas.map(p => (
                      <span key={p} className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 dark:bg-[#2C2C2E] text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg group/ptag">
                        {p}
                        <button 
                          onClick={() => {
                            const novo = prompt("Editar prova/fonte:", p);
                            if (novo && novo.trim() && novo !== p) {
                              setCfgProvas(prev => prev.map(x => x === p ? novo.trim() : x));
                            }
                          }}
                          className="text-slate-400 hover:text-indigo-500 opacity-0 group-hover/ptag:opacity-100 transition-all"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => setCfgProvas(prev => prev.filter(x => x !== p))} className="text-slate-400 hover:text-rose-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: FUVEST 2025..."
                      value={cfgInput.prova}
                      onChange={e => setCfgInput(p => ({...p, prova: e.target.value}))}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && cfgInput.prova.trim()) {
                          setCfgProvas(p => p.includes(cfgInput.prova.trim()) ? p : [...p, cfgInput.prova.trim()]);
                          setCfgInput(p => ({...p, prova: ""}));
                        }
                      }}
                      className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-[#3A3A3C] bg-slate-50 dark:bg-[#2C2C2E] text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      onClick={() => {
                        if (cfgInput.prova.trim()) {
                          setCfgProvas(p => p.includes(cfgInput.prova.trim()) ? p : [...p, cfgInput.prova.trim()]);
                          setCfgInput(p => ({...p, prova: ""}));
                        }
                      }}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* GESTÃO DE ANOS (Agora antes de Cores) */}
                <div className="border-t border-slate-100 dark:border-[#2C2C2E] pt-6">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-[#71717A] uppercase tracking-wider mb-3">Anos Disponíveis</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {cfgAnos.map(ano => (
                      <span key={ano} className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 dark:bg-[#2C2C2E] text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg group/atag">
                        {ano}
                        <button 
                          onClick={() => {
                            const novo = prompt("Editar ano:", ano);
                            if (novo && novo.trim() && novo !== ano) {
                              setCfgAnos(prev => prev.map(x => x === ano ? novo.trim() : x));
                            }
                          }}
                          className="text-slate-400 hover:text-indigo-500 opacity-0 group-hover/atag:opacity-100 transition-all"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => setCfgAnos(prev => prev.filter(x => x !== ano))} className="text-slate-400 hover:text-rose-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Adicionar ano..."
                      value={cfgInput.ano}
                      onChange={e => setCfgInput(p => ({...p, ano: e.target.value}))}
                      className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-[#3A3A3C] bg-slate-50 dark:bg-[#2C2C2E] text-slate-800 dark:text-white"
                    />
                    <button
                      onClick={() => {
                        if (cfgInput.ano.trim()) {
                          setCfgAnos(p => p.includes(cfgInput.ano.trim()) ? p : [...p, cfgInput.ano.trim()].sort((a,b) => parseInt(b)-parseInt(a)));
                          setCfgInput(p => ({...p, ano: ""}));
                        }
                      }}
                      className="px-3 py-2 bg-slate-800 text-white rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* CORES (Agora por último) */}
                <div className="border-t border-slate-100 dark:border-[#2C2C2E] pt-6">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-[#71717A] uppercase tracking-wider mb-3">Cores da Questão</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {cfgCores.map(c => (
                      <span key={c} className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 dark:bg-[#2C2C2E] text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg group/ctag">
                        {c}
                        <button 
                          onClick={() => {
                            const novo = prompt("Editar nome da cor:", c);
                            if (novo && novo.trim() && novo !== c) {
                              setCfgCores(prev => prev.map(x => x === c ? novo.trim() : x));
                            }
                          }}
                          className="text-slate-400 hover:text-indigo-500 opacity-0 group-hover/ctag:opacity-100 transition-all"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => setCfgCores(prev => prev.filter(x => x !== c))} className="text-slate-400 hover:text-rose-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Laranja..."
                      value={cfgInput.cor}
                      onChange={e => setCfgInput(p => ({...p, cor: e.target.value}))}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && cfgInput.cor.trim()) {
                          setCfgCores(p => p.includes(cfgInput.cor.trim()) ? p : [...p, cfgInput.cor.trim()]);
                          setCfgInput(p => ({...p, cor: ""}));
                        }
                      }}
                      className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-[#3A3A3C] bg-slate-50 dark:bg-[#2C2C2E] text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      onClick={() => {
                        if (cfgInput.cor.trim()) {
                          setCfgCores(p => p.includes(cfgInput.cor.trim()) ? p : [...p, cfgInput.cor.trim()]);
                          setCfgInput(p => ({...p, cor: ""}));
                        }
                      }}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* MOTIVOS DE DIAGNÓSTICO (Novo) */}
                <div className="border-t border-slate-100 dark:border-[#2C2C2E] pt-6">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-[#71717A] uppercase tracking-wider mb-3">Motivos de Erro (Diagnóstico)</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {cfgMotivos.map(m => (
                      <span key={m} className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 dark:bg-[#2C2C2E] text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg group/mtag">
                        {m}
                        <button 
                          onClick={() => {
                            const novo = prompt("Editar motivo do erro:", m);
                            if (novo && novo.trim() && novo !== m) {
                              setCfgMotivos(prev => prev.map(x => x === m ? novo.trim() : x));
                            }
                          }}
                          className="text-slate-400 hover:text-indigo-500 opacity-0 group-hover/mtag:opacity-100 transition-all"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => setCfgMotivos(prev => prev.filter(x => x !== m))} className="text-slate-400 hover:text-rose-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Pegadinha..."
                      value={cfgInput.motivo}
                      onChange={e => setCfgInput(p => ({...p, motivo: e.target.value}))}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && cfgInput.motivo.trim()) {
                          setCfgMotivos(p => p.includes(cfgInput.motivo.trim()) ? p : [...p, cfgInput.motivo.trim()]);
                          setCfgInput(p => ({...p, motivo: ""}));
                        }
                      }}
                      className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-[#3A3A3C] bg-slate-50 dark:bg-[#2C2C2E] text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      onClick={() => {
                        if (cfgInput.motivo.trim()) {
                          setCfgMotivos(p => p.includes(cfgInput.motivo.trim()) ? p : [...p, cfgInput.motivo.trim()]);
                          setCfgInput(p => ({...p, motivo: ""}));
                        }
                      }}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>


              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-[#2C2C2E] shrink-0">
                <p className="text-xs text-slate-400 dark:text-[#71717A] text-center">As opções salvas aparecem nos campos do formulário</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
