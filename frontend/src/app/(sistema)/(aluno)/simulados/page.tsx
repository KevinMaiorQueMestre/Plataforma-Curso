
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Book, Globe2, Leaf, Calculator, PenTool, Send, Clock, Play, Pause, X, PieChart, Maximize2, Minimize2, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getPreferences } from "@/lib/db/preferences";
import {
  listarSimulados,
  criarSimulado,
  deletarSimulado,
  type SimuladoDB
} from "@/lib/db/simulados";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
  Line,
  Legend
} from "recharts";

// --- CUSTOM TOOLTIPS FOR GRAPHS ---
function TooltipGeral({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-bold text-indigo-400">
          📊 {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

function TooltipD1({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const ling = payload.find((p: any) => p.dataKey === "linguagens");
  const hum = payload.find((p: any) => p.dataKey === "humanas");
  const temp = payload.find((p: any) => p.dataKey === "tempo1");
  return (
    <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md min-w-[180px]">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      {ling && <p className="text-sm font-bold text-indigo-400">📚 Linguagens: {ling.value}</p>}
      {hum && <p className="text-sm font-bold text-amber-500">🌍 Humanas: {hum.value}</p>}
      {temp && <p className="text-sm font-bold text-slate-400 border-t border-white/5 mt-2 pt-2">⏱ Tempo: {temp.value} min</p>}
    </div>
  );
}

function TooltipRedacao({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const nota = payload.find((p: any) => p.dataKey === "nota");
  const tempo = payload.find((p: any) => p.dataKey === "tempo");
  return (
    <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      {nota && <p className="text-lg font-black text-rose-500">✍️ Nota: {nota.value}</p>}
      {tempo && <p className="text-sm font-bold text-slate-400 mt-1">⏱ Tempo: {tempo.value} min</p>}
    </div>
  );
}

function TooltipD2({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const mat = payload.find((p: any) => p.dataKey === "matematica");
  const nat = payload.find((p: any) => p.dataKey === "naturezas");
  const temp = payload.find((p: any) => p.dataKey === "tempo2");
  return (
    <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md min-w-[180px]">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      {mat && <p className="text-sm font-bold text-blue-400">🧮 Matemática: {mat.value}</p>}
      {nat && <p className="text-sm font-bold text-emerald-400">🧪 Naturezas: {nat.value}</p>}
      {temp && <p className="text-sm font-bold text-slate-400 border-t border-white/5 mt-2 pt-2">⏱ Tempo: {temp.value} min</p>}
    </div>
  );
}

export default function SimuladosPage() {
  const [simulados, setSimulados] = useState<SimuladoDB[]>([]);
  const [isLoaded,  setIsLoaded]  = useState(false);
  const [isSaving,  setIsSaving]  = useState(false);
  const [userId,    setUserId]    = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"lancamento" | "metricas">("lancamento");

  const [cfgProvas, setCfgProvas] = useState<string[]>([]);
  const [cfgAnos, setCfgAnos] = useState<string[]>([]);

  // Carrega userId + simulados do banco + config
  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      
      // Load Configs from DB instead of LocalStorage
      const prefs = await getPreferences();
      setCfgProvas(prefs.provas || []);
      setCfgAnos(prefs.anos || []);

      const data = await listarSimulados(user.id);
      setSimulados(data);
      setIsLoaded(true);
    }
    init();
  }, []);

  const [form, setForm] = useState({
    nomeProva: "",
    anoProva: "",
    linguagens: "",
    humanas: "",
    naturezas: "",
    matematica: "",
    redacao: "",
    tempo1H: "",
    tempo1M: "",
    tempo2H: "",
    tempo2M: "",
    tempoRedH: "",
    tempoRedM: ""
  });

  // Timer State
  const [timerConfig, setTimerConfig] = useState({ hours: 5, minutes: 30 });
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showExactTime, setShowExactTime] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      toast.success("Tempo esgotado!");
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const startTimer = () => {
    if (timeLeft === 0) {
      setTimeLeft(timerConfig.hours * 3600 + timerConfig.minutes * 60);
    }
    setIsTimerRunning(true);
  };
  const pauseTimer = () => setIsTimerRunning(false);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(0); 
  };
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getDisplayTime = () => {
    const totalSeconds = timeLeft > 0 ? timeLeft : (timerConfig.hours * 3600 + timerConfig.minutes * 60);
    if (showExactTime || timeLeft === 0 || !isTimerRunning) {
      return formatTime(totalSeconds);
    }
    const blocks30 = Math.ceil(totalSeconds / 1800) * 1800; // Arredonda para o bloco de 30 mins mais próximo acima
    return formatTime(blocks30);
  };

  const handleSubmit = async () => {
    if (!form.nomeProva) {
      toast.error("Preencha ao menos o nome da prova!");
      return;
    }
    if (!userId) { toast.error("Sessão expirada. Faça login novamente."); return; }

    const nLing = parseInt(form.linguagens) || 0;
    const nHum  = parseInt(form.humanas)    || 0;
    const nNat  = parseInt(form.naturezas)  || 0;
    const nMat  = parseInt(form.matematica) || 0;
    const nRed  = parseInt(form.redacao)    || 0;

    const t1   = (parseInt(form.tempo1H) || 0) * 60 + (parseInt(form.tempo1M) || 0);
    const t2   = (parseInt(form.tempo2H) || 0) * 60 + (parseInt(form.tempo2M) || 0);
    const tRed = (parseInt(form.tempoRedH) || 0) * 60 + (parseInt(form.tempoRedM) || 0);

    if (nLing > 45 || nHum > 45 || nNat > 45 || nMat > 45 || nRed > 1000) {
      toast.error("Número de acertos ultrapassa o limite permitido do ENEM.");
      return;
    }

    setIsSaving(true);
    try {
      const tituloCompleto = form.anoProva ? `${form.nomeProva} ${form.anoProva}` : form.nomeProva;

      const entry = await criarSimulado({
        userId,
        tituloSimulado: tituloCompleto,
        linguagens:  nLing,
        humanas:     nHum,
        naturezas:   nNat,
        matematica:  nMat,
        redacao:     nRed,
        tempo1Min:   t1,
        tempo2Min:   t2,
        tempoRedMin: tRed,
      });

      if (entry) {
        setSimulados(prev => [entry, ...prev]);
        toast.success("Desempenho salvo no banco! 🎯");
      } else {
        toast.error("Erro ao salvar. Tente novamente.");
      }
    } finally {
      setIsSaving(false);
    }

    setForm({
      nomeProva: "", anoProva: "", linguagens: "", humanas: "", naturezas: "",
      matematica: "", redacao: "",
      tempo1H: "", tempo1M: "", tempo2H: "", tempo2M: "",
      tempoRedH: "", tempoRedM: ""
    });
  };

  const handleDelete = async (id: string) => {
    const ok = await deletarSimulado(id);
    if (ok) {
      setSimulados(prev => prev.filter(s => s.id !== id));
      toast.success("Simulado removido.");
    } else {
      toast.error("Erro ao remover.");
    }
  };

  const getChartDataDay1 = () => {
    return [...simulados].reverse().map((sim) => {
      const dateStr = sim.realizado_em ? format(new Date(sim.realizado_em), "dd/MM", { locale: ptBR }) : "";
      return {
        name: `${sim.titulo_simulado} (${dateStr})`,
        linguagens: sim.linguagens || 0,
        humanas:    sim.humanas    || 0,
        redacao:    sim.redacao    || 0,
        tempo1:     sim.tempo1_min || 0,
        tempoRedacao: sim.tempo_red_min || 0,
      };
    });
  };

  const getChartDataDay2 = () => {
    return [...simulados].reverse().map((sim) => {
      const dateStr = sim.realizado_em ? format(new Date(sim.realizado_em), "dd/MM", { locale: ptBR }) : "";
      return {
        name:      `${sim.titulo_simulado} (${dateStr})`,
        matematica: sim.matematica || 0,
        naturezas:  sim.naturezas  || 0,
        tempo2:     sim.tempo2_min || 0,
      };
    });
  };

  const getGeneralAnalysisData = () => {
    return [...simulados].reverse().map(sim => {
      const dateStr = sim.realizado_em ? format(new Date(sim.realizado_em), "dd/MM", { locale: ptBR }) : "";
      const total = (sim.linguagens || 0) + (sim.humanas || 0) + (sim.naturezas || 0) + (sim.matematica || 0);
      return {
        name:    sim.titulo_simulado,
        display: `${sim.titulo_simulado} (${dateStr})`,
        acertos: total,
        tempo:   sim.tempo_total_min || 0,
        redacao: sim.redacao || 0
      };
    });
  };

  const getRedacaoPerformanceData = () => {
    return [...simulados].reverse().map(sim => {
      const dateStr = sim.realizado_em ? format(new Date(sim.realizado_em), "dd/MM", { locale: ptBR }) : "";
      return {
        name:  `${sim.titulo_simulado} (${dateStr})`,
        nota:  sim.redacao      || 0,
        tempo: sim.tempo_red_min || 0,
      };
    });
  };


  if (!isLoaded) return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Carregando Simulados...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl pb-20 px-4 md:px-0">
      <header className="mb-2 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-[1.2rem] shadow-lg shadow-indigo-600/20">
              <Activity className="w-8 h-8 text-white" />
            </div>
            Módulo de Simulados
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <div className="h-1 w-12 bg-indigo-500 rounded-full"></div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em]">Alta Performance & Análise T.R.I.</p>
          </div>
        </div>
      </header>

      {/* ─── TOGGLE LANÇAMENTO / MÉTRICAS ─────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-2 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex">
        <button
          onClick={() => setActiveTab("lancamento")}
          className={`flex-1 py-4 rounded-[1.8rem] text-sm font-black uppercase tracking-[0.18em] transition-all duration-200 ${
            activeTab === "lancamento"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-400 dark:text-[#A1A1AA] hover:text-slate-600 dark:hover:text-white"
          }`}
        >
          Lançamento
        </button>
        <button
          onClick={() => setActiveTab("metricas")}
          className={`flex-1 py-4 rounded-[1.8rem] text-sm font-black uppercase tracking-[0.18em] transition-all duration-200 ${
            activeTab === "metricas"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-400 dark:text-[#A1A1AA] hover:text-slate-600 dark:hover:text-white"
          }`}
        >
          Métricas
        </button>
      </div>

      {activeTab === "lancamento" && (
        <>
        {/* --- CRONÔMETRO REVERSO - PREMIUM REDESIGN --- */}
        <section className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
        
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-6">
           <div className={`relative w-24 h-24 rounded-[2rem] flex items-center justify-center border-2 transition-all duration-500 shadow-lg ${isTimerRunning ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
             <Clock className={`w-8 h-8 transition-colors duration-500 ${isTimerRunning ? 'text-indigo-400' : 'text-slate-500'}`} />
             {isTimerRunning && (
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-indigo-500 rounded-[2rem] blur-xl -z-10"
                />
             )}
           </div>
           <div className="flex flex-col gap-1">
             <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] leading-tight mb-1">Cronómetro de Simulado</h2>
             <div className="flex items-baseline gap-2">
                <div className={`text-7xl font-black font-mono tracking-tighter transition-all duration-500 ${isTimerRunning ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-700'}`}>
                  {getDisplayTime().split(':')[0]}:{getDisplayTime().split(':')[1]}
                </div>
                <div className={`text-3xl font-black font-mono ${isTimerRunning ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-700'}`}>
                  :{getDisplayTime().split(':')[2]}
                </div>
             </div>
           </div>
        </div>
        
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-inner">
           
           {!isTimerRunning && timeLeft === 0 && (
             <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2 items-center bg-white dark:bg-slate-700/50 px-6 py-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                <div className="flex flex-col items-center">
                  <input type="number" min="0" value={timerConfig.hours} onChange={e => setTimerConfig({...timerConfig, hours: parseInt(e.target.value)||0})} className="w-12 bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none focus:text-indigo-500" />
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Horas</span>
                </div>
                <span className="text-slate-300 dark:text-slate-600 font-black text-2xl pb-6">:</span>
                <div className="flex flex-col items-center">
                  <input type="number" min="0" max="59" value={timerConfig.minutes} onChange={e => setTimerConfig({...timerConfig, minutes: parseInt(e.target.value)||0})} className="w-12 bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none focus:text-indigo-500" />
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Mins</span>
                </div>
             </motion.div>
           )}

           <div className="flex gap-2">
              <button 
                onClick={isTimerRunning ? pauseTimer : startTimer} 
                title={isTimerRunning ? "Pausar" : "Começar Simulado"}
                className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all active:scale-95 shadow-2xl ${isTimerRunning ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-700'}`}
              >
                {isTimerRunning ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
              </button>

              <button 
                onClick={resetTimer} 
                title="Resetar tempo (Sem confirmação)"
                className="w-16 h-16 bg-white dark:bg-slate-700/50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-white/5"
              >
                <X className="w-7 h-7" />
              </button>

              <button 
                onClick={() => setIsFocusMode(true)}
                className="w-16 h-16 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-white/5 hover:border-white/10"
                title="Simulação Imersiva"
              >
                <Maximize2 className="w-7 h-7" />
              </button>
           </div>

           <div className="hidden lg:block w-[2px] h-10 bg-slate-200 dark:bg-white/5 mx-1 rounded-full"></div>

           <div className="flex flex-col items-center">
              <button 
                onClick={() => setShowExactTime(!showExactTime)} 
                disabled={!isTimerRunning}
                className={`px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${!isTimerRunning ? 'opacity-30 cursor-not-allowed bg-slate-50 dark:bg-transparent border-slate-100 dark:border-white/5 text-slate-400' : 'bg-white dark:bg-indigo-900/10 border-slate-200 dark:border-indigo-500/20 text-slate-600 dark:text-indigo-400 hover:border-indigo-500 shadow-sm'}`}
              >
                {showExactTime ? "Ocultar Frações" : "Ver Exato"}
              </button>
           </div>
        </div>
      </section>
        </>
      )}

      {/* --- FORMULÁRIO DE LANÇAMENTO --- */}
      {activeTab === "lancamento" && (
      <section className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] -ml-40 -mt-40 pointer-events-none"></div>
        
        <div className="relative z-10 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100 dark:border-[#2C2C2E]">
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <Send className="w-7 h-7 text-indigo-500" />
                Lançar Resultado
              </h3>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Preencha os dados do seu desempenho</p>
            </div>
            
            <div className="flex flex-col md:flex-row items-stretch md:items-end gap-5 w-full md:w-auto">
              <div className="w-full md:w-80">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-[0.25em]">Identificação da Prova</label>
                {cfgProvas.length > 0 ? (
                  <select 
                    value={form.nomeProva}
                    onChange={e => setForm({...form, nomeProva: e.target.value})}
                    className="w-full h-14 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-5 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="">Selecione a Prova...</option>
                    {cfgProvas.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    placeholder="Ex: ENEM 2024 - PPL"
                    value={form.nomeProva}
                    onChange={e => setForm({...form, nomeProva: e.target.value})}
                    className="w-full h-14 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-5 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
                  />
                )}
              </div>
              
              <div className="w-full md:w-32">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-[0.25em]">Ano da Prova</label>
                {cfgAnos.length > 0 ? (
                  <select 
                    value={form.anoProva}
                    onChange={e => setForm({...form, anoProva: e.target.value})}
                    className="w-full h-14 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-5 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="">Selecione...</option>
                    {cfgAnos.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    placeholder="Ex: 2024"
                    value={form.anoProva}
                    onChange={e => setForm({...form, anoProva: e.target.value})}
                    className="w-full h-14 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-5 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
                  />
                )}
              </div>

              <button 
                onClick={handleSubmit}
                disabled={isSaving}
                className="h-14 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black px-10 rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSaving ? "Salvando..." : "Finalizar"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* LINGUAGENS */}
            <div className="bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm space-y-5 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/20">
                  <Book className="w-5 h-5 text-white" />
                </div>
                <span className="font-black text-slate-800 dark:text-white text-[10px] uppercase tracking-[0.25em]">Linguagens</span>
              </div>
              <div className="relative flex items-end gap-3 px-1 z-10">
                <input 
                  type="number" min="0" max="45" 
                  value={form.linguagens} 
                  onChange={e => setForm({...form, linguagens: e.target.value})} 
                  className="w-full bg-white dark:bg-[#1C1C1E] text-indigo-600 dark:text-indigo-400 font-black text-5xl px-4 py-5 rounded-2xl shadow-inner focus:outline-none focus:ring-4 focus:ring-indigo-500/10 border border-slate-100 dark:border-white/5 transition-all text-center" 
                  placeholder="00" 
                />
                <span className="text-xs font-black text-slate-300 dark:text-slate-700 absolute bottom-5 right-6 uppercase select-none opacity-50">/45</span>
              </div>
            </div>

            {/* HUMANAS */}
            <div className="bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm space-y-5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-colors"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-amber-500 p-2.5 rounded-xl shadow-lg shadow-amber-500/20">
                  <Globe2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-black text-slate-800 dark:text-white text-[10px] uppercase tracking-[0.25em]">Humanas</span>
              </div>
              <div className="relative flex items-end gap-3 px-1 z-10">
                <input 
                  type="number" min="0" max="45" 
                  value={form.humanas} 
                  onChange={e => setForm({...form, humanas: e.target.value})} 
                  className="w-full bg-white dark:bg-[#1C1C1E] text-amber-600 dark:text-amber-400 font-black text-5xl px-4 py-5 rounded-2xl shadow-inner focus:outline-none focus:ring-4 focus:ring-amber-500/10 border border-slate-100 dark:border-white/5 transition-all text-center" 
                  placeholder="00" 
                />
                <span className="text-xs font-black text-slate-300 dark:text-slate-700 absolute bottom-5 right-6 uppercase select-none opacity-50">/45</span>
              </div>
            </div>

            {/* TEMPO 1º DIA */}
            <div className="bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm space-y-5 relative overflow-hidden group hover:border-slate-500/30 transition-all">
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-slate-600 dark:bg-slate-700 p-2.5 rounded-xl shadow-lg shadow-slate-600/20">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <span className="font-black text-slate-800 dark:text-white text-[10px] uppercase tracking-[0.25em]">Tempo 1º Dia</span>
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-2xl p-3 border border-slate-100 dark:border-white/5 shadow-inner">
                  <input type="number" min="0" placeholder="0" value={form.tempo1H} onChange={e => setForm({...form, tempo1H: e.target.value})} className="w-full bg-transparent text-slate-900 dark:text-white font-black text-3xl text-center focus:outline-none focus:text-indigo-500" />
                  <p className="text-[8px] text-slate-400 font-black text-center uppercase tracking-widest mt-1">Horas</p>
                </div>
                <span className="text-2xl font-black text-slate-200 dark:text-slate-700">:</span>
                <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-2xl p-3 border border-slate-100 dark:border-white/5 shadow-inner">
                  <input type="number" min="0" max="59" placeholder="00" value={form.tempo1M} onChange={e => setForm({...form, tempo1M: e.target.value})} className="w-full bg-transparent text-slate-900 dark:text-white font-black text-3xl text-center focus:outline-none focus:text-indigo-500" />
                  <p className="text-[8px] text-slate-400 font-black text-center uppercase tracking-widest mt-1">Mins</p>
                </div>
              </div>
            </div>

            {/* MÓDULO REDAÇÃO UNIFICADO (NOTA + TEMPO) */}
            <div className="md:col-span-1 row-span-2 bg-slate-50 dark:bg-[#2C2C2E]/50 border-2 border-indigo-100 dark:border-indigo-500/20 rounded-[2rem] p-6 shadow-xl space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-600/20">
                  <PenTool className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-[0.2em]">Redação</span>
                  <p className="text-[9px] text-indigo-500 font-black uppercase tracking-widest mt-1 italic">Analítica Profissional</p>
                </div>
              </div>

              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between px-1">
                   <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pontuação Final</label>
                   <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md uppercase">Max 1000</span>
                </div>
                <input 
                  type="number" min="0" max="1000" step="20" 
                  value={form.redacao} 
                  onChange={e => setForm({...form, redacao: e.target.value})} 
                  className="w-full bg-white dark:bg-[#1C1C1E] text-indigo-600 dark:text-indigo-400 font-black text-5xl px-4 py-6 rounded-2xl shadow-inner focus:outline-none focus:ring-4 focus:ring-indigo-500/10 border border-slate-100 dark:border-white/5 transition-all text-center" 
                  placeholder="0" 
                />
              </div>

              <div className="space-y-4 relative z-10 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                   <Clock className="w-4 h-4 text-indigo-400" />
                   <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tempo de Escrita</label>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-2xl p-3 border border-slate-100 dark:border-white/5 shadow-inner">
                    <input type="number" min="0" placeholder="0" value={form.tempoRedH} onChange={e => setForm({...form, tempoRedH: e.target.value})} className="w-full bg-transparent text-slate-900 dark:text-white font-black text-2xl text-center focus:outline-none focus:text-indigo-500" />
                    <p className="text-[8px] text-slate-400 font-bold text-center uppercase tracking-tighter">Horas</p>
                  </div>
                  <span className="text-xl font-black text-slate-200 dark:text-slate-700">:</span>
                  <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-2xl p-3 border border-slate-100 dark:border-white/5 shadow-inner">
                    <input type="number" min="0" max="59" placeholder="00" value={form.tempoRedM} onChange={e => setForm({...form, tempoRedM: e.target.value})} className="w-full bg-transparent text-slate-900 dark:text-white font-black text-2xl text-center focus:outline-none focus:text-indigo-500" />
                    <p className="text-[8px] text-slate-400 font-bold text-center uppercase tracking-tighter">Mins</p>
                  </div>
                </div>
              </div>
            </div>

            {/* NATUREZAS */}
            <div className="bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm space-y-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-emerald-500 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="font-black text-slate-800 dark:text-white text-[10px] uppercase tracking-[0.25em]">Naturezas</span>
              </div>
              <div className="relative flex items-end gap-3 px-1 z-10">
                <input 
                  type="number" min="0" max="45" 
                  value={form.naturezas} 
                  onChange={e => setForm({...form, naturezas: e.target.value})} 
                  className="w-full bg-white dark:bg-[#1C1C1E] text-emerald-600 dark:text-emerald-400 font-black text-5xl px-4 py-5 rounded-2xl shadow-inner focus:outline-none focus:ring-4 focus:ring-emerald-500/10 border border-slate-100 dark:border-white/5 transition-all text-center" 
                  placeholder="00" 
                />
                <span className="text-xs font-black text-slate-300 dark:text-slate-700 absolute bottom-5 right-6 uppercase select-none opacity-50">/45</span>
              </div>
            </div>

            {/* MATEMÁTICA */}
            <div className="bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm space-y-5 relative overflow-hidden group hover:border-blue-500/30 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-blue-500 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <span className="font-black text-slate-800 dark:text-white text-[10px] uppercase tracking-[0.25em]">Matemática</span>
              </div>
              <div className="relative flex items-end gap-3 px-1 z-10">
                <input 
                  type="number" min="0" max="45" 
                  value={form.matematica} 
                  onChange={e => setForm({...form, matematica: e.target.value})} 
                  className="w-full bg-white dark:bg-[#1C1C1E] text-blue-600 dark:text-blue-400 font-black text-5xl px-4 py-5 rounded-2xl shadow-inner focus:outline-none focus:ring-4 focus:ring-blue-500/10 border border-slate-100 dark:border-white/5 transition-all text-center" 
                  placeholder="00" 
                />
                <span className="text-xs font-black text-slate-300 dark:text-slate-700 absolute bottom-5 right-6 uppercase select-none opacity-50">/45</span>
              </div>
            </div>

            {/* TEMPO 2º DIA */}
            <div className="bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm space-y-5 relative overflow-hidden group hover:border-slate-500/30 transition-all">
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-slate-600 dark:bg-slate-700 p-2.5 rounded-xl shadow-lg shadow-slate-600/20">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <span className="font-black text-slate-800 dark:text-white text-[10px] uppercase tracking-[0.25em]">Tempo 2º Dia</span>
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-2xl p-3 border border-slate-100 dark:border-white/5 shadow-inner">
                  <input type="number" min="0" placeholder="0" value={form.tempo2H} onChange={e => setForm({...form, tempo2H: e.target.value})} className="w-full bg-transparent text-slate-900 dark:text-white font-black text-3xl text-center focus:outline-none focus:text-indigo-500" />
                  <p className="text-[8px] text-slate-400 font-black text-center uppercase tracking-widest mt-1">Horas</p>
                </div>
                <span className="text-2xl font-black text-slate-200 dark:text-slate-700">:</span>
                <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-2xl p-3 border border-slate-100 dark:border-white/5 shadow-inner">
                  <input type="number" min="0" max="59" placeholder="00" value={form.tempo2M} onChange={e => setForm({...form, tempo2M: e.target.value})} className="w-full bg-transparent text-slate-900 dark:text-white font-black text-3xl text-center focus:outline-none focus:text-indigo-500" />
                  <p className="text-[8px] text-slate-400 font-black text-center uppercase tracking-widest mt-1">Mins</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
      )}

      {/* ─── ABA MÉTRICAS ─────────────────────────────────────────────────── */}
      {activeTab === "metricas" && simulados.length === 0 && (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-16 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col items-center justify-center text-center">
          <PieChart className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">Nenhum simulado registrado ainda.</p>
          <p className="text-xs text-slate-400 mt-1">Lance um resultado na aba Lançamento para ver as métricas aqui.</p>
        </div>
      )}

      {activeTab === "metricas" && simulados.length > 0 && (() => {
        const avg = (field: keyof SimuladoDB) =>
          Math.round(simulados.reduce((acc, s) => acc + (Number(s[field]) || 0), 0) / simulados.length);
        const cards = [
          { label: "Linguagens",  value: avg("linguagens"),  max: 45,   color: "text-indigo-500",  dot: "bg-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-900/20" },
          { label: "Humanas",     value: avg("humanas"),     max: 45,   color: "text-amber-500",   dot: "bg-amber-500",   bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Naturezas",   value: avg("naturezas"),   max: 45,   color: "text-emerald-500", dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Matemática",  value: avg("matematica"),  max: 45,   color: "text-blue-500",    dot: "bg-blue-500",    bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Redação",     value: avg("redacao"),     max: 1000, color: "text-rose-500",    dot: "bg-rose-500",    bg: "bg-rose-50 dark:bg-rose-900/20" },
        ];
        return (
          <>
            {/* Cards de médias */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {cards.map(c => (
                <div key={c.label} className={`${c.bg} rounded-[2rem] p-6 border border-white/30 dark:border-white/5 shadow-sm flex flex-col gap-3`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{c.label}</p>
                  </div>
                  <p className={`text-4xl font-black ${c.color}`}>
                    {c.value}
                    <span className="text-base font-bold text-slate-400 ml-1">/{c.max}</span>
                  </p>
                  <div className="w-full h-1.5 bg-white/60 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.dot}`} style={{ width: `${Math.round((c.value / c.max) * 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold">média de {simulados.length} simulado{simulados.length !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>

            {/* Histórico + Gráficos dentro da aba Métricas */}
            <section className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                  <Activity className="w-6 h-6 text-indigo-500" /> Histórico de Simulados
                </h3>
                <span className="text-xs font-black text-slate-400 bg-slate-100 dark:bg-[#2C2C2E] px-3 py-1.5 rounded-full uppercase tracking-widest">{simulados.length} registros</span>
              </div>
              <div className="space-y-3">
                {simulados.map(sim => {
                  const total = (sim.linguagens||0)+(sim.humanas||0)+(sim.naturezas||0)+(sim.matematica||0);
                  const dateStr = sim.realizado_em ? format(new Date(sim.realizado_em),"dd/MM/yyyy",{locale:ptBR}) : "";
                  return (
                    <div key={sim.id} className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-[#2C2C2E]/60 rounded-2xl px-5 py-4 border border-slate-100 dark:border-white/5 group">
                      <div className="flex-1 min-w-0"><p className="font-black text-slate-800 dark:text-white text-sm truncate">{sim.titulo_simulado}</p><p className="text-xs text-slate-400 mt-0.5">{dateStr}</p></div>
                      <div className="hidden sm:flex items-center gap-4 text-xs font-bold text-slate-500">
                        <span className="text-indigo-500">{total}/180 obj.</span>
                        {sim.redacao > 0 && <span className="text-rose-500">✍️ {sim.redacao} red.</span>}
                        {sim.tempo_total_min > 0 && <span className="text-slate-400">⏱ {sim.tempo_total_min} min</span>}
                      </div>
                      <button onClick={() => handleDelete(sim.id)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100" title="Remover"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div><h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3"><PieChart className="w-7 h-7 text-indigo-500"/> Análise Geral de Acertos</h3><p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Evolução Histórica das Objetivas</p></div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 px-6 py-2 rounded-full border border-indigo-100 dark:border-indigo-900/30"><span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest italic">Visão Consolidada</span></div>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getGeneralAnalysisData()} margin={{top:20,right:30,left:0,bottom:20}}>
                    <defs><linearGradient id="gGr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity={0.8}/><stop offset="100%" stopColor="#818cf8" stopOpacity={0.1}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5}/>
                    <XAxis dataKey="display" axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#64748b',fontWeight:'bold'}} dy={10}/>
                    <YAxis domain={[0,180]} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#64748b',fontWeight:'bold'}}/>
                    <Tooltip cursor={{fill:'rgba(99,102,241,0.05)'}} content={<TooltipGeral/>}/>
                    <Legend verticalAlign="top" height={40} iconType="circle"/>
                    <Bar dataKey="acertos" fill="url(#gGr)" radius={[12,12,0,0]} barSize={60} name="Total de Acertos"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div><h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3"><Book className="w-7 h-7 text-indigo-500"/> Análise: 1º Dia</h3><p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Linguagens e Ciências Humanas</p></div>
                <div className="bg-amber-50 dark:bg-amber-900/20 px-6 py-2 rounded-full border border-amber-100 dark:border-amber-900/30"><span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest italic">Performance Objetivas</span></div>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={getChartDataDay1()} margin={{top:20,right:30,left:0,bottom:20}}>
                    <defs>
                      <linearGradient id="lG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.8}/><stop offset="100%" stopColor="#6366f1" stopOpacity={0.1}/></linearGradient>
                      <linearGradient id="hG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8}/><stop offset="100%" stopColor="#f59e0b" stopOpacity={0.1}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5}/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#64748b',fontWeight:'bold'}} dy={10}/>
                    <YAxis yAxisId="left" domain={[0,45]} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#64748b',fontWeight:'bold'}} label={{value:'Acertos',angle:-90,position:'insideLeft',offset:-5,fontStyle:'bold',fontSize:10,fill:'#94a3b8'}}/>
                    <YAxis yAxisId="right" orientation="right" domain={[0,300]} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#64748b',fontWeight:'bold'}} label={{value:'Tempo (Min)',angle:90,position:'insideRight',offset:-5,fontStyle:'bold',fontSize:10,fill:'#94a3b8'}}/>
                    <Tooltip content={<TooltipD1/>}/><Legend verticalAlign="top" height={40} iconType="circle"/>
                    <Bar yAxisId="left" dataKey="linguagens" fill="url(#lG)" radius={[8,8,0,0]} barSize={25} name="Linguagens"/>
                    <Bar yAxisId="left" dataKey="humanas" fill="url(#hG)" radius={[8,8,0,0]} barSize={25} name="Ciências Humanas"/>
                    <Line yAxisId="right" type="monotone" dataKey="tempo1" stroke="#64748b" strokeWidth={4} dot={{r:6,fill:'#64748b',strokeWidth:3,stroke:'#fff'}} name="Tempo D1 (Min)"/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div><h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 flex items-center gap-3"><PenTool className="w-7 h-7"/> Correlação: Redação</h3><p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Produtividade e Eficiência na Escrita</p></div>
                <div className="bg-rose-50 dark:bg-rose-900/20 px-6 py-2 rounded-full border border-rose-100 dark:border-rose-900/30"><span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest italic">Análise de Rendimento</span></div>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={getRedacaoPerformanceData()} margin={{top:20,right:30,left:0,bottom:20}}>
                    <defs><linearGradient id="rG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8}/><stop offset="100%" stopColor="#f43f5e" stopOpacity={0.1}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5}/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#64748b',fontWeight:'bold'}} dy={10}/>
                    <YAxis yAxisId="left" domain={[0,1000]} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#f43f5e',fontWeight:'bold'}} label={{value:'Nota (0-1000)',angle:-90,position:'insideLeft',offset:-5,fontStyle:'bold',fontSize:10,fill:'#f43f5e'}}/>
                    <YAxis yAxisId="right" orientation="right" domain={[0,150]} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#64748b',fontWeight:'bold'}} label={{value:'Tempo (Minutos)',angle:90,position:'insideRight',offset:-5,fontStyle:'bold',fontSize:10,fill:'#94a3b8'}}/>
                    <Tooltip content={<TooltipRedacao/>}/><Legend verticalAlign="top" height={40} iconType="circle"/>
                    <Bar yAxisId="left" dataKey="nota" fill="url(#rG)" radius={[12,12,0,0]} barSize={45} name="Pontuação Redação"/>
                    <Line yAxisId="right" type="stepAfter" dataKey="tempo" stroke="#64748b" strokeWidth={4} dot={{r:8,fill:'#64748b',strokeWidth:4,stroke:'#fff'}} name="Minutos Gastos"/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div><h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3"><Activity className="w-7 h-7 text-blue-500"/> Análise: 2º Dia</h3><p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Natureza e Matemática</p></div>
                <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-2 rounded-full border border-blue-100 dark:border-blue-900/30"><span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest italic">Performance Objetivas</span></div>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={getChartDataDay2()} margin={{top:20,right:30,left:0,bottom:20}}>
                    <defs>
                      <linearGradient id="mG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1}/></linearGradient>
                      <linearGradient id="nG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/><stop offset="100%" stopColor="#10b981" stopOpacity={0.1}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5}/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#64748b',fontWeight:'bold'}} dy={10}/>
                    <YAxis yAxisId="left" domain={[0,45]} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#64748b',fontWeight:'bold'}} label={{value:'Acertos',angle:-90,position:'insideLeft',offset:-5,fontStyle:'bold',fontSize:10,fill:'#94a3b8'}}/>
                    <YAxis yAxisId="right" orientation="right" domain={[0,300]} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#64748b',fontWeight:'bold'}} label={{value:'Tempo (Min)',angle:90,position:'insideRight',offset:-5,fontStyle:'bold',fontSize:10,fill:'#94a3b8'}}/>
                    <Tooltip content={<TooltipD2/>}/><Legend verticalAlign="top" height={40} iconType="circle"/>
                    <Bar yAxisId="left" dataKey="matematica" fill="url(#mG)" radius={[8,8,0,0]} barSize={35} name="Matemática"/>
                    <Bar yAxisId="left" dataKey="naturezas" fill="url(#nG)" radius={[8,8,0,0]} barSize={35} name="Natureza"/>
                    <Line yAxisId="right" type="monotone" dataKey="tempo2" stroke="#64748b" strokeWidth={4} dot={{r:6,fill:'#64748b',strokeWidth:3,stroke:'#fff'}} name="Tempo D2 (Min)"/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        );
      })()}

      <AnimatePresence>
        {isFocusMode && (
          <SimulatorOverlay
            getDisplayTime={getDisplayTime}
            timeLeft={timeLeft}
            timerConfig={timerConfig}
            setTimerConfig={setTimerConfig}
            isTimerRunning={isTimerRunning}
            pauseTimer={pauseTimer}
            startTimer={startTimer}
            resetTimer={resetTimer}
            showExactTime={showExactTime}
            setShowExactTime={setShowExactTime}
            onClose={() => setIsFocusMode(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}



// Sub-componente para o Overlay do Simulado (Modo Zen)
function SimulatorOverlay({ 
  getDisplayTime, 
  timeLeft,
  timerConfig,
  setTimerConfig,
  isTimerRunning, 
  pauseTimer, 
  startTimer, 
  resetTimer, 
  showExactTime, 
  setShowExactTime, 
  onClose 
}: any) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-10 text-white overflow-hidden font-sans"
    >
      {/* ProgressBar Top */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5 z-20">
         <motion.div 
           initial={{ width: "0%" }}
           animate={{ width: "100%" }}
           transition={{ duration: 1, ease: "linear" }}
           className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.6)]"
         />
      </div>

      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px] -mr-60 -mt-60 z-0 opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[120px] -ml-40 -mb-40 z-0 opacity-30"></div>
      
      {/* Header Overlay */}
      <div className="absolute top-12 left-12 right-12 flex justify-between items-center z-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl">
            <Activity className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tighter uppercase italic">Simulado Imersivo</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.4em] mt-1">Status: {isTimerRunning ? 'Cronomêtro Ativo' : 'Pausado'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowExactTime(!showExactTime)}
            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all border border-white/10 backdrop-blur-md shadow-lg"
          >
            {showExactTime ? "Mascara on" : "Ver exatidão"}
          </button>
          <button 
            onClick={onClose}
            className="w-16 h-16 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-white rounded-2xl flex items-center justify-center transition-all border border-white/10 backdrop-blur-md shadow-lg"
          >
            <X className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* Timer Central */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative">
           <div className="absolute inset-0 bg-white/5 blur-[100px] rounded-full scale-150 -z-10"></div>
           <div className="text-[16rem] md:text-[24rem] font-black font-mono tracking-tighter tabular-nums leading-none tracking-[-0.08em] select-none text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-500/20 drop-shadow-[0_35px_35px_rgba(0,0,0,0.6)]">
             {getDisplayTime().split(':')[0]}:{getDisplayTime().split(':')[1]}
           </div>
           <div className="absolute -bottom-8 right-0 text-5xl md:text-7xl font-black font-mono text-indigo-500/60 drop-shadow-lg">
             :{getDisplayTime().split(':')[2]}
           </div>
        </div>

        {/* --- INPUTS DE TEMPO NO MODO FOCO --- */}
        {!isTimerRunning && timeLeft === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-6 items-center bg-white/5 backdrop-blur-3xl px-12 py-8 rounded-[3rem] border border-white/10 mt-12 shadow-2xl"
          >
            <div className="flex flex-col items-center">
              <input 
                type="number" min="0" 
                value={timerConfig.hours} 
                onChange={e => setTimerConfig({...timerConfig, hours: parseInt(e.target.value)||0})} 
                className="w-24 bg-transparent text-white font-black text-5xl text-center focus:outline-none focus:text-indigo-400 transition-colors" 
              />
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Horas</span>
            </div>
            <span className="text-slate-700 font-black text-4xl mb-6">:</span>
            <div className="flex flex-col items-center">
              <input 
                type="number" min="0" max="59" 
                value={timerConfig.minutes} 
                onChange={e => setTimerConfig({...timerConfig, minutes: parseInt(e.target.value)||0})} 
                className="w-24 bg-transparent text-white font-black text-5xl text-center focus:outline-none focus:text-indigo-400 transition-colors" 
              />
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Minutos</span>
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-center gap-8 mt-24">
          <button 
            onClick={isTimerRunning ? pauseTimer : startTimer}
            className={`w-36 h-36 rounded-[3rem] flex items-center justify-center transition-all active:scale-90 shadow-[0_20px_50px_rgba(0,0,0,0.4)] ${isTimerRunning ? 'bg-amber-500 shadow-amber-500/20' : 'bg-white text-slate-950 shadow-white/10'}`}
          >
            {isTimerRunning ? <Pause className="w-14 h-14 fill-current" /> : <Play className="w-14 h-14 fill-current ml-2" />}
          </button>
          <button 
            onClick={resetTimer}
            className="w-36 h-36 bg-slate-800/80 hover:bg-slate-700 text-white rounded-[3rem] flex items-center justify-center transition-all active:scale-90 shadow-2xl border border-white/5 backdrop-blur-md"
          >
            <X className="w-12 h-12" />
          </button>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center z-10">
        <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-2xl px-10 py-4 rounded-full border border-white/5 shadow-2xl">
          <div className={`w-2.5 h-2.5 rounded-full ${isTimerRunning ? 'bg-indigo-500 animate-pulse' : 'bg-slate-600'}`}></div>
          <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-[10px]">Sinapse Mentoria • High Performance Mode</p>
        </div>
      </div>
    </motion.div>
  );
}
