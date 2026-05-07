import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { 
  listarProblemas, concluirProblema, deletarProblema, criarProblemaManual, atualizarProblema,
  type ProblemaEstudo, type OrigemProblema, ORIGEM_LABELS, ORIGEM_COLORS, TIPO_ERRO_LABELS, TIPO_ERRO_COLORS
} from "@/lib/db/estudo";
import { createClient } from "@/utils/supabase/client";
import { Trash, CheckCircle2, AlertCircle, Inbox, Plus, X, Activity, Pencil, Loader2, ChevronDown, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { MODELOS_PROVAS } from "@/lib/config/provas";
import { getPreferences, updatePreferences } from "@/lib/db/preferences";

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
                         className="flex-1 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-slate-700/50 rounded-lg px-2 py-2 text-sm outline-none w-full shadow-inner text-slate-700 dark:text-white" 
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

export default function ModuleTarefasSimulado({ 
  refreshTrigger = 0, 
  onRefresh,
  onNewClick
}: { 
  refreshTrigger?: number; 
  onRefresh?: () => void;
  onNewClick?: () => void;
}) {
  const [problemas, setProblemas] = useState<ProblemaEstudo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Modals
  const [modalEditar, setModalEditar] = useState<{ open: boolean; prob: ProblemaEstudo | null }>({ open: false, prob: null });
  const [formEditar, setFormEditar] = useState({ 
    prova: '', 
    ano: '', 
    aplicacao: '', 
    dia: '', 
    cor: '', 
    data: '', 
    prioridade: 0 
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [cfgProvas, setCfgProvas] = useState<string[]>([]);
  const [cfgAplicacoes, setCfgAplicacoes] = useState<string[]>([]);
  const [cfgCores, setCfgCores] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await createClient().auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const data = await listarProblemas(user.id);
      setProblemas(data.filter(p => p.origem === 'simulado' && p.tipo_erro === null));

      const prefs = await getPreferences();
      setCfgProvas(prefs.provas || []);
      setCfgAplicacoes(prefs.aplicacoes || []);
      setCfgCores(prefs.cores || []);

      setIsLoaded(true);
    }
    load();
  }, [refreshTrigger]);

  const fetchProblemas = async (uid: string) => {
    const todos = await listarProblemas(uid);
    setProblemas(todos.filter(p => p.origem === 'simulado' && p.tipo_erro === null));
    setIsLoaded(true);
  };

  const refresh = () => {
    if (userId) fetchProblemas(userId);
    if (onRefresh) onRefresh();
  };

  const handleDeletar = async (id: string) => {
    if (confirm("Excluir este simulado?")) {
      const ok = await deletarProblema(id);
      if (ok) {
        toast.success("Simulado excluído");
        refresh();
      }
    }
  };

  const handleConcluir = async (id: string) => {
    if (!id) return;
    setIsSaving(true);
    const ok = await concluirProblema(
      id,
      {
        conforto: null,
      }
    );
    if (ok) {
      toast.success('Simulado concluído!');
      refresh();
    } else {
      toast.error('Erro ao concluir simulado.');
    }
    setIsSaving(false);
  };

  const handleEditar = async () => {
    if (!modalEditar.prob) return;
    setIsSaving(true);

    const titulo = `Simulado: ${formEditar.prova} ${formEditar.ano} ${formEditar.aplicacao ? `- ${formEditar.aplicacao}` : ''} ${formEditar.dia ? `(${formEditar.dia})` : ''} ${formEditar.cor ? `- Cor ${formEditar.cor}` : ''}`.trim();

    const ok = await atualizarProblema(modalEditar.prob.id, {
      titulo: titulo,
      agendadoPara: formEditar.data || null,
      prioridade: formEditar.prioridade,
      prova: formEditar.prova,
      ano: formEditar.ano,
      cor_prova: formEditar.cor
    });

    if (ok) {
      toast.success('Simulado atualizado!');
      setModalEditar({ open: false, prob: null });
      refresh();
    } else {
      toast.error('Erro ao atualizar.');
    }
    setIsSaving(false);
  };

  const parseTitulo = (prob: ProblemaEstudo) => {
    const t = prob.titulo;
    // Título pattern: Simulado: {prova} {ano} - {aplicacao} ({dia}) - Cor {cor}
    const cleanT = t.replace('Simulado: ', '');
    const parts = cleanT.split(' ');
    
    // Tentar extrair aplicação
    const aplicacaoMatch = cleanT.match(/- ([^(]+)/);
    const aplicacao = aplicacaoMatch ? aplicacaoMatch[1].split(' - Cor')[0].trim() : '';

    // Tentar extrair dia
    const diaMatch = cleanT.match(/\(([^)]+)\)/);
    const dia = diaMatch ? diaMatch[1] : '';

    // Tentar extrair cor
    const corMatch = cleanT.match(/- Cor (.+)/);
    const cor = corMatch ? corMatch[1] : (prob.cor_prova || '');

    setFormEditar({
      prova: prob.prova || '',
      ano: prob.ano || '',
      aplicacao: aplicacao,
      dia: dia,
      cor: cor,
      data: prob.agendado_para || '',
      prioridade: prob.prioridade
    });
  };

  const hoje = new Date().toISOString().split('T')[0];
  const pendentes = problemas.filter(p => p.status === 'pendente');
  const paraHoje = pendentes.filter(p => {
    const isAtrasado = p.agendado_para && p.agendado_para < hoje;
    return p.agendado_para === hoje || p.prioridade === 1 || isAtrasado;
  });
  const fila = pendentes.filter(p => !paraHoje.includes(p));

  const ProblemaListRow = ({ prob, showDate = true }: { prob: ProblemaEstudo; showDate?: boolean }) => {
    const [showActions, setShowActions] = useState(false);

    const isAtrasado = prob.agendado_para && prob.agendado_para < hoje;
    const isVisualmenteUrgente = prob.prioridade === 1 || isAtrasado;

    return (
      <motion.div 
        layout
        className={`bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 flex flex-col justify-between gap-6 border-2 transition-all hover:shadow-xl hover:shadow-indigo-500/5 group relative overflow-hidden ${
          isVisualmenteUrgente ? 'border-orange-200 dark:border-orange-500/30' : 'border-slate-100 dark:border-[#2C2C2E]'
        }`}
      >
        {/* Glow effect on hover */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-500 ${
              isVisualmenteUrgente ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-500' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500'
            }`}>
              <Activity className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-slate-800 dark:text-white text-lg leading-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {prob.titulo}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {isVisualmenteUrgente && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-100 dark:border-orange-500/20">
                    {prob.prioridade === 1 ? 'Urgente' : 'Atrasado'}
                  </span>
                )}
                {showDate && prob.agendado_para && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date(prob.agendado_para + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
             <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 text-slate-300 hover:text-indigo-500 dark:text-slate-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-[#2C2C2E]/50 rounded-xl transition-all"
                title="Ver Mais"
              >
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${showActions ? 'rotate-180' : ''}`} />
              </button>
          </div>
        </div>

        <AnimatePresence>
          {showActions && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-50 dark:border-[#2C2C2E] pt-4"
            >
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => {
                      setModalEditar({ open: true, prob: prob });
                      parseTitulo(prob);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  onClick={() => handleDeletar(prob.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest"
                >
                  <Trash className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-2 relative z-10">
          <button
            onClick={() => handleConcluir(prob.id)}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-3 bg-[#1B2B5E] hover:bg-blue-900 text-white text-[10px] font-black py-4 rounded-[1.2rem] uppercase tracking-[0.2em] transition-all active:scale-[0.97] shadow-lg shadow-[#1B2B5E]/20 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Concluir Simulado
          </button>
        </div>
      </motion.div>
    );
  };

  if (!isLoaded) return <div className="p-8 text-center text-slate-400 animate-pulse">Carregando simulados...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Para Hoje */}
      {paraHoje.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F97316]/10 flex items-center justify-center shadow-sm">
                <AlertCircle className="w-6 h-6 text-[#F97316]" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-white leading-tight">
                  Para Hoje
                </h2>
                <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  Tarefas agendadas para o dia atual
                </p>
              </div>
              <span className="text-sm font-black text-slate-400 bg-slate-100 dark:bg-[#2C2C2E] px-2.5 py-1 rounded-lg self-start mt-1">({paraHoje.length})</span>
            </div>
            {onNewClick && (
              <button
                onClick={onNewClick}
                className="hidden sm:flex items-center justify-center gap-2 bg-[#F97316] hover:bg-orange-600 text-white font-black px-6 py-4 rounded-[1.5rem] text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-orange-500/20"
              >
                <Plus className="w-5 h-5" />
                <span>Novo Simulado</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paraHoje.map(p => <ProblemaListRow key={p.id} prob={p} showDate={false} />)}
          </div>
        </div>
      )}

      {/* Fila */}
      <div>
        <div className="flex items-center justify-between mb-6 mt-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm">
              <Inbox className="w-6 h-6 text-slate-500" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-white leading-tight">
                Fila
              </h2>
              <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                Agendados Futuros ou Sem Data
              </p>
            </div>
            <span className="text-sm font-black text-slate-400 bg-slate-100 dark:bg-[#2C2C2E] px-2.5 py-1 rounded-lg self-start mt-1">({fila.length})</span>
          </div>
          {onNewClick && paraHoje.length === 0 && (
            <button
              onClick={onNewClick}
              className="hidden sm:flex items-center justify-center gap-2 bg-[#F97316] hover:bg-orange-600 text-white font-black px-6 py-4 rounded-[1.5rem] text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-5 h-5" />
              <span>Novo Simulado</span>
            </button>
          )}
        </div>
        {fila.length === 0 ? (
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-12 border border-slate-100 dark:border-[#2C2C2E] text-center text-slate-400 text-sm font-medium">
            Sua fila está vazia. Ótimo trabalho!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fila.map(p => <ProblemaListRow key={p.id} prob={p} />)}
          </div>
        )}
      </div>



      {/* Modal Editar */}
      {modalEditar.open && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setModalEditar({open:false, prob:null})}
        >
          <div
            className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 animate-in fade-in zoom-in-95 relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setModalEditar({open:false, prob:null})} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition-colors"><X className="w-5 h-5"/></button>
            <h2 className="text-2xl font-black mb-6 text-slate-800 dark:text-white flex items-center gap-3">
              <Pencil className="w-6 h-6 text-indigo-500" />
              Editar Simulado
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Prova *</label>
                    <CustomDropdown
                      value={formEditar.prova}
                      onChange={(val) => setFormEditar({...formEditar, prova: val})}
                      options={cfgProvas.length > 0 ? cfgProvas.map(p => { const m = MODELOS_PROVAS.find(model => model.id === p); return { value: p, label: m ? m.nome : p }; }) : MODELOS_PROVAS.map(m => ({ value: m.id, label: m.nome }))}
                      placeholder="Selecione a Banca..."
                    className="h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-medium outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Ano *</label>
                  <input required type="number" value={formEditar.ano} onChange={e => setFormEditar({...formEditar, ano: e.target.value})} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 font-medium" placeholder="Ex: 2023" />
                </div>
              </div>

              {(() => {
                const isMultiDia = MODELOS_PROVAS.find(m => m.id === formEditar.prova)?.fases.some(f => f.dias > 1);
                return (
                  <div className={`grid ${isMultiDia ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                    <div>
                      <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Aplicação</label>
                      <CustomDropdown
                        value={formEditar.aplicacao}
                        onChange={v => setFormEditar({ ...formEditar, aplicacao: v })}
                        options={cfgAplicacoes.map(a => ({ value: a, label: a }))}
                        placeholder="Regular, PPL..."
                        onAddNewItem={async (v) => {
                          const newAps = [...cfgAplicacoes, v];
                          setCfgAplicacoes(newAps);
                          await updatePreferences({ aplicacoes: newAps });
                          setFormEditar({ ...formEditar, aplicacao: v });
                        }}
                        className="h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-medium outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                      />
                    </div>
                    {isMultiDia && (
                      <div className="animate-in fade-in zoom-in-95">
                        <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Dia</label>
                        <CustomDropdown
                          value={formEditar.dia}
                          onChange={(val) => setFormEditar({...formEditar, dia: val})}
                          options={[
                            { value: "Dia 1", label: "Dia 1" },
                            { value: "Dia 2", label: "Dia 2" },
                            { value: "Completo", label: "Completo / Único" },
                          ]}
                          placeholder="Selecione..."
                          className="h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-medium outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Cor</label>
                      <CustomDropdown
                        value={formEditar.cor}
                        onChange={v => setFormEditar({ ...formEditar, cor: v })}
                        options={cfgCores.map(c => ({ value: c, label: c }))}
                        placeholder="Azul, Amarela..."
                        onAddNewItem={async (v) => {
                          const newCores = [...cfgCores, v];
                          setCfgCores(newCores);
                          await updatePreferences({ cores: newCores });
                          setFormEditar({ ...formEditar, cor: v });
                        }}
                        className="h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-medium outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-[#2C2C2E]">
                <div>
                  <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Agendar para</label>
                  <input type="date" value={formEditar.data} onChange={e => setFormEditar({...formEditar, data: e.target.value})} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Prioridade</label>
                  <CustomDropdown
                    value={formEditar.prioridade.toString()}
                    onChange={v => setFormEditar({ ...formEditar, prioridade: parseInt(v) })}
                    options={[
                      { value: "0", label: "Normal" },
                      { value: "1", label: "Urgente" }
                    ]}
                    placeholder="Prioridade"
                    className="h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-medium outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setModalEditar({open:false, prob:null})} className="flex-1 py-4 text-sm font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all uppercase tracking-widest">
                    Cancelar
                </button>
                <button onClick={handleEditar} disabled={isSaving || !formEditar.prova || !formEditar.ano} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-2xl shadow-xl shadow-indigo-600/20 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
