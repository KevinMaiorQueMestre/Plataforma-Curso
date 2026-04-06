"use client";

import React, { useState, useEffect } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { 
  format, addDays, startOfWeek, subWeeks, addWeeks, 
  parseISO, startOfMonth, endOfMonth, eachDayOfInterval, 
  endOfWeek, subMonths, addMonths, isSameMonth, isSameDay
} from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Plus, ChevronLeft, ChevronRight, RefreshCw, Calendar as CalendarIcon, Trash2, Edit2 } from "lucide-react";
import { calcRefacaoDates, MOCK_ESTUDOS } from "@/lib/kevquestLogic";

// --- Types ---
type AppEvent = {
  id: string;
  title: string;
  dateIso: string; // Formato YYYY-MM-DD
  timeSlot: string;
  colorClass: string;
  textClass: string;
  isRefacao?: boolean;
  description?: string;
  isAdmin?: boolean;
};

// --- Mock Data e KevQuest Engine ---
const HOURS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
const TODAY = new Date();

const MOCK_ADMIN_EVENTS: AppEvent[] = [
  { id: "adm1", title: "👑 Aula Magna ao vivo", dateIso: format(addDays(TODAY, 2), "yyyy-MM-dd"), timeSlot: "14:30", colorClass: "bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-900/50 shadow-sm", textClass: "text-purple-800 dark:text-purple-400 font-black", isAdmin: true, description: "Link liberado pelo sistema na hora!" },
  { id: "adm2", title: "👑 Lançamento Módulo", dateIso: format(TODAY, "yyyy-MM-dd"), timeSlot: "09:30", colorClass: "bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-900/50 shadow-sm", textClass: "text-purple-800 dark:text-purple-400 font-black", isAdmin: true, description: "O novo módulo de redação subiu para a plataforma." },
];

// Cálculos baseados no KevQuest (Simulando que terminei "Cinemática" hoje e caiu na Refação)
const refacoes = calcRefacaoDates(TODAY);

// Transformando logs de Diário (`MOCK_ESTUDOS`) em visual events para o Calendário.
const estudosAnteriores: AppEvent[] = MOCK_ESTUDOS.map((est) => {
  const perc = est.questoesFeitas > 0 ? Math.round((est.acertos / est.questoesFeitas) * 100) : 0;
  return {
    id: est.id,
    title: `📚 Sessão: ${est.disciplinaNome} (${est.horasEstudo}h | ${perc}% Acc)`,
    dateIso: est.dataIso.split('T')[0], // Corta a ISO pra "YYYY-MM-DD"
    timeSlot: "14:00", // Slot ilustrativo padrão da tarde
    colorClass: "bg-slate-800 border-none shadow-md",
    textClass: "text-slate-100 font-bold"
  };
});

const INITIAL_EVENTS: AppEvent[] = [
  ...estudosAnteriores,
  
  // Eventos Fixos Manuais (Para a semana atual)
  { id: "e1", title: "A/B Testing", dateIso: format(addDays(TODAY, 1), "yyyy-MM-dd"), timeSlot: "09:00", colorClass: "bg-slate-100/50 dark:bg-[#2C2C2E]", textClass: "text-slate-500 dark:text-[#A1A1AA]" },
  { id: "e2", title: "Mentoria", dateIso: format(TODAY, "yyyy-MM-dd"), timeSlot: "10:00", colorClass: "bg-orange-100 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-900/50 shadow-sm", textClass: "text-orange-700 dark:text-orange-400 font-bold" },
  
  // Eventos Injetados pelo KevQuest
  { 
    id: "kq1", title: "🔄 Revisão (+3d): Cinemática", 
    dateIso: refacoes.data_refacao_1, timeSlot: "11:00", 
    colorClass: "bg-teal-100 dark:bg-teal-900/40 border border-teal-200 dark:border-teal-900/50 shadow-sm", textClass: "text-teal-800 dark:text-teal-300 font-black", isRefacao: true 
  },
  { 
    id: "kq2", title: "🔄 Revisão (+7d): Cinemática", 
    dateIso: refacoes.data_refacao_2, timeSlot: "11:00", 
    colorClass: "bg-teal-100 dark:bg-teal-900/40 border border-teal-200 dark:border-teal-900/50 shadow-sm", textClass: "text-teal-800 dark:text-teal-300 font-black", isRefacao: true 
  },
  { 
    id: "kq3", title: "🔄 Revisão (+21d): Cinemática", 
    dateIso: refacoes.data_refacao_3, timeSlot: "11:00", 
    colorClass: "bg-teal-100 dark:bg-teal-900/40 border border-teal-200 dark:border-teal-900/50 shadow-sm", textClass: "text-teal-800 dark:text-teal-300 font-black", isRefacao: true 
  },
];

