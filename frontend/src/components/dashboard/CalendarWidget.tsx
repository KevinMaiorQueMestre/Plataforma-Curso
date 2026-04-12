"use client";

import { useState, useEffect } from "react";
import { CalendarDays, MoreHorizontal, Loader2 } from "lucide-react";
import { startOfWeek, endOfWeek, addDays, format, getDay } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { createClient } from "@/utils/supabase/client";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function CalendarWidget() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  const today = new Date();
  const startDay = startOfWeek(today, { weekStartsOn: 0 }); // Domingo
  const endDay = endOfWeek(today, { weekStartsOn: 0 });

  useEffect(() => {
    async function fetchCalendar() {
      setLoading(true);
      const startStr = format(startDay, "yyyy-MM-dd");
      const endStr = format(endDay, "yyyy-MM-dd");
      
      const { data } = await supabase
        .from("calendario_eventos")
        .select("*")
        .gte("date_iso", startStr)
        .lte("date_iso", endStr)
        .eq("is_published", true);

      if (data) setEvents(data);
      setLoading(false);
    }
    fetchCalendar();
  }, []);

  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col h-full w-full overflow-hidden">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-2.5 rounded-2xl">
            <CalendarDays className="text-slate-600 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-[#FFFFFF] tracking-tight">Semana de Imersão</h2>
            <p className="text-sm text-slate-500 dark:text-[#A1A1AA] mt-1 capitalize">
              {format(startDay, "dd MMM", { locale: ptBR })} a {format(endDay, "dd MMM", { locale: ptBR })}
            </p>
          </div>
        </div>
        <button className="text-slate-400 dark:text-[#71717A] hover:text-slate-700 bg-slate-50 dark:bg-[#2C2C2E] p-2 rounded-xl transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 grid grid-cols-7 gap-2 md:gap-4 w-full">
        {loading ? (
          <div className="col-span-7 flex items-center justify-center h-full text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          weekDays.map((day, index) => {
            const currentColumnDateStr = format(addDays(startDay, index), "yyyy-MM-dd");
            const dayEvents = events.filter((e) => e.date_iso === currentColumnDateStr);
            
            return (
              <div key={day} className="flex flex-col flex-1 min-w-[100px] h-[350px]">
                <div className="text-center font-medium text-slate-500 dark:text-[#A1A1AA] mb-3 pb-3 border-b border-slate-100 dark:border-[#2C2C2E]">
                  {day}
                </div>
                <div className="flex-1 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 dark:border-[#3A3A3C] p-2 flex flex-col gap-2 overflow-y-auto hidden-scrollbar relative hover:bg-slate-50 dark:hover:bg-[#2C2C2E] transition-colors">
                  
                  {dayEvents.length === 0 ? (
                    <div className="m-auto text-xs text-slate-300 font-medium tracking-wide">Livre</div>
                  ) : (
                    dayEvents.map((evt, i) => (
                      <div
                        key={i}
                        className={`w-full p-3 rounded-2xl shadow-sm cursor-pointer transition-transform hover:scale-[1.03] ${evt.color_class || 'bg-slate-100 text-slate-700'}`}
                        style={{ borderBottomWidth: '4px' }}
                      >
                        <h4 className="text-xs font-bold leading-tight line-clamp-2 text-inherit tracking-tight">
                          {evt.titulo}
                        </h4>
                        <span className="text-[10px] mt-1.5 font-medium block text-inherit opacity-80">
                          {evt.time_slot || 'O dia todo'}
                        </span>
                      </div>
                    ))
                  )}
                  
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
