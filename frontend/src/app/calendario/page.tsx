"use client";

import React, { useState, useEffect } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
} from "@dnd-kit/core";
import { 
  format, addDays, startOfWeek, subWeeks, addWeeks, 
  parseISO, startOfMonth, endOfMonth, eachDayOfInterval, 
  endOfWeek, subMonths, addMonths, isSameMonth, isSameDay
} from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Plus, ChevronLeft, ChevronRight, RefreshCw, Calendar as CalendarIcon } from "lucide-react";
import { calcRefacaoDates, MOCK_ESTUDOS } from "../../lib/kevquestLogic";

// --- Types ---
type AppEvent = {
  id: string;
  title: string;
  dateIso: string; // Formato YYYY-MM-DD
  timeSlot: string;
  colorClass: string;
  textClass: string;
  isRefacao?: boolean;
};

// --- Mock Data e KevQuest Engine ---
const HOURS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
const TODAY = new Date();

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
  { id: "e1", title: "A/B Testing", dateIso: format(addDays(TODAY, 1), "yyyy-MM-dd"), timeSlot: "09:00", colorClass: "bg-slate-100/50", textClass: "text-slate-500" },
  { id: "e2", title: "Mentoria", dateIso: format(TODAY, "yyyy-MM-dd"), timeSlot: "10:00", colorClass: "bg-orange-100 border border-orange-200 shadow-sm", textClass: "text-orange-700 font-bold" },
  
  // Eventos Injetados pelo KevQuest
  { 
    id: "kq1", title: "🔄 Revisão (+3d): Cinemática", 
    dateIso: refacoes.data_refacao_1, timeSlot: "11:00", 
    colorClass: "bg-teal-100 border border-teal-200 shadow-sm", textClass: "text-teal-800 font-black", isRefacao: true 
  },
  { 
    id: "kq2", title: "🔄 Revisão (+7d): Cinemática", 
    dateIso: refacoes.data_refacao_2, timeSlot: "11:00", 
    colorClass: "bg-teal-100 border border-teal-200 shadow-sm", textClass: "text-teal-800 font-black", isRefacao: true 
  },
  { 
    id: "kq3", title: "🔄 Revisão (+21d): Cinemática", 
    dateIso: refacoes.data_refacao_3, timeSlot: "11:00", 
    colorClass: "bg-teal-100 border border-teal-200 shadow-sm", textClass: "text-teal-800 font-black", isRefacao: true 
  },
];

