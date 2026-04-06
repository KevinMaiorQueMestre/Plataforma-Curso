"use client";

import { useState, useEffect } from "react";
import { MOCK_SIMULADOS } from "@/lib/kevquestLogic";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Book, Globe2, Leaf, Calculator, PenTool, Send, Clock, Play, Pause, RotateCcw, PieChart, Maximize2, Minimize2 } from "lucide-react";
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

export default function SimuladosPage() {
  const [simulados, setSimulados] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("kevquest_simulados");
    if (stored) {
      setSimulados(JSON.parse(stored));
    } else {
      setSimulados(MOCK_SIMULADOS);
      localStorage.setItem("kevquest_simulados", JSON.stringify(MOCK_SIMULADOS));
    }
    setIsLoaded(true);
  }, []);

  const [form, setForm] = useState({
    nomeProva: "",
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
    setTimeLeft(timerConfig.hours * 3600 + timerConfig.minutes * 60);
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

  const handleSubmit = () => {
    if (!form.nomeProva || !form.linguagens || !form.humanas || !form.naturezas || !form.matematica || !form.redacao || (!form.tempo1H && !form.tempo1M && !form.tempo2H && !form.tempo2M)) {
      toast.error("Preencha o nome da prova e as notas de todas áreas (inclusive o tempo gasto)!");
      return;
    }

    const nLing = parseInt(form.linguagens);
    const nHum = parseInt(form.humanas);
    const nNat = parseInt(form.naturezas);
    const nMat = parseInt(form.matematica);
    const nRed = parseInt(form.redacao);
    
    // Tempos individuais
    const t1 = (parseInt(form.tempo1H) || 0) * 60 + (parseInt(form.tempo1M) || 0);
    const t2 = (parseInt(form.tempo2H) || 0) * 60 + (parseInt(form.tempo2M) || 0);
    const tRed = (parseInt(form.tempoRedH) || 0) * 60 + (parseInt(form.tempoRedM) || 0);
    const nTemp = t1 + t2 + tRed;

    if (nLing > 45 || nHum > 45 || nNat > 45 || nMat > 45 || nRed > 1000) {
      toast.error("Número de acertos ultrapassa o limite permitido do ENEM.");
      return;
    }

    const novoSimulado = {
      id: "sim_" + Date.now(),
      dataIso: new Date().toISOString(),
      nomeProva: form.nomeProva,
      linguagens: nLing,
      humanas: nHum,
      naturezas: nNat,
      matematica: nMat,
      redacao: nRed,
      tempo1: t1,
      tempo2: t2,
      tempoRedacao: tRed,
      tempoGasto: nTemp
    };

    const novaLista = [...simulados, novoSimulado];
    setSimulados(novaLista);
    localStorage.setItem("kevquest_simulados", JSON.stringify(novaLista));
    toast.success("Desempenho registrado com sucesso!");
    
    setForm({
      nomeProva: "",
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
  };

  const getChartDataDay1 = () => {
    return simulados.map((sim) => {
      const dateStr = sim.dataIso ? format(new Date(sim.dataIso), "dd/MM", { locale: ptBR }) : "";
      return {
        name: `${sim.nomeProva} (${dateStr})`,
        linguagens: Number(sim.linguagens) || 0,
        humanas: Number(sim.humanas) || 0,
        redacao: Number(sim.redacao) || 0,
        tempo1: Number(sim.tempo1) || 0,
        tempoRedacao: Number(sim.tempoRedacao) || 0,
      };
    });
  };

  const getChartDataDay2 = () => {
    return simulados.map((sim) => {
      const dateStr = sim.dataIso ? format(new Date(sim.dataIso), "dd/MM", { locale: ptBR }) : "";
      return {
        name: `${sim.nomeProva} (${dateStr})`,
        matematica: Number(sim.matematica) || 0,
        naturezas: Number(sim.naturezas) || 0,
        tempo2: Number(sim.tempo2) || 0,
      };
    });
  };

  const getGeneralAnalysisData = () => {
    return simulados.map(sim => {
      const dateStr = sim.dataIso ? format(new Date(sim.dataIso), "dd/MM", { locale: ptBR }) : "";
      const total = (Number(sim.linguagens) || 0) + (Number(sim.humanas) || 0) + (Number(sim.naturezas) || 0) + (Number(sim.matematica) || 0);
      return {
        name: sim.nomeProva,
        display: `${sim.nomeProva} (${dateStr})`,
        acertos: total,
        tempo: Number(sim.tempoGasto) || 0,
        redacao: Number(sim.redacao) || 0
      };
    });
  };

  if (!isLoaded) return <div className="p-8">Carregando painel de Simulados...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl pb-20">
      <header className="mb-4">
        <h1 className="text-3xl font-black text-slate-800 dark:text-[#FFFFFF] tracking-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          Módulo de Simulados
        </h1>
        <p className="text-slate-500 dark:text-[#A1A1AA] mt-1 font-medium">Lançamento de Acertos em padrão ENEM para acompanhamento da T.R.I.</p>
      </header>

      {/* --- CRONÔMETRO REVERSO --- */}
      <section className="bg-slate-900 dark:bg-[#1C1C1E] rounded-[2rem] p-6 pt-8 pb-8 shadow-sm border border-slate-800 dark:border-[#2C2C2E] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mx-10 -my-10 z-0 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-4">
           <div className="bg-slate-800 dark:bg-[#2C2C2E] p-4 rounded-2xl">
             <Clock className="w-8 h-8 text-indigo-400" />
           </div>
           <div>
             <h2 className="text-xl font-black text-white">Modo Simulado (Timer)</h2>
             <p className="text-sm text-slate-400 font-medium">Configure o tempo e foque 100% na prova.</p>
           </div>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-8 w-full">
           {!isTimerRunning && timeLeft === 0 && (
             <div className="flex gap-2 items-center bg-slate-800 px-6 py-3 rounded-2xl border border-slate-700 shadow-xl scale-110">
                <div className="flex flex-col items-center">
                  <input type="number" min="0" value={timerConfig.hours} onChange={e => setTimerConfig({...timerConfig, hours: parseInt(e.target.value)||0})} className="w-12 bg-transparent text-white font-black text-xl text-center focus:outline-none" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Horas</span>
                </div>
                <span className="text-slate-600 font-black text-xl pb-4">:</span>
                <div className="flex flex-col items-center">
                  <input type="number" min="0" max="59" value={timerConfig.minutes} onChange={e => setTimerConfig({...timerConfig, minutes: parseInt(e.target.value)||0})} className="w-12 bg-transparent text-white font-black text-xl text-center focus:outline-none" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Mins</span>
                </div>
             </div>
           )}
           
           <div className="flex flex-col items-center gap-3 relative group">
             <div className="text-5xl md:text-7xl font-black text-white font-mono tracking-tighter px-10 py-4 rounded-[2.5rem] bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl ring-1 ring-white/5">
               {getDisplayTime()}
             </div>
             {isTimerRunning && (
                <button onClick={() => setShowExactTime(!showExactTime)} className="text-[10px] uppercase font-bold text-slate-500 hover:text-indigo-400 transition-colors tracking-widest">
                  {showExactTime ? "Esconder (Blocos 30min)" : "Ver tempo exato"}
                </button>
             )}
           </div>

           <div className="flex gap-3 z-20">
              <button onClick={isTimerRunning ? pauseTimer : startTimer} className="w-20 h-20 flex items-center justify-center rounded-3xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-2xl shadow-indigo-500/20 active:scale-90 hover:-translate-y-1">
                {isTimerRunning ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
              </button>
              <button onClick={resetTimer} className="w-20 h-20 flex items-center justify-center rounded-3xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shadow-xl active:scale-90 border border-slate-700">
                <RotateCcw className="w-8 h-8" />
              </button>
              <button 
                onClick={() => setIsFocusMode(true)}
                className="w-20 h-20 flex items-center justify-center rounded-3xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shadow-xl active:scale-90 border border-slate-700"
                title="Tela Cheia"
              >
                <Maximize2 className="w-8 h-8" />
              </button>
           </div>
        </div>
      </section>

      {/* --- FORMULÁRIO DE LANÇAMENTO --- */}
      <section className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-500/10 rounded-full blur-3xl -mx-10 -my-10 z-0 opacity-50 pointer-events-none"></div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-sm">
              <label className="block text-xs font-bold text-slate-500 dark:text-[#A1A1AA] mb-2 uppercase tracking-wide">Qual foi o Simulado?</label>
              <input 
                type="text" 
                placeholder="Ex: ENEM 2023 - 1° Aplicação"
                value={form.nomeProva}
                onChange={e => setForm({...form, nomeProva: e.target.value})}
                className="w-full border-2 border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-[#FFFFFF] bg-white dark:bg-[#1C1C1E] shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold transition-all"
              />
            </div>
            
            <button 
              onClick={handleSubmit}
              className="bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-slate-900/20 dark:shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Enviar Resultado
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* --- LINHA 1 --- */}

            {/* LINGUAGENS */}
            <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-indigo-400">
              <div className="flex items-center gap-2 mb-3">
                <Book className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-indigo-900 dark:text-indigo-300 text-sm">Linguagens</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="45" value={form.linguagens} onChange={e => setForm({...form, linguagens: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-indigo-900 dark:text-indigo-300 font-black text-2xl px-3 py-2 rounded-lg text-center shadow-sm placeholder-indigo-200 dark:placeholder-indigo-800 focus:outline-none" placeholder="00" />
                <span className="text-xs font-bold text-indigo-300 dark:text-indigo-500">/ 45</span>
              </div>
            </div>

            {/* HUMANAS */}
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-amber-400">
              <div className="flex items-center gap-2 mb-3">
                <Globe2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="font-bold text-amber-900 dark:text-amber-300 text-sm">Humanas</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="45" value={form.humanas} onChange={e => setForm({...form, humanas: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-amber-900 dark:text-amber-300 font-black text-2xl px-3 py-2 rounded-lg text-center shadow-sm placeholder-amber-200 dark:placeholder-amber-800 focus:outline-none" placeholder="00" />
                <span className="text-xs font-bold text-amber-300 dark:text-amber-500">/ 45</span>
              </div>
            </div>

            {/* TEMPO 1º DIA */}
            <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-slate-400">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="font-bold text-slate-800 dark:text-slate-300 text-[13px] leading-tight flex-1">Tempo 1º Dia</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center flex-1">
                  <input type="number" min="0" placeholder="0" value={form.tempo1H} onChange={e => setForm({...form, tempo1H: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-slate-100 font-black text-xl py-2 rounded-lg text-center shadow-sm focus:outline-none" />
                </div>
                <span className="font-bold text-slate-400 pb-1">:</span>
                <div className="flex flex-col items-center flex-1">
                  <input type="number" min="0" max="59" placeholder="00" value={form.tempo1M} onChange={e => setForm({...form, tempo1M: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-slate-100 font-black text-xl py-2 rounded-lg text-center shadow-sm focus:outline-none" />
                </div>
              </div>
            </div>

            {/* REDAÇÃO NOTA */}
            <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-900/50 rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-rose-400">
              <div className="flex items-center gap-2 mb-3">
                <PenTool className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span className="font-bold text-rose-900 dark:text-rose-300 text-[13px]">Nota Redação</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="1000" step="20" value={form.redacao} onChange={e => setForm({...form, redacao: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-rose-900 dark:text-rose-300 font-black text-2xl px-3 py-2 rounded-lg text-center shadow-sm placeholder-rose-200 dark:placeholder-rose-800 focus:outline-none" placeholder="0" />
                <span className="text-[10px] font-bold text-rose-300 dark:text-rose-500">/ 1000</span>
              </div>
            </div>

            {/* --- LINHA 2 --- */}

            {/* NATUREZAS */}
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-emerald-400">
              <div className="flex items-center gap-2 mb-3">
                <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-emerald-900 dark:text-emerald-300 text-[13px]">Naturezas</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="45" value={form.naturezas} onChange={e => setForm({...form, naturezas: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-emerald-900 dark:text-emerald-300 font-black text-2xl px-3 py-2 rounded-lg text-center shadow-sm placeholder-emerald-200 dark:placeholder-emerald-800 focus:outline-none" placeholder="00" />
                <span className="text-xs font-bold text-emerald-300 dark:text-emerald-500">/ 45</span>
              </div>
            </div>

            {/* MATEMÁTICA */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-blue-400">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-blue-900 dark:text-blue-300 text-[13px]">Matemática</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="45" value={form.matematica} onChange={e => setForm({...form, matematica: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-blue-900 dark:text-blue-300 font-black text-2xl px-3 py-2 rounded-lg text-center shadow-sm placeholder-blue-200 dark:placeholder-blue-800 focus:outline-none" placeholder="00" />
                <span className="text-xs font-bold text-blue-300 dark:text-blue-500">/ 45</span>
              </div>
            </div>

            {/* TEMPO 2º DIA */}
            <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-slate-400">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="font-bold text-slate-800 dark:text-slate-300 text-[13px] leading-tight flex-1">Tempo 2º Dia</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center flex-1">
                  <input type="number" min="0" placeholder="0" value={form.tempo2H} onChange={e => setForm({...form, tempo2H: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-slate-100 font-black text-xl py-2 rounded-lg text-center shadow-sm focus:outline-none" />
                </div>
                <span className="font-bold text-slate-400 pb-1">:</span>
                <div className="flex flex-col items-center flex-1">
                  <input type="number" min="0" max="59" placeholder="00" value={form.tempo2M} onChange={e => setForm({...form, tempo2M: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-slate-100 font-black text-xl py-2 rounded-lg text-center shadow-sm focus:outline-none" />
                </div>
              </div>
            </div>

            {/* TEMPO REDAÇÃO */}
            <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-slate-400">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="font-bold text-slate-800 dark:text-slate-300 text-[13px] leading-tight flex-1">Tempo Redação</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center flex-1">
                  <input type="number" min="0" placeholder="0" value={form.tempoRedH} onChange={e => setForm({...form, tempoRedH: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-slate-100 font-black text-xl py-2 rounded-lg text-center shadow-sm focus:outline-none" />
                </div>
                <span className="font-bold text-slate-400 pb-1">:</span>
                <div className="flex flex-col items-center flex-1">
                  <input type="number" min="0" max="59" placeholder="00" value={form.tempoRedM} onChange={e => setForm({...form, tempoRedM: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-slate-100 font-black text-xl py-2 rounded-lg text-center shadow-sm focus:outline-none" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- GRÁFICOS DE EVOLUÇÃO --- */}
      {simulados.length > 0 && (
        <div className="space-y-6">
          {/* Gráfico de Análise Geral */}
          <section className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
             <h3 className="text-slate-900 dark:text-slate-100 font-bold mb-4 flex items-center gap-2">
               <PieChart className="w-5 h-5 text-indigo-500" /> 
               Análise Geral: Evolução de Acertos Totais
             </h3>
             <div className="h-[22rem] w-full">
               <ResponsiveContainer width="100%" height="100%" key={`general-${simulados.length}`}>
                 <BarChart data={getGeneralAnalysisData()} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                   <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="display" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                   <YAxis domain={[0, 180]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                   <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                   <Legend verticalAlign="top" height={36}/>
                   <Bar dataKey="acertos" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={50} name="Total de Acertos (Objetivas)" />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </section>

          <section className="grid grid-cols-1 gap-8">
            
            {/* Gráfico INTEGRADO 1º DIA + REDAÇÃO */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <PenTool className="w-6 h-6 text-indigo-500" />
                    Análise Integrada: 1º Dia + Redação
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Acertos, Nota e Gestão de Tempo</p>
                </div>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={getChartDataDay1()} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                    <YAxis yAxisId="left" domain={[0, 45]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Acertos', angle: -90, position: 'insideLeft', offset: -5, fontStyle: 'bold', fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 1000]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Nota/Tempo', angle: 90, position: 'insideRight', offset: -5, fontStyle: 'bold', fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="top" height={36}/>
                    <Bar yAxisId="left" dataKey="linguagens" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={25} name="Acertos Ling." />
                    <Bar yAxisId="left" dataKey="humanas" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={25} name="Acertos Hum." />
                    <Bar yAxisId="right" dataKey="redacao" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={35} name="Nota Redação" />
                    <Line yAxisId="right" type="monotone" dataKey="tempo1" stroke="#64748b" strokeWidth={3} dot={{ r: 6 }} name="Minutos (D1)" />
                    <Line yAxisId="right" type="monotone" dataKey="tempoRedacao" stroke="#2dd4bf" strokeWidth={3} dot={{ r: 6 }} name="Minutos (Red)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico INTEGRADO 2º DIA */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <Activity className="w-6 h-6 text-blue-500" />
                    Análise Integrada: 2º Dia
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Ciências da Natureza, Matemática e Tempo</p>
                </div>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={getChartDataDay2()} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                    <YAxis yAxisId="left" domain={[0, 45]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Acertos', angle: -90, position: 'insideLeft', offset: -5, fontStyle: 'bold', fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 400]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Tempo (Min)', angle: 90, position: 'insideRight', offset: -5, fontStyle: 'bold', fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="top" height={36}/>
                    <Bar yAxisId="left" dataKey="matematica" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={35} name="Acertos Mat." />
                    <Bar yAxisId="left" dataKey="naturezas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={35} name="Acertos Nat." />
                    <Line yAxisId="right" type="monotone" dataKey="tempo2" stroke="#64748b" strokeWidth={3} dot={{ r: 6 }} name="Minutos (D2)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

          </section>
        </div>
      )}

      <AnimatePresence>
        {isFocusMode && (
          <SimulatorOverlay 
            getDisplayTime={getDisplayTime}
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
      className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-10 text-white overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-white/5 z-20">
         <motion.div 
           initial={{ width: "0%" }}
           animate={{ width: "100%" }}
           transition={{ duration: 1, ease: "linear" }}
           className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
         />
      </div>

      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] -mr-40 -mt-40 z-0"></div>
      
      {/* Header Overlay */}
      <div className="absolute top-10 left-10 right-10 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tighter">Modo Simulado ENEM</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">Foco Total • Ambiente Controlado</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowExactTime(!showExactTime)}
            className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/10"
          >
            {showExactTime ? "Esconder Frações" : "Ver Tempo Exato"}
          </button>
          <button 
            onClick={onClose}
            className="w-14 h-14 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex items-center justify-center transition-all border border-white/10"
          >
            <Minimize2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Timer Central */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="relative z-10 text-center"
      >
        <div className="text-[14rem] md:text-[22rem] font-black font-mono tracking-tighter tabular-nums leading-none mb-12 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-indigo-500/40 drop-shadow-[0_25px_25px_rgba(0,0,0,0.5)]">
          {getDisplayTime()}
        </div>

        <div className="flex items-center justify-center gap-6">
          <button 
            onClick={isTimerRunning ? pauseTimer : startTimer}
            className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center transition-all active:scale-90 shadow-2xl ${isTimerRunning ? 'bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
          >
            {isTimerRunning ? <Pause className="w-12 h-12 fill-current" /> : <Play className="w-12 h-12 fill-current ml-2" />}
          </button>
          <button 
            onClick={resetTimer}
            className="w-32 h-32 bg-slate-800 hover:bg-slate-700 text-white rounded-[2.5rem] flex items-center justify-center transition-all active:scale-90 shadow-xl border border-white/10"
          >
            <RotateCcw className="w-10 h-10" />
          </button>
        </div>
      </motion.div>

      <div className="absolute bottom-12 left-0 right-0 text-center z-10">
        <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-md px-8 py-3 rounded-full border border-white/10">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Simulando condições reais de prova</p>
        </div>
      </div>
    </motion.div>
  );
}
