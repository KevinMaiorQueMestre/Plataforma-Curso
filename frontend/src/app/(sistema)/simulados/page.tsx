"use client";

import { useState, useEffect } from "react";
import { MOCK_SIMULADOS } from "@/lib/kevquestLogic";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { toast } from "sonner";
import { Activity, Book, Globe2, Leaf, Calculator, PenTool, Send, Clock, Play, Pause, RotateCcw, PieChart } from "lucide-react";
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
    tempoH: "",
    tempoM: ""
  });

  // Timer State
  const [timerConfig, setTimerConfig] = useState({ hours: 5, minutes: 30 });
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showExactTime, setShowExactTime] = useState(false);

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
    if (!form.nomeProva || !form.linguagens || !form.humanas || !form.naturezas || !form.matematica || !form.redacao || (!form.tempoH && !form.tempoM)) {
      toast.error("Preencha o nome da prova e as notas de todas áreas (inclusive o tempo gasto)!");
      return;
    }

    const nLing = parseInt(form.linguagens);
    const nHum = parseInt(form.humanas);
    const nNat = parseInt(form.naturezas);
    const nMat = parseInt(form.matematica);
    const nRed = parseInt(form.redacao);
    
    // Converte H:M para minutos totais para o gráfico
    const h = parseInt(form.tempoH) || 0;
    const m = parseInt(form.tempoM) || 0;
    const nTemp = h * 60 + m;

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
      tempoH: "",
      tempoM: ""
    });
  };

  const getChartData = (domain: string) => {
    return simulados.map((sim, index) => {
      const dateStr = sim.dataIso ? format(new Date(sim.dataIso), "dd/MM", { locale: ptBR }) : "";
      return {
        name: `${sim.nomeProva} (${dateStr})`,
        pontos: sim[domain] || 0,
        data: dateStr
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
        tempo: Number(sim.tempoGasto) || 0
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

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            
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

            {/* NATUREZAS */}
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-emerald-400">
              <div className="flex items-center gap-2 mb-3">
                <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">Naturezas</span>
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
                <span className="font-bold text-blue-900 dark:text-blue-300 text-sm">Matemática</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="45" value={form.matematica} onChange={e => setForm({...form, matematica: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-blue-900 dark:text-blue-300 font-black text-2xl px-3 py-2 rounded-lg text-center shadow-sm placeholder-blue-200 dark:placeholder-blue-800 focus:outline-none" placeholder="00" />
                <span className="text-xs font-bold text-blue-300 dark:text-blue-500">/ 45</span>
              </div>
            </div>

            {/* REDAÇÃO */}
            <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-900/50 rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-rose-400 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <PenTool className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span className="font-bold text-rose-900 dark:text-rose-300 text-sm">Redação</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="1000" step="20" value={form.redacao} onChange={e => setForm({...form, redacao: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-rose-900 dark:text-rose-300 font-black text-2xl px-3 py-2 rounded-lg text-center shadow-sm placeholder-rose-200 dark:placeholder-rose-800 focus:outline-none" placeholder="0" />
                <span className="text-xs font-bold text-rose-300 dark:text-rose-500">/ 1000</span>
              </div>
            </div>

            {/* TEMPO GASTO */}
            <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-slate-400 col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="font-bold text-slate-800 dark:text-slate-300 text-sm">Tempo Total Realizado</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center flex-1">
                  <input type="number" min="0" placeholder="00" value={form.tempoH} onChange={e => setForm({...form, tempoH: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-slate-100 font-black text-xl py-2 rounded-lg text-center shadow-sm focus:outline-none" />
                  <span className="text-[9px] uppercase font-bold text-slate-400 mt-1">H</span>
                </div>
                <span className="font-bold text-slate-400 pb-5">:</span>
                <div className="flex flex-col items-center flex-1">
                  <input type="number" min="0" max="59" placeholder="00" value={form.tempoM} onChange={e => setForm({...form, tempoM: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-slate-100 font-black text-xl py-2 rounded-lg text-center shadow-sm focus:outline-none" />
                  <span className="text-[9px] uppercase font-bold text-slate-400 mt-1">M</span>
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

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Gráfico LINGUAGENS */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
            <h3 className="text-indigo-900 font-bold mb-4 flex items-center gap-2"><Book className="w-4 h-4 text-indigo-500" /> Evolução em Linguagens</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData('linguagens')} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis domain={[0, 45]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="pontos" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} name="Acertos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico HUMANAS */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
            <h3 className="text-amber-900 font-bold mb-4 flex items-center gap-2"><Globe2 className="w-4 h-4 text-amber-500" /> Evolução em Humanas</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData('humanas')} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis domain={[0, 45]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="pontos" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} name="Acertos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico NATUREZAS */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
            <h3 className="text-emerald-900 font-bold mb-4 flex items-center gap-2"><Leaf className="w-4 h-4 text-emerald-500" /> Evolução em Naturezas</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData('naturezas')} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis domain={[0, 45]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="pontos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} name="Acertos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico MATEMÁTICA */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
            <h3 className="text-blue-900 font-bold mb-4 flex items-center gap-2"><Calculator className="w-4 h-4 text-blue-500" /> Evolução em Matemática</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData('matematica')} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis domain={[0, 45]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="pontos" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} name="Acertos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico REDAÇÃO */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
            <h3 className="text-rose-900 font-bold mb-4 flex items-center gap-2"><PenTool className="w-4 h-4 text-rose-500" /> Teto de Pontos - Redação</h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData('redacao')} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis domain={[0, 1000]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="pontos" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={40} name="Pontuação" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico TEMPO GASTO ISOLADO */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
            <h3 className="text-slate-900 dark:text-slate-300 font-bold mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-500" /> Histórico de Tempo (Minutos)</h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData('tempoGasto')} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="pontos" fill="#64748b" radius={[6, 6, 0, 0]} barSize={40} name="Minutos Gastos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </section>
        </div>
      )}

    </div>
  );
}
