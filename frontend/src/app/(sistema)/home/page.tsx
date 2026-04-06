"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Calendar, 
  Clock, 
  Trophy, 
  MessageSquare, 
  ChevronRight, 
  Star,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const TODAY = new Date();

  useEffect(() => {
    setIsLoaded(true);
    
    // Carregar eventos do calendário
    const savedEvents = localStorage.getItem('calendario_eventos');
    const hojeStr = new Date().toISOString().split('T')[0];
    
    if (savedEvents) {
      try {
        const allEvents = JSON.parse(savedEvents);
        const todayEvents = allEvents.filter((e: any) => e.dateIso === hojeStr);
        setEvents(todayEvents);
      } catch (e) {
        console.error("Erro ao ler eventos do calendário na Home", e);
      }
    } else {
      // Fallback para eventos iniciais se não houver nada no localStorage
      setEvents([
        { id: 1, title: "Simulado Geral #4", timeSlot: "09:00 - 13:00", type: "prova" },
        { id: 2, title: "Mentoria Coletiva", timeSlot: "15:00 - 16:30", type: "mentoria" },
      ]);
    }
  }, []);

  // --- MOCK DATA ---
  const MOCK_WALL_POSTS = [
    { id: 1, user: "Kev", text: "Galera, amanhã tem live de revisão de Geometria Analítica às 19h! 📐", time: "Há 10 min", type: "admin" },
    { id: 2, user: "Marcos S.", text: "Consegui bater minha meta de questões hoje! 🚀 #FocoENEM", time: "Há 2h", type: "student" },
    { id: 3, user: "Ana Clara", text: "Alguém tem resumo de Ciclo de Krebs pra trocar?", time: "Há 5h", type: "student" },
  ];

  const MOCK_EVENTS = [
    { id: 1, title: "Simulado Geral #4", time: "09:00 - 13:00", type: "prova" },
    { id: 2, title: "Mentoria Coletiva", time: "15:00 - 16:30", type: "mentoria" },
    { id: 3, title: "Revisão: Revolução Industrial", time: "18:00 - 19:30", type: "aula" },
  ];

  const daysToExam = 214; // Mock dias para o ENEM

  if (!isLoaded) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-20">
      
      {/* Header Boas-vindas */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            Olá, Estudante! <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-slate-500 dark:text-[#A1A1AA] mt-1 font-medium text-lg">Bem-vindo de volta à sua central de evolução.</p>
        </div>
        <div className="bg-white dark:bg-[#1C1C1E] px-6 py-3 rounded-2xl border border-slate-100 dark:border-[#2C2C2E] shadow-sm flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-500" />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">
            {format(TODAY, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </span>
        </div>
      </header>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Esquerdo: Mural e Eventos (Col-span 2) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Mural do Aluno (Resenha) */}
          <section className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm overflow-hidden flex flex-col h-[500px]">
             <div className="px-8 py-6 border-b border-slate-50 dark:border-[#2C2C2E] flex justify-between items-center bg-slate-50/50 dark:bg-[#1C1C1E]">
                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-indigo-500" /> Mural da Comunidade
                </h2>
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#1C1C1E] bg-slate-200 dark:bg-slate-700"></div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white dark:border-[#1C1C1E] bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">+12</div>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8 space-y-6 hidden-scrollbar">
                {MOCK_WALL_POSTS.map(post => (
                  <div key={post.id} className={`flex gap-4 ${post.type === 'admin' ? 'animate-pulse' : ''}`}>
                    <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-lg font-bold shadow-sm ${post.type === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-[#2C2C2E] text-slate-400'}`}>
                      {post.user[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className={`text-sm font-black ${post.type === 'admin' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-white'}`}>
                          {post.user} {post.type === 'admin' && "👑"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{post.time}</span>
                      </div>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${post.type === 'admin' ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-900 dark:text-indigo-100 font-medium' : 'bg-slate-50 dark:bg-[#2C2C2E] text-slate-600 dark:text-slate-300'}`}>
                        {post.text}
                      </div>
                    </div>
                  </div>
                ))}
             </div>
             
             <div className="px-8 py-4 border-t border-slate-50 dark:border-[#2C2C2E] flex gap-4 bg-slate-50/30 dark:bg-[#1C1C1E]">
                <input 
                  type="text" 
                  placeholder="Compartilhe algo com a turma..." 
                  className="flex-1 bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium"
                />
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md active:scale-95">Postar</button>
             </div>
          </section>

          {/* Eventos do Dia */}
          <section className="space-y-4">
             <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 px-2">
                <Clock className="w-6 h-6 text-indigo-500" /> No Radar (Hoje)
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-800/20 p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center col-span-full">
                    <p className="text-sm font-bold text-slate-400">Nenhum evento para hoje no calendário.</p>
                  </div>
                ) : (
                  events.map(event => (
                    <div key={event.id} className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-slate-100 dark:border-[#2C2C2E] shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden active:scale-95">
                      <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500/20 group-hover:bg-indigo-500/40"></div>
                      <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest block mb-2">
                        {event.timeSlot || "Horário não definido"}
                      </span>
                      <h3 className="font-bold text-slate-800 dark:text-white mb-2 leading-tight truncate">{event.title}</h3>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter capitalize">
                          {event.isRefacao ? "Revisão Automática" : "Evento"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </section>

        </div>

        {/* Lado Direito: Widgets (Col-span 1) */}
        <div className="space-y-8">
          
          {/* Widget: Dias para a Prova */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
            <Calendar className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Contagem Regressiva</span>
              <h3 className="text-sm font-bold mt-1 mb-6">ENEM 2024</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black tabular-nums">{daysToExam}</span>
                <span className="text-xl font-bold opacity-80">dias</span>
              </div>
              <p className="text-xs mt-4 font-medium opacity-70">"Constância é o segredo da aprovação."</p>
              
              <div className="mt-8 w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-white w-[65%] h-full rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Widget: Online Agora */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 border border-slate-100 dark:border-[#2C2C2E] shadow-sm relative overflow-hidden">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Users className="w-6 h-6 text-teal-500" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-500 border-2 border-white dark:border-[#1C1C1E] rounded-full animate-ping"></div>
                  </div>
                  <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs">Estudando Agora</h3>
                </div>
                <span className="text-2xl font-black text-teal-500">1.248</span>
             </div>
             
             <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-[#A1A1AA] font-medium leading-relaxed">
                  Você não está sozinho! Há centenas de alunos focados neste exato momento.
                </p>
                <div className="grid grid-cols-5 gap-2">
                   {[1,2,3,4,5].map(i => (
                     <div key={i} className="aspect-square rounded-xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-100 dark:border-[#3A3A3C] transition-transform hover:scale-110 cursor-pointer"></div>
                   ))}
                </div>
             </div>
          </div>

          {/* Widget: Ranking Semanal (Destaque) */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 border border-slate-100 dark:border-[#2C2C2E] shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-6 h-6 text-amber-500" />
                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs">Destaque da Liga</h3>
             </div>
             <div className="flex items-center gap-4 bg-slate-50 dark:bg-amber-500/5 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20">🥇</div>
                <div>
                   <h4 className="font-black text-slate-800 dark:text-white text-sm">Lucas Rocha</h4>
                   <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wider">LIGA DIAMANTE (+12.4k pts)</p>
                </div>
             </div>
          </div>

        </div>

      </div>

    </div>
  );
}
