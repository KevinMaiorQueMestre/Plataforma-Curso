import { CalendarDays, MoreHorizontal } from "lucide-react";

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const mockEvents = [
  { day: 0, title: "Lógica: Progressão", time: "09:00 - 11:00", type: "teal" },
  { day: 1, title: "Simulado Geral", time: "14:00 - 18:00", type: "orange" },
  { day: 2, title: "Revisão Física", time: "10:00 - 12:00", type: "teal" },
  { day: 4, title: "Redação Nível A", time: "15:00 - 17:00", type: "teal" },
  { day: 6, title: "Análise de Erros", time: "19:00 - 20:00", type: "orange" },
];

export default function CalendarWidget() {
  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col h-full w-full overflow-hidden">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-2.5 rounded-2xl">
            <CalendarDays className="text-slate-600 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Semana de Imersão</h2>
            <p className="text-sm text-slate-500 mt-1">12 a 18 de Outubro</p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-700 bg-slate-50 p-2 rounded-xl transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 grid grid-cols-7 gap-2 md:gap-4 w-full">
        {weekDays.map((day, index) => {
          const dayEvents = mockEvents.filter((e) => e.day === index);
          
          return (
            <div key={day} className="flex flex-col flex-1 min-w-[100px] h-[350px]">
              <div className="text-center font-medium text-slate-500 mb-3 pb-3 border-b border-slate-100">
                {day}
              </div>
              <div className="flex-1 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-2 flex flex-col gap-2 overflow-y-auto hidden-scrollbar relative hover:bg-slate-50 transition-colors">
                
                {dayEvents.length === 0 ? (
                  <div className="m-auto text-xs text-slate-300 font-medium tracking-wide">Livre</div>
                ) : (
                  dayEvents.map((evt, i) => (
                    <div
                      key={i}
                      className={`w-full p-3 rounded-2xl shadow-sm cursor-pointer transition-transform hover:scale-[1.03] ${
                        evt.type === "teal"
                          ? "bg-teal-50 border border-teal-100"
                          : "bg-orange-50 border border-orange-100"
                      }`}
                    >
                      <h4
                        className={`text-xs font-bold leading-tight line-clamp-2 ${
                          evt.type === "teal" ? "text-teal-800" : "text-orange-700"
                        }`}
                      >
                        {evt.title}
                      </h4>
                      <span
                        className={`text-[10px] mt-1.5 font-medium block ${
                          evt.type === "teal" ? "text-teal-600" : "text-orange-500"
                        }`}
                      >
                        {evt.time}
                      </span>
                    </div>
                  ))
                )}
                
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