// --- DnD Components ---
function DraggableEvent({ event }: { event: AppEvent }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
    data: event,
  });
  
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
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
      className={`border-r border-b border-slate-100 min-h-[70px] relative transition-colors cursor-pointer group hover:bg-slate-50/50 ${
        isOver ? "bg-indigo-50/50 outline outline-2 outline-indigo-300 z-10" : ""
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
  
  useEffect(() => {
    const storedQ = localStorage.getItem('kevquest_questoes');
    if (storedQ) {
      const baseEvents = [
        ...estudosAnteriores,
        { id: "e1", title: "A/B Testing", dateIso: format(addDays(TODAY, 1), "yyyy-MM-dd"), timeSlot: "09:00", colorClass: "bg-slate-100/50", textClass: "text-slate-500" },
        { id: "e2", title: "Mentoria", dateIso: format(TODAY, "yyyy-MM-dd"), timeSlot: "10:00", colorClass: "bg-orange-100 border border-orange-200 shadow-sm", textClass: "text-orange-700 font-bold" }
      ];
      
      const questoes = JSON.parse(storedQ);
      questoes.forEach((q: any) => {
        if (q.estagio_funil === "Refacao" && q.data_refacao_1) {
          baseEvents.push({ id: q.id + "_r1", title: `🔄 Revisão (+3d): ${q.conteudo}`, dateIso: q.data_refacao_1, timeSlot: "11:00", colorClass: "bg-teal-100 border border-teal-200 shadow-sm", textClass: "text-teal-800 font-black", isRefacao: true });
          if (q.data_refacao_2) {
            baseEvents.push({ id: q.id + "_r2", title: `🔄 Revisão (+7d): ${q.conteudo}`, dateIso: q.data_refacao_2, timeSlot: "11:00", colorClass: "bg-teal-100 border border-teal-200 shadow-sm", textClass: "text-teal-800 font-black", isRefacao: true });
          }
          if (q.data_refacao_3) {
            baseEvents.push({ id: q.id + "_r3", title: `🔄 Revisão (+21d): ${q.conteudo}`, dateIso: q.data_refacao_3, timeSlot: "11:00", colorClass: "bg-teal-100 border border-teal-200 shadow-sm", textClass: "text-teal-800 font-black", isRefacao: true });
          }
        }
      });
      setEvents(baseEvents);
    }
  }, []);
  // States Temporais Independentes
  // 1. Semana do Grid Principal (Timeline livre, começa na segunda = 1)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(TODAY, { weekStartsOn: 1 }));
  // 2. Mês do Mini Calendário
  const [currentMonthNode, setCurrentMonthNode] = useState(() => startOfMonth(TODAY));

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newEventSlot, setNewEventSlot] = useState<{ dateIso: string; timeSlot: string } | null>(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventColor, setNewEventColor] = useState("bg-indigo-100 border border-indigo-200 font-bold shadow-sm");

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
    const existing = events.find((e) => e.dateIso === dateIso && e.timeSlot === timeSlot);
    if (!existing) {
      setNewEventSlot({ dateIso, timeSlot });
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
      id: Math.random().toString(36).substring(7),
      title: newEventTitle,
      dateIso: newEventSlot.dateIso,
      timeSlot: newEventSlot.timeSlot,
      colorClass: newEventColor,
      textClass,
    };

    setEvents((prev) => [...prev, novaTarefa]);
    setModalOpen(false);
    setNewEventTitle("");
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-in fade-in duration-500 overflow-hidden">
      
      {/* Left Sidebar (Mini-Calendar & Controls) */}
      <aside className="w-full md:w-[340px] flex-shrink-0 flex flex-col gap-6">
        
        {/* Controle do Mini Calendário Mensal Real */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 select-none">
          <div className="flex justify-between items-center mb-6">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-50 rounded-full transition-colors group">
              <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-700" />
            </button>
            <h3 className="font-bold text-slate-800 tracking-tight capitalize text-sm">
              {format(currentMonthNode, "MMMM yyyy", { locale: ptBR })}
            </h3>
            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-50 rounded-full transition-colors group">
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-y-4 text-center text-[10px] text-slate-400 font-bold pb-2 border-b border-slate-50 uppercase">
            <div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div><div>D</div>
          </div>
          
          <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center text-xs font-medium mt-4">
            {calendarDays.map((dateObj, idx) => {
              const isCurrentMonth = isSameMonth(dateObj, currentMonthNode);
              const isToday = isSameDay(dateObj, TODAY);
              const dateStr = format(dateObj, "yyyy-MM-dd");
              // Conta se existem eventos neste dia
              const hasEvents = events.some(e => e.dateIso === dateStr);

              return (
                <div 
                  key={idx} 
                  onClick={() => setCurrentWeekStart(startOfWeek(dateObj, { weekStartsOn: 1 }))}
                  className={`
                    w-8 h-8 mx-auto flex flex-col items-center justify-center rounded-full cursor-pointer transition-all
                    ${!isCurrentMonth ? "text-slate-300" : "text-slate-600 hover:bg-slate-50"}
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
          <h3 className="text-slate-800 font-bold mb-4 ml-2">Inteligência Automática</h3>
          <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 border border-teal-100 rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
             <RefreshCw className="absolute -right-4 -bottom-4 w-32 h-32 text-teal-500/10" />
             <div className="relative z-10">
               <span className="text-[10px] uppercase font-bold text-teal-600 tracking-wider mb-2 block">Motor Ativo</span>
               <h4 className="font-black text-teal-900 text-lg leading-tight mb-2">Refação Sincronizada</h4>
               <p className="text-xs text-teal-700/80 mb-4">
                 Suas revisões D+3, D+7 e D+21 de Cinemática foram alocadas automaticamente na sua timeline! Navegue pelas próximas semanas para encontrá-las.
               </p>
             </div>
          </div>
        </div>
      </aside>

      {/* Right Area (Main Calendar Grid Timeline Infinita) */}
      <main className="flex-1 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        
        {/* Header de Navegação das SEMANAS */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-4">
              <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-100 p-1">
                 <button onClick={handlePrevWeek} className="p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                   <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-800" />
                 </button>
                 <span className="text-xs font-bold text-slate-700 px-3 capitalize">
                   {format(weekDays[0], "d LLL", { locale: ptBR })} - {format(weekDays[6], "d LLL", { locale: ptBR })}
                 </span>
                 <button onClick={handleNextWeek} className="p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                   <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-800" />
                 </button>
              </div>
           </div>
           
           <button 
             onClick={handleToday}
             className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 rounded-xl hover:bg-indigo-100 hover:text-indigo-800 transition-colors uppercase tracking-widest flex items-center gap-2"
           >
             <CalendarIcon className="w-4 h-4" />
             Ir para Hoje
           </button>
        </div>

        <DndContext onDragEnd={handleDragEnd}>
          {/* Calendar Header (7 Days) */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-100 pb-4 pt-4 px-2 sticky top-0 bg-white/95 backdrop-blur z-20">
            <div className="flex items-end justify-center pb-2 border-r border-slate-50">
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">GMT-03</span>
            </div>
            {weekDays.map((date, idx) => {
              const isToday = format(date, "yyyy-MM-dd") === format(TODAY, "yyyy-MM-dd");
              return (
                <div key={idx} className="text-center px-1 flex flex-col items-center justify-center gap-1">
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? "text-indigo-500" : "text-slate-400"}`}>
                    {format(date, "EEEE", { locale: ptBR }).substring(0, 3)}
                  </div>
                  <div className={`text-xl sm:text-2xl font-black w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full ${isToday ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-700"}`}>
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
                  <div className="text-[10px] font-bold text-slate-400 text-center pr-2 border-r border-slate-50 mt-3 select-none">
                    {hour}
                  </div>
                  
                  {/* Droppable Slots per Day (7 Days) */}
                  {weekDays.map((dateObj) => {
                    const dateIso = format(dateObj, "yyyy-MM-dd");
                    const slotEvents = events.filter((e) => e.dateIso === dateIso && e.timeSlot === hour);
                    
                    return (
                      <DroppableSlot
                        key={`${dateIso}|${hour}`}
                        id={`${dateIso}|${hour}`}
                        onClick={() => handleSlotClick(dateIso, hour)}
                      >
                        {slotEvents.map((evt) => (
                          <DraggableEvent key={evt.id} event={evt} />
                        ))}
                      </DroppableSlot>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </DndContext>
      </main>

      {/* Creation Modal (Popup) */}
      {modalOpen && newEventSlot && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl scale-100 zoom-in-95 animate-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Novo Compromisso</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Evento Pessoal</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Ex: Psicanálise, Revisão Opcional"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-medium text-slate-800"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Etiqueta Visual</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setNewEventColor("bg-slate-100 border border-slate-200 font-bold hover:bg-slate-200 shadow-sm")} className={`w-8 h-8 rounded-full bg-slate-200 border-2 ${newEventColor.includes("slate") ? "border-slate-500 scale-110 shadow-md" : "border-transparent"}`}></button>
                  <button type="button" onClick={() => setNewEventColor("bg-indigo-100 border border-indigo-200 font-bold hover:bg-indigo-200 shadow-sm")} className={`w-8 h-8 rounded-full bg-indigo-200 border-2 ${newEventColor.includes("indigo") ? "border-indigo-600 scale-110 shadow-md" : "border-transparent"}`}></button>
                  <button type="button" onClick={() => setNewEventColor("bg-teal-100 border border-teal-200 font-bold hover:bg-teal-200 shadow-sm")} className={`w-8 h-8 rounded-full bg-teal-200 border-2 ${newEventColor.includes("teal") ? "border-teal-600 scale-110 shadow-md" : "border-transparent"}`}></button>
                  <button type="button" onClick={() => setNewEventColor("bg-orange-100 border border-orange-200 font-bold hover:bg-orange-200 shadow-sm")} className={`w-8 h-8 rounded-full bg-orange-200 border-2 ${newEventColor.includes("orange") ? "border-orange-500 scale-110 shadow-md" : "border-transparent"}`}></button>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex justify-between items-center text-sm font-medium text-indigo-800 mt-2">
                <span className="capitalize">{format(parseISO(newEventSlot.dateIso), "EEEE, dd 'de' MMM", { locale: ptBR })}</span>
                <span className="bg-white text-indigo-600 px-3 py-1 font-bold rounded-lg shadow-sm border border-indigo-100">{newEventSlot.timeSlot}</span>
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
    </div>
  );
}