// --- DnD Components ---
function DraggableEvent({ event, onClick }: { event: AppEvent; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
    data: event,
    disabled: event.isAdmin,
  });
  
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
      className={`absolute inset-[3px] rounded-xl p-2 cursor-grab active:cursor-grabbing transition-colors overflow-hidden ${event.colorClass}`}
    >
      <div className={`text-[10px] sm:text-[11px] leading-tight font-medium ${event.textClass}`}>
        {event.title}
      </div>
    </div>
  );
}

function DroppableSlot({ id, children, onClick }: { id: string; children: React.ReactNode; onClick?: () => void }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`border-r border-b border-slate-100 dark:border-[#2C2C2E] min-h-[70px] relative transition-colors cursor-pointer group hover:bg-slate-50 dark:hover:bg-[#2C2C2E] ${
        isOver ? "bg-indigo-50 dark:bg-indigo-900/30 outline outline-2 outline-indigo-300 z-10" : ""
      }`}
    >
      {!React.Children.count(children) && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Plus className="w-5 h-5 text-slate-300" />
        </div>
      )}
      {children}
    </div>
  );
}

// --- Main Calendar Page ---
export default function CalendarInteractivePage() {
  const [events, setEvents] = useState<AppEvent[]>(INITIAL_EVENTS);
  const [dueTasks, setDueTasks] = useState<any[]>([]);

  useEffect(() => {
    const savedEvents = localStorage.getItem('calendario_eventos');
    const storedQ = localStorage.getItem('kevquest_questoes');
    
    let baseEvents = [...INITIAL_EVENTS];

    if (savedEvents) {
      try {
        baseEvents = JSON.parse(savedEvents);
      } catch (e) {
        console.error("Erro ao carregar eventos salvos", e);
      }
    }

    if (storedQ) {
      try {
        const questoes = JSON.parse(storedQ);
        questoes.forEach((q: any) => {
          if (q.estagio_funil === "Refacao" && q.data_refacao_1) {
            baseEvents.push({ 
              id: q.id + "_r1", 
              title: `🔄 Revisão (+3d): ${q.conteudo}`, 
              dateIso: q.data_refacao_1, 
              timeSlot: "11:00", 
              colorClass: "bg-teal-100 dark:bg-teal-900/40 border border-teal-200 dark:border-teal-900/50 shadow-sm", 
              textClass: "text-teal-800 dark:text-teal-300 font-black", 
              isRefacao: true 
            });
            if (q.data_refacao_2) {
              baseEvents.push({ id: q.id + "_r2", title: `🔄 Revisão (+7d): ${q.conteudo}`, dateIso: q.data_refacao_2, timeSlot: "11:00", colorClass: "bg-teal-100 dark:bg-teal-900/40 border border-teal-200 dark:border-teal-900/50 shadow-sm", textClass: "text-teal-800 dark:text-teal-300 font-black", isRefacao: true });
            }
            if (q.data_refacao_3) {
              baseEvents.push({ id: q.id + "_r3", title: `🔄 Revisão (+21d): ${q.conteudo}`, dateIso: q.data_refacao_3, timeSlot: "11:00", colorClass: "bg-teal-100 dark:bg-teal-900/40 border border-teal-200 dark:border-teal-900/50 shadow-sm", textClass: "text-teal-800 dark:text-teal-300 font-black", isRefacao: true });
            }
          }
        });
      } catch (e) {}
    }
    setEvents(baseEvents);
  }, []);

  // Persistir eventos sempre que mudarem
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem('calendario_eventos', JSON.stringify(events));
    }
  }, [events]);
  // States Temporais Independentes
  const [activeViewTab, setActiveViewTab] = useState<'horarios' | 'tarefas'>('horarios');
  // 1. Semana do Grid Principal (Timeline livre, começa na segunda = 1)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(TODAY, { weekStartsOn: 1 }));
  // 2. Mês do Mini Calendário
  const [currentMonthNode, setCurrentMonthNode] = useState(() => startOfMonth(TODAY));

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newEventSlot, setNewEventSlot] = useState<{ dateIso: string; timeSlot: string } | null>(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventColor, setNewEventColor] = useState("bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-900/50 font-bold shadow-sm");
  
  const [viewEvent, setViewEvent] = useState<AppEvent | null>(null);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [showAdminEvents, setShowAdminEvents] = useState(false);

  const displayedEvents = showAdminEvents ? MOCK_ADMIN_EVENTS : events;

  // --- Processamento da Semana Principal (7 dias, Seg a Dom) ---
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i)); 

  // --- Processamento do Mini Calendário Mensal ---
  const firstDayOfMonth = startOfMonth(currentMonthNode);
  const lastDayOfMonth = endOfMonth(currentMonthNode);
  // Pega o início da semana (segunda-feira) que contém o primeiro dia do mês
  const startOfCalendarGrid = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
  // Pega o fim da semana (domingo) que contém o último dia do mês
  const endOfCalendarGrid = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startOfCalendarGrid, end: endOfCalendarGrid });

  // --- Funções de Navegação da Semana Principal ---
  const handleNextWeek = () => setCurrentWeekStart(prev => addWeeks(prev, 1));
  const handlePrevWeek = () => setCurrentWeekStart(prev => subWeeks(prev, 1));
  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(TODAY, { weekStartsOn: 1 }));
    setCurrentMonthNode(startOfMonth(TODAY));
  };

  // --- Funções de Navegação do Mini Mês ---
  const handleNextMonth = () => setCurrentMonthNode(prev => addMonths(prev, 1));
  const handlePrevMonth = () => setCurrentMonthNode(prev => subMonths(prev, 1));

  // Handle Drag & Drop
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;

    const eventId = active.id.toString();
    const slotId = over.id.toString(); // Format: "YYYY-MM-DD|HH:MM"
    const [dateIso, timeSlot] = slotId.split("|");

    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? { ...ev, dateIso, timeSlot }
          : ev
      )
    );
  };

  // Handle Slot Click (Open Creation Modal)
  const handleSlotClick = (dateIso: string, timeSlot: string) => {
    if (showAdminEvents) return; // View-only board when admin
    const existing = events.find((e) => e.dateIso === dateIso && e.timeSlot === timeSlot);
    if (!existing) {
      setNewEventSlot({ dateIso, timeSlot });
      setNewEventTitle("");
      setNewEventDesc("");
      setEditEventId(null);
      setModalOpen(true);
    }
  };

  // Submit New Event
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventSlot || !newEventTitle.trim()) return;

    let textClass = "text-indigo-800";
    if (newEventColor.includes("orange")) textClass = "text-orange-800";
    if (newEventColor.includes("teal")) textClass = "text-teal-800";
    if (newEventColor.includes("rose")) textClass = "text-rose-800";
    if (newEventColor.includes("slate")) textClass = "text-slate-600";

    const novaTarefa: AppEvent = {
      id: editEventId || Math.random().toString(36).substring(7),
      title: newEventTitle,
      dateIso: newEventSlot.dateIso,
      timeSlot: newEventSlot.timeSlot,
      colorClass: newEventColor,
      textClass,
      description: newEventDesc,
    };

    if (editEventId) {
      setEvents((prev) => prev.map((e) => (e.id === editEventId ? novaTarefa : e)));
    } else {
      setEvents((prev) => [...prev, novaTarefa]);
    }

    setEditEventId(null);
    setModalOpen(false);
    setNewEventTitle("");
    setNewEventDesc("");
  };

  const handleEditIntent = (event: AppEvent) => {
    setNewEventSlot({ dateIso: event.dateIso, timeSlot: event.timeSlot });
    setNewEventTitle(event.title);
    setNewEventDesc(event.description || "");
    setNewEventColor(event.colorClass);
    setEditEventId(event.id);
    setViewEvent(null);
    setModalOpen(true);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setViewEvent(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-20">
      
      <header className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-[#FFFFFF] tracking-tight flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" /> Calendário Pessoal
          </h1>
          <p className="text-slate-500 dark:text-[#A1A1AA] mt-1 font-medium">Gestão de Horários e Compromissos</p>
        </div>
        <div className="flex items-center gap-2">
          {!showAdminEvents && (
            <button 
              onClick={() => {
                setNewEventSlot({ dateIso: format(TODAY, "yyyy-MM-dd"), timeSlot: "09:00" });
                setNewEventTitle("");
                setNewEventDesc("");
                setModalOpen(true);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-slate-900/20 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" /> Lançar Evento
            </button>
          )}
        </div>
      </header>

      <div className="h-full flex flex-col md:flex-row gap-6 overflow-hidden">
      
      {/* Left Sidebar (Mini-Calendar & Controls) */}
      <aside className="w-full md:w-[340px] flex-shrink-0 flex flex-col gap-6">
        
        {/* Controle do Mini Calendário Mensal Real */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E] select-none">
          <div className="flex justify-between items-center mb-6">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-[#2C2C2E] rounded-full transition-colors group">
              <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-700" />
            </button>
            <h3 className="font-bold text-slate-800 dark:text-[#FFFFFF] tracking-tight capitalize text-sm">
              {format(currentMonthNode, "MMMM yyyy", { locale: ptBR })}
            </h3>
            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-[#2C2C2E] rounded-full transition-colors group">
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-y-4 text-center text-[10px] text-slate-400 font-bold pb-2 border-b border-slate-50 dark:border-[#2C2C2E] uppercase">
            <div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div><div>D</div>
          </div>
          
          <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center text-xs font-medium mt-4">
            {calendarDays.map((dateObj, idx) => {
              const isCurrentMonth = isSameMonth(dateObj, currentMonthNode);
              const isToday = isSameDay(dateObj, TODAY);
              const dateStr = format(dateObj, "yyyy-MM-dd");
              // Conta se existem eventos neste dia
              const hasEvents = displayedEvents.some(e => e.dateIso === dateStr);

              return (
                <div 
                  key={idx} 
                  onClick={() => setCurrentWeekStart(startOfWeek(dateObj, { weekStartsOn: 1 }))}
                  className={`
                    w-8 h-8 mx-auto flex flex-col items-center justify-center rounded-full cursor-pointer transition-all
                    ${!isCurrentMonth ? "text-slate-300" : "text-slate-600 hover:bg-slate-50 dark:hover:bg-[#2C2C2E]"}
                    ${isToday ? "bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200" : ""}
                  `}
                >
                  <span className="leading-none">{format(dateObj, "d")}</span>
                  {!isToday && hasEvents && isCurrentMonth && (
                    <div className="w-1 h-1 bg-orange-400 rounded-full mt-0.5"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Informações da Injeção KevQuest */}
        <div className="flex-1 overflow-y-auto pr-2 hidden-scrollbar">
          <h3 className="text-slate-800 dark:text-[#FFFFFF] font-bold mb-4 ml-2">Inteligência Automática</h3>
          <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-900/30 dark:to-teal-900/10 border border-teal-100 dark:border-teal-900/50 rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
             <RefreshCw className="absolute -right-4 -bottom-4 w-32 h-32 text-teal-500/10 dark:text-teal-500/5" />
             <div className="relative z-10">
               <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 tracking-wider mb-2 block">Motor Ativo</span>
               <h4 className="font-black text-teal-900 dark:text-teal-300 text-lg leading-tight mb-2">Refação Sincronizada</h4>
               <p className="text-xs text-teal-700 dark:text-teal-400/80 mb-4">
                 Suas revisões D+3, D+7 e D+21 de Cinemática foram alocadas automaticamente na sua timeline! Navegue pelas próximas semanas para encontrá-las.
               </p>
             </div>
           </div>


        </div>
      </aside>

      {/* Right Area (Main Calendar Grid Timeline Infinita) */}
      <main className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-[2rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm overflow-hidden flex flex-col">
        
        {/* Header de Navegação das SEMANAS */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-[#2C2C2E] bg-slate-50/50 dark:bg-[#1C1C1E]">
           <div className="flex items-center gap-4">
              <div className="flex items-center bg-white dark:bg-[#1C1C1E] rounded-xl shadow-sm border border-slate-100 dark:border-[#2C2C2E] p-1">
                 <button onClick={handlePrevWeek} className="p-2 hover:bg-slate-50 dark:hover:bg-[#2C2C2E] rounded-lg transition-colors group">
                   <ChevronLeft className="w-4 h-4 text-slate-500 dark:text-[#A1A1AA] group-hover:text-slate-800 dark:text-[#FFFFFF]" />
                 </button>
                 <span className="text-xs font-bold text-slate-700 dark:text-[#F4F4F5] px-3 capitalize">
                   {format(weekDays[0], "d LLL", { locale: ptBR })} - {format(weekDays[6], "d LLL", { locale: ptBR })}
                 </span>
                 <button onClick={handleNextWeek} className="p-2 hover:bg-slate-50 dark:hover:bg-[#2C2C2E] rounded-lg transition-colors group">
                   <ChevronRight className="w-4 h-4 text-slate-500 dark:text-[#A1A1AA] group-hover:text-slate-800 dark:text-[#FFFFFF]" />
                 </button>
              </div>

              {/* TABS ABA */}
              <div className="hidden md:flex items-center bg-slate-100 dark:bg-[#2C2C2E] rounded-xl p-1 gap-1">
                 <button onClick={() => setActiveViewTab('horarios')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeViewTab === 'horarios' ? 'bg-white shadow-sm text-indigo-600 dark:bg-[#3A3A3C] dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-[#A1A1AA]'}`}>Horários</button>
                 <button onClick={() => setActiveViewTab('tarefas')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeViewTab === 'tarefas' ? 'bg-white shadow-sm text-indigo-600 dark:bg-[#3A3A3C] dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-[#A1A1AA]'}`}>Aba Tarefas</button>
              </div>
           </div>
           
           <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
             <div className="flex items-center gap-2">
               <button 
                 onClick={handleToday}
                 className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-900/50 text-xs font-bold text-indigo-700 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors uppercase tracking-widest flex items-center gap-2"
               >
                 <CalendarIcon className="w-4 h-4" />
                 Hoje
               </button>
             </div>

             <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-[#3A3A3C]"></div>

             {/* Toggle Eventos do Curso */}
             <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#2C2C2E] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3A3C]">
               <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 w-[120px] text-right">
                 {showAdminEvents ? 'Avisos da Conta' : 'Meus Eventos'}
               </span>
               <button
                  type="button"
                  onClick={() => setShowAdminEvents(!showAdminEvents)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showAdminEvents ? 'bg-purple-600' : 'bg-indigo-500'}`}
               >
                 <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showAdminEvents ? 'translate-x-4' : 'translate-x-0'}`} />
               </button>
             </div>
           </div>
        </div>

        {activeViewTab === 'horarios' ? (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            {/* Calendar Header (7 Days) */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-100 dark:border-[#2C2C2E] pb-4 pt-4 px-2 sticky top-0 bg-white dark:bg-[#121212]/95 backdrop-blur z-20">
            <div className="flex items-end justify-center pb-2 border-r border-slate-50 dark:border-[#2C2C2E]">
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">GMT-03</span>
            </div>
            {weekDays.map((date, idx) => {
              const isToday = format(date, "yyyy-MM-dd") === format(TODAY, "yyyy-MM-dd");
              return (
                <div key={idx} className="text-center px-1 flex flex-col items-center justify-center gap-1">
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? "text-indigo-500" : "text-slate-400"}`}>
                    {format(date, "EEEE", { locale: ptBR }).substring(0, 3)}
                  </div>
                  <div className={`text-xl sm:text-2xl font-black w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full ${isToday ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-700 dark:text-[#F4F4F5]"}`}>
                    {format(date, "dd")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar Body (Hours Grid) */}
          <div className="flex-1 overflow-y-auto hidden-scrollbar pb-10">
            <div className="grid grid-cols-[60px_repeat(7,1fr)] pl-2">
              {HOURS.map((hour) => (
                <React.Fragment key={hour}>
                  {/* Hour Label */}
                  <div className="text-[10px] font-bold text-slate-400 text-center pr-2 border-r border-slate-50 dark:border-[#2C2C2E] mt-3 select-none">
                    {hour}
                  </div>
                  
                  {/* Droppable Slots per Day (7 Days) */}
                  {weekDays.map((dateObj) => {
                    const dateIso = format(dateObj, "yyyy-MM-dd");
                    const slotEvents = displayedEvents.filter((e) => e.dateIso === dateIso && e.timeSlot === hour);
                    
                    return (
                      <DroppableSlot
                        key={`${dateIso}|${hour}`}
                        id={`${dateIso}|${hour}`}
                        onClick={() => handleSlotClick(dateIso, hour)}
                      >
                        {slotEvents.map((evt) => (
                          <DraggableEvent key={evt.id} event={evt} onClick={() => setViewEvent(evt)} />
                        ))}
                      </DroppableSlot>
                    );
                  })}
                </React.Fragment>
              ))}
              </div>
            </div>
          </DndContext>
        ) : (
          <div className="flex-1 overflow-y-auto hidden-scrollbar bg-slate-50/30 dark:bg-[#121212] flex flex-col pb-10">
            <div className="grid grid-cols-[repeat(7,1fr)] border-b border-slate-100 dark:border-[#2C2C2E] pb-4 pt-4 px-2 sticky top-0 bg-white dark:bg-[#121212]/95 backdrop-blur z-20">
              {weekDays.map((date, idx) => {
                const isToday = format(date, "yyyy-MM-dd") === format(TODAY, "yyyy-MM-dd");
                return (
                  <div key={idx} className="text-center px-1 flex flex-col items-center justify-center gap-1">
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? "text-indigo-500" : "text-slate-400"}`}>
                      {format(date, "EEEE", { locale: ptBR }).substring(0, 3)}
                    </div>
                    <div className={`text-xl sm:text-2xl font-black w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full ${isToday ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-700 dark:text-[#F4F4F5]"}`}>
                      {format(date, "dd")}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-[repeat(7,1fr)] p-2 gap-2 mt-4 min-h-[400px]">
               {weekDays.map((dateObj, idx) => {
                  const dayTasks = dueTasks.filter((t: any) => t.limitDate === format(dateObj, "yyyy-MM-dd"));
                  return (
                    <div key={idx} className="bg-white dark:bg-[#1C1C1E] border border-slate-100 dark:border-[#2C2C2E] rounded-2xl p-2 flex flex-col gap-2 shadow-sm h-max">
                      {dayTasks.length === 0 ? (
                        <div className="flex items-center justify-center py-6">
                          <span className="text-[10px] font-bold text-slate-300 dark:text-[#3A3A3C] uppercase tracking-widest text-center">Livre</span>
                        </div>
                      ) : (
                        dayTasks.map((t: any) => (
                          <div key={t.id} className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 p-3 rounded-xl hover:shadow-md transition-shadow">
                            <p className="text-xs font-bold text-slate-800 dark:text-[#F4F4F5]">{t.texto}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )
               })}
            </div>
          </div>
        )}
      </main>

      {/* Creation Modal (Popup) */}
      {modalOpen && newEventSlot && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-8 max-w-sm w-full shadow-2xl scale-100 zoom-in-95 animate-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-[#FFFFFF]">{editEventId ? "Editar Compromisso" : "Novo Compromisso"}</h2>
              <button onClick={() => { setModalOpen(false); setEditEventId(null); }} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Evento Pessoal</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Ex: Psicanálise, Revisão Opcional"
                  className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-medium text-slate-800 dark:text-[#FFFFFF]"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Etiqueta Visual</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setNewEventColor("bg-slate-100 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] font-bold hover:bg-slate-200 dark:hover:bg-[#3A3A3C] shadow-sm")} className={`w-8 h-8 rounded-full bg-slate-200 border-2 ${newEventColor.includes("slate") ? "border-slate-500 scale-110 shadow-md" : "border-transparent"}`}></button>
                  <button type="button" onClick={() => setNewEventColor("bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-900/50 font-bold hover:bg-indigo-200 dark:hover:bg-indigo-900/60 shadow-sm")} className={`w-8 h-8 rounded-full bg-indigo-200 border-2 ${newEventColor.includes("indigo") ? "border-indigo-600 scale-110 shadow-md" : "border-transparent"}`}></button>
                  <button type="button" onClick={() => setNewEventColor("bg-teal-100 dark:bg-teal-900/40 border border-teal-200 dark:border-teal-900/50 font-bold hover:bg-teal-200 dark:hover:bg-teal-900/60 shadow-sm")} className={`w-8 h-8 rounded-full bg-teal-200 border-2 ${newEventColor.includes("teal") ? "border-teal-600 scale-110 shadow-md" : "border-transparent"}`}></button>
                  <button type="button" onClick={() => setNewEventColor("bg-orange-100 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-900/50 font-bold hover:bg-orange-200 dark:hover:bg-orange-900/60 shadow-sm")} className={`w-8 h-8 rounded-full bg-orange-200 border-2 ${newEventColor.includes("orange") ? "border-orange-500 scale-110 shadow-md" : "border-transparent"}`}></button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Data</label>
                  <input type="date" value={newEventSlot.dateIso} onChange={(e) => setNewEventSlot({...newEventSlot, dateIso: e.target.value})} className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-medium text-slate-800 dark:text-[#FFFFFF]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Hora</label>
                  <select value={newEventSlot.timeSlot} onChange={(e) => setNewEventSlot({...newEventSlot, timeSlot: e.target.value})} className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-medium text-slate-800 dark:text-[#FFFFFF]">
                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 mt-4">Descrição (Opcional)</label>
                <textarea rows={2} value={newEventDesc} onChange={(e) => setNewEventDesc(e.target.value)} placeholder="Detalhes do seu evento..." className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-medium text-slate-800 dark:text-[#FFFFFF] resize-none"></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-700 transition-all shadow-md mt-4 flex justify-center items-center gap-2"
              >
                Gravar no Calendário
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View Event Modal (Popup) */}
      {viewEvent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200" onClick={() => setViewEvent(null)}>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-8 max-w-sm w-full shadow-2xl scale-100 zoom-in-95 animate-in" onClick={(e) => e.stopPropagation()}>
            <div className={`p-4 rounded-xl mb-4 ${viewEvent.colorClass}`}>
               <h2 className={`text-lg font-black ${viewEvent.textClass}`}>{viewEvent.title}</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4 text-sm font-medium text-slate-600 dark:text-[#A1A1AA]">
                <div className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4"/> {format(parseISO(viewEvent.dateIso), "dd/MM/yyyy")}</div>
                <div className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4"/> {viewEvent.timeSlot}</div>
              </div>
              
              {viewEvent.description && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Descrição</h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{viewEvent.description}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              {!viewEvent.isRefacao && !viewEvent.isAdmin && (
                <>
                  <button
                    onClick={() => handleDeleteEvent(viewEvent.id)}
                    className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                    title="Excluir evento"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEditIntent(viewEvent)}
                    className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                    title="Editar evento"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </>
              )}
              <button
                 onClick={() => setViewEvent(null)}
                 className="flex-1 bg-slate-100 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-xl hover:bg-slate-200 dark:hover:bg-[#3A3A3C] transition-all"
              >
                 Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
