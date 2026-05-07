/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  PenTool, Plus, Trash2, ArrowRight,
  Lightbulb, CheckCircle2, Award, Activity,
  X, Star, Calendar, ChevronRight, ChevronDown, ChevronUp, Pencil,
  BarChart2, PieChart, BookOpen, CheckCircle, BarChart3,
  BookOpenCheck, RotateCcw, MessageSquare, ArrowUp, ArrowDown, ArrowUpDown
} from "lucide-react";
import { FilterColumn } from "@/components/ui/FilterColumn";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ComposedChart, Line, Legend, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { format as formatDate } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { createClient } from "@/utils/supabase/client";

// ─── Tipos ─────────────────────────────────────────────────────────────────────
type StudentKanbanStatus = "proposta" | "em correção" | "concluida" | "analisada" | "estudada" | "refeita";
type TipoProva = "enem" | "fuvest" | "unicamp" | "vunesp" | "outras";

interface RedacaoGlobal {
  id: string;
  studentId: string;
  titulo: string;
  temaId?: string;
  tema: string;
  dataCriacao: string;
  dataConclusao?: string;
  status: StudentKanbanStatus;
  imagens: string[];
  nota?: number | null;
  tipo_prova?: TipoProva;
  competencia_1?: number | null;
  competencia_2?: number | null;
  competencia_3?: number | null;
  competencia_4?: number | null;
  competencia_5?: number | null;
  comentarioAluno?: string | null;
  acaoMelhoria?: string | null;
}

// ─── Config Provas ─────────────────────────────────────────────────────────────
const TIPOS_PROVA: { value: TipoProva; label: string; cor: string }[] = [
  { value: "enem", label: "ENEM", cor: "text-indigo-500" },
  { value: "fuvest", label: "FUVEST", cor: "text-amber-500" },
  { value: "unicamp", label: "UNICAMP", cor: "text-emerald-500" },
  { value: "vunesp", label: "VUNESP", cor: "text-blue-500" },
  { value: "outras", label: "Outras", cor: "text-slate-500" },
];

const COMP_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#f43f5e", "#8b5cf6"];
const COMP_LABELS = ["C1 • Domínio da Língua Culta", "C2 • Compreensão da Proposta", "C3 • Seleção e Organização", "C4 • Mecanismos Linguísticos", "C5 • Proposta de Intervenção"];
const COMP_SHORT = ["C1", "C2", "C3", "C4", "C5"];
const COMP_KEYS: (keyof RedacaoGlobal)[] = ["competencia_1", "competencia_2", "competencia_3", "competencia_4", "competencia_5"];

const STEPS_NOTA = Array.from({ length: 11 }, (_, i) => i * 20); // 0,20,40...200

// ─── Colunas Kanban ────────────────────────────────────────────────────────────
const COLUMNS: {
  id: StudentKanbanStatus; label: string;
  icon: React.ComponentType<any>; accent: string; dot: string;
  card: string; badge: string; emptyText: string;
}[] = [
    { id: "proposta", label: "Proposta", icon: Lightbulb, accent: "text-slate-500 dark:text-[#A1A1AA]", dot: "bg-slate-400", card: "hover:border-slate-300 dark:hover:border-slate-700", badge: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#2C2C2E] dark:text-[#A1A1AA] dark:border-[#3A3A3C]", emptyText: "Nenhuma proposta ainda." },
    { id: "em correção", label: "em correção", icon: PenTool, accent: "text-indigo-500", dot: "bg-indigo-500", card: "hover:border-indigo-200 dark:hover:border-indigo-900/60", badge: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900/30", emptyText: "Nenhuma redação em andamento." },
    { id: "concluida", label: "Corrigida", icon: CheckCircle2, accent: "text-teal-500", dot: "bg-teal-500", card: "hover:border-teal-200 dark:hover:border-teal-900/60", badge: "bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-900/30", emptyText: "Arraste as finalizadas para cá." },
    { id: "analisada", label: "Analisada", icon: MessageSquare, accent: "text-fuchsia-500", dot: "bg-fuchsia-500", card: "hover:border-fuchsia-200 dark:hover:border-fuchsia-900/60", badge: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100 dark:bg-fuchsia-900/20 dark:text-fuchsia-400 dark:border-fuchsia-900/30", emptyText: "Analise sua redação." },
    { id: "estudada", label: "Estudada", icon: BookOpenCheck, accent: "text-blue-500", dot: "bg-blue-500", card: "hover:border-blue-200 dark:hover:border-blue-900/60", badge: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30", emptyText: "Nenhuma redação estudada." },
    { id: "refeita", label: "Refeita", icon: RotateCcw, accent: "text-rose-500", dot: "bg-rose-500", card: "hover:border-rose-200 dark:hover:border-rose-900/60", badge: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30", emptyText: "Nenhuma redação refeita." },
  ];

// ─── Custom Dropdown ───────────────────────────────────────────────────────────
function CustomDropdown({ value, onChange, options, placeholder, disabled = false, className = "", dropdownClasses = "" }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
  placeholder: string; disabled?: boolean; className?: string; dropdownClasses?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const sel = options.find(o => o.value === value);
  return (
    <div className="relative w-full" ref={ref}>
      <button type="button" disabled={disabled} onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left flex justify-between items-center outline-none transition-all ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-400'}`}>
        <span className="truncate">{sel ? sel.label : <span className="opacity-50 font-medium">{placeholder}</span>}</span>
        <ChevronDown className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : 'text-slate-400'}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.2 }}
            className={`absolute z-[200] w-full mt-2 bg-white dark:bg-[#1C1C1EE6] backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden ${dropdownClasses}`}>
            <div className="max-h-60 overflow-y-auto p-1.5 flex flex-col gap-1 custom-scrollbar">
              {[...options].sort((a, b) => {
                if (a.value === "") return -1;
                if (b.value === "") return 1;
                return a.label.localeCompare(b.label);
              }).map(opt => (
                <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${value === opt.value ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'}`}>
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

// ─── Tooltip Evolução ──────────────────────────────────────────────────────────
function TooltipEvolucao({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md min-w-[160px]">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>✍️ {p.name}: {p.value}</p>
      ))}
    </div>
  );
}

function TooltipCompetencias({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md min-w-[180px]">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.fill || p.stroke }}>
          {p.name}: <span className="font-black">{p.value}</span><span className="text-xs opacity-60">/200</span>
        </p>
      ))}
    </div>
  );
}

// ─── Modal de Detalhes da Proposta ─────────────────────────────────────────────
function DetalheModal({ redacao, col, onClose, onDelete, onLancarNota }: {
  redacao: RedacaoGlobal; col: typeof COLUMNS[number];
  onClose: () => void; onDelete: (id: string, e: any) => void; onLancarNota: (r: RedacaoGlobal) => void;
}) {
  const tipoInfo = TIPOS_PROVA.find(t => t.value === (redacao.tipo_prova || "enem"));
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
        className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative border border-slate-100 dark:border-[#2C2C2E] max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400">
          <X className="w-5 h-5" />
        </button>
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border mb-5 ${col.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />{col.label}
        </span>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{redacao.titulo}</h2>
        <div className="flex items-center gap-3 text-xs text-slate-400 font-bold uppercase mb-6">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(redacao.dataCriacao).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          {tipoInfo && <span className={`px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#2C2C2E] ${tipoInfo.cor} font-black`}>{tipoInfo.label}</span>}
        </div>
        {redacao.tema && (
          <div className="bg-slate-50 dark:bg-[#2C2C2E] rounded-2xl p-5 mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Proposta/Tema</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{redacao.tema}</p>
          </div>
        )}
        {(redacao.status === "concluida" || redacao.status === "analisada") && (
          <div className="mb-6">
            {redacao.nota != null ? (
              <div>
                <div className={`flex items-center gap-3 p-4 rounded-2xl border mb-3 ${col.badge}`}>
                  <Star className="w-5 h-5 fill-current" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Nota Total</p>
                    <p className="text-2xl font-black">{redacao.nota}<span className="text-sm font-bold opacity-60"> / 1000</span></p>
                  </div>
                </div>
                {/* Competências ENEM */}
                {(redacao.tipo_prova === "enem" || !redacao.tipo_prova) && redacao.competencia_1 != null && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Competências ENEM</p>
                    {COMP_KEYS.map((k, i) => (
                      <div key={k} className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: COMP_COLORS[i] }} />
                        <div className="flex-1">
                          <div className="flex justify-between text-xs font-black mb-1">
                            <span className="text-slate-600 dark:text-slate-400">{COMP_SHORT[i]}</span>
                            <span style={{ color: COMP_COLORS[i] }}>{(redacao[k] as number) || 0}/200</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${(((redacao[k] as number) || 0) / 200) * 100}%`, backgroundColor: COMP_COLORS[i] }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => { onLancarNota(redacao); onClose(); }}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed text-sm font-black uppercase tracking-widest transition-all hover:brightness-95 ${col.badge}`}>
                <Star className="w-4 h-4" /> Lançar Nota da Redação
              </button>
            )}
          </div>
        )}
        <button onClick={e => { onDelete(redacao.id, e); onClose(); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
          <Trash2 className="w-4 h-4" /> Excluir proposta
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Card do Kanban ────────────────────────────────────────────────────────────
function RedacaoCard({ redacao, col, onDelete, onLancarNota, onOpenDetalhe, onAdvance }: {
  redacao: RedacaoGlobal; col: typeof COLUMNS[number];
  onDelete: (id: string, e: any) => void; onLancarNota: (r: RedacaoGlobal) => void;
  onOpenDetalhe: (r: RedacaoGlobal) => void; onAdvance?: (r: RedacaoGlobal) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: redacao.id, data: { status: redacao.status } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const tipoInfo = TIPOS_PROVA.find(t => t.value === (redacao.tipo_prova || "enem"));
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      onPointerDown={e => { if (listeners?.onPointerDown) listeners.onPointerDown(e as any); dragStartPos.current = { x: e.clientX, y: e.clientY }; }}
      onPointerUp={e => {
        if (!dragStartPos.current) return;
        const dx = Math.abs(e.clientX - dragStartPos.current.x), dy = Math.abs(e.clientY - dragStartPos.current.y);
        if (dx < 5 && dy < 5 && !isDragging) onOpenDetalhe(redacao);
        dragStartPos.current = null;
      }}>
      <div className={`group cursor-pointer bg-white dark:bg-[#1C1C1E] p-5 rounded-[1.5rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm transition-all ${col.card} ${isDragging ? "shadow-xl ring-2 ring-indigo-400/40" : ""}`}>
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {redacao.imagens && redacao.imagens.length > 0 && (
              <div className="flex gap-2 py-2 overflow-x-auto no-scrollbar mb-4">
                {redacao.imagens.slice(0, 3).map((img, idx) => (
                  <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden border border-slate-100 dark:border-[#2C2C2E] flex-shrink-0">
                    <img src={img} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-snug">{redacao.titulo}</h3>
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onPointerDown={e => { e.stopPropagation(); onDelete(redacao.id, e); }}
                  className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {tipoInfo && <span className={`text-[9px] font-black uppercase tracking-widest ${tipoInfo.cor} bg-slate-50 dark:bg-[#2C2C2E] px-2 py-0.5 rounded-md inline-block mb-2`}>{tipoInfo.label}</span>}
            {redacao.tema && <p className="text-[11px] text-slate-400 dark:text-[#71717A] leading-relaxed line-clamp-2 mb-4">{redacao.tema}</p>}
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-300 dark:text-[#52525B] font-bold uppercase">
                <Calendar className="w-3 h-3" />
                {new Date(redacao.dataCriacao).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </div>
              <div className="flex items-center gap-2">
                {(col.id === "concluida" || col.id === "analisada") && (
                  <>
                    {redacao.nota != null ? (
                      <span className={`flex items-center gap-1 font-black text-xs px-2 py-0.5 rounded-lg ${col.badge}`}>
                        <Star className="w-3 h-3 fill-current" /> {redacao.nota}
                      </span>
                    ) : (
                      <button onPointerDown={e => { e.stopPropagation(); onLancarNota(redacao); }}
                        className={`opacity-0 group-hover:opacity-100 transition-all text-[10px] font-black uppercase px-2 py-1 rounded-lg ${col.badge} hover:brightness-95 border-dashed border-2`}>
                        Lançar Nota
                      </button>
                    )}
                  </>
                )}
                {col.id !== "analisada" && onAdvance ? (
                  <button onPointerDown={e => { e.stopPropagation(); onAdvance(redacao); }}
                    className="p-1.5 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-[#3A3A3C] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Coluna do Kanban ──────────────────────────────────────────────────────────
function KanbanColumn({ col, items, onDelete, onLancarNota, onOpenDetalhe, onAdvance }: {
  col: typeof COLUMNS[number]; items: RedacaoGlobal[];
  onDelete: (id: string, e: any) => void; onLancarNota: (r: RedacaoGlobal) => void;
  onOpenDetalhe: (r: RedacaoGlobal) => void; onAdvance: (r: RedacaoGlobal) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
          <h2 className={`text-xs font-black uppercase tracking-[0.15em] ${col.accent}`}>{col.label}</h2>
        </div>
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${col.badge}`}>{items.length}</span>
      </div>
      <div ref={setNodeRef} className={`flex-1 min-h-[60vh] rounded-[2.5rem] p-4 space-y-3 border-2 transition-all duration-200 ${isOver ? "border-indigo-400 dark:border-indigo-600 bg-indigo-50/60 dark:bg-indigo-900/10 scale-[1.01]" : "border-transparent bg-slate-50/80 dark:bg-[#1C1C1E]/60 border-slate-100 dark:border-[#2C2C2E]"}`}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.length === 0 && (
            <div className={`h-32 flex items-center justify-center rounded-[2rem] border-2 border-dashed transition-all ${isOver ? "border-indigo-300 dark:border-indigo-700" : "border-slate-200 dark:border-[#2C2C2E]"}`}>
              <p className="text-[11px] text-slate-400 dark:text-[#52525B] font-medium">{col.emptyText}</p>
            </div>
          )}
          {items.map(r => (
            <RedacaoCard key={r.id} redacao={r} col={col} onDelete={onDelete} onLancarNota={onLancarNota} onOpenDetalhe={onOpenDetalhe} onAdvance={onAdvance} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

// ─── Aba de Evolução ──────────────────────────────────────────────────────────
const AnaliseLacunas = ({ redacoes, onCompleteStudy, onEditGap }: { redacoes: RedacaoGlobal[], onCompleteStudy: (id: string) => void, onEditGap: (r: RedacaoGlobal) => void }) => {
  const analisadas = redacoes.filter(r => r.status === "analisada");
  if (analisadas.length === 0) return null;

  return (
    <div className="space-y-6 mb-10">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-fuchsia-500" /> Análise de Lacunas
        </h3>
        <span className="text-xs font-black text-slate-400 bg-slate-100 dark:bg-[#2C2C2E] px-3 py-1.5 rounded-full uppercase tracking-widest">{analisadas.length} pendentes</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {analisadas.map(r => (
          <div key={r.id} className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E] relative group hover:border-fuchsia-200 dark:hover:border-fuchsia-900/40 transition-all">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Comentário Tático</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed italic">
                  &ldquo;{r.comentarioAluno || "Sem comentário registrado..."}&rdquo;
                </p>
              </div>
              <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400 p-2.5 rounded-2xl">
                <Star className="w-5 h-5 fill-current" />
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50 dark:border-white/5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Proposta</p>
                <p className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[180px]">{r.titulo}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onEditGap(r)} className="p-2 text-slate-400 hover:text-fuchsia-500 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/10 rounded-xl transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => onCompleteStudy(r.id)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/10 active:scale-95 transition-all flex items-center gap-2">
                  Concluído <BookOpenCheck className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function EvolucaoRedacao({ redacoes, onDelete, onEdit, onUpdateStatus, onEditGap }: { redacoes: RedacaoGlobal[], onDelete: (id: string, e: any) => void, onEdit: (r: RedacaoGlobal) => void, onUpdateStatus: (id: string, s: StudentKanbanStatus) => void, onEditGap: (r: RedacaoGlobal) => void }) {
  const [tipoFiltro, setTipoFiltro] = useState<TipoProva>("enem");
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [filterProvaRed, setFilterProvaRed] = useState<string>('all');
  const [sortKeyRed, setSortKeyRed] = useState<string>('dataCriacao');
  const [sortDirRed, setSortDirRed] = useState<'asc' | 'desc'>('desc');
  const [visibleCountRed, setVisibleCountRed] = useState<number>(5);

  const toggleSortRed = (key: string) => {
    if (sortKeyRed === key) {
      setSortDirRed(sortDirRed === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKeyRed(key);
      setSortDirRed('asc');
    }
  };

  const todasConcluidas = redacoes.filter(r => (r.status === "concluida" || r.status === "analisada") && r.nota != null);
  const concluidas = todasConcluidas.filter(r => (r.tipo_prova || "enem") === tipoFiltro);
  const concluidasEnem = todasConcluidas.filter(r => (r.tipo_prova || "enem") === "enem");

  // Dados para gráfico de evolução (linha do tempo)
  const evolucaoData = [...concluidas].reverse().map(r => ({
    name: formatDate(new Date(r.dataCriacao), "dd/MM", { locale: ptBR }),
    titulo: r.titulo,
    nota: r.nota || 0,
  }));

  // Dados para gráfico de competências (barras agrupadas)
  const competenciasData = [...concluidasEnem].reverse().map(r => ({
    name: formatDate(new Date(r.dataCriacao), "dd/MM", { locale: ptBR }),
    titulo: r.titulo,
    C1: r.competencia_1 || 0,
    C2: r.competencia_2 || 0,
    C3: r.competencia_3 || 0,
    C4: r.competencia_4 || 0,
    C5: r.competencia_5 || 0,
  }));

  // Média de cada competência (radar)
  const mediaCompetencias = COMP_KEYS.map((k, i) => {
    const vals = concluidasEnem.filter(r => r[k] != null).map(r => r[k] as number);
    return {
      subject: COMP_SHORT[i],
      fullLabel: COMP_LABELS[i],
      media: vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0,
      fullMark: 200,
    };
  });

  // Cards de resumo
  const maiorNota = concluidas.length > 0 ? Math.max(...concluidas.map(r => r.nota || 0)) : null;
  const mediaNota = concluidas.length > 0 ? Math.round(concluidas.reduce((a, r) => a + (r.nota || 0), 0) / concluidas.length) : null;
  const totalConcluidas = concluidas.length;

  if (redacoes.filter(r => r.status === "concluida" || r.status === "analisada").length === 0) {
    return (
      <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-16 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col items-center justify-center text-center">
        <PieChart className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
        <p className="text-sm font-black uppercase tracking-widest text-slate-400">Nenhuma redação finalizada ainda.</p>
        <p className="text-xs text-slate-400 mt-2">Mova suas redações para &ldquo;Corrigida&rdquo; ou &ldquo;Analisada&rdquo; e lance as notas para ver a evolução.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 0. Análise de Lacunas (Novo) */}
      <AnaliseLacunas redacoes={redacoes} onCompleteStudy={id => onUpdateStatus(id, "estudada")} onEditGap={onEditGap} />

      {/* 1. Histórico de Redações (Novo Design de Tabela) */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-indigo-500" /> Histórico de Redações
          </h3>
          <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-[#2C2C2E] px-4 py-2 rounded-full uppercase tracking-[0.2em]">{todasConcluidas.length} REGISTROS</span>
        </div>

        {(() => {
          const uniqueProvasRed = Array.from(
            new Set(todasConcluidas.map(r => r.tipo_prova || "enem"))
          ).filter(Boolean);

          let tableRedacoes = todasConcluidas.filter(r => {
            if (filterProvaRed === 'all') return true;
            return (r.tipo_prova || "enem") === filterProvaRed;
          });

          tableRedacoes.sort((a, b) => {
            let valA: any = a[sortKeyRed as keyof typeof a];
            let valB: any = b[sortKeyRed as keyof typeof b];

            if (sortKeyRed === 'dataCriacao') {
              valA = new Date(a.dataCriacao).getTime();
              valB = new Date(b.dataCriacao).getTime();
            }

            if (valA < valB) return sortDirRed === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirRed === 'asc' ? 1 : -1;
            return 0;
          });

          return (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-slate-50 dark:border-slate-800/50">
                    <th className="pb-4 px-4 align-middle">
                      <button
                        onClick={() => toggleSortRed('dataCriacao')}
                        className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${sortKeyRed === 'dataCriacao'
                            ? 'text-indigo-500'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                          }`}
                      >
                        Data
                        {sortKeyRed === 'dataCriacao' ? (
                          sortDirRed === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                        )}
                      </button>
                    </th>
                    <th className="pb-4 px-4 align-middle">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título / Proposta</span>
                    </th>
                    <th className="pb-4 px-4 align-middle">
                      <FilterColumn
                        label="Prova"
                        value={filterProvaRed}
                        onChange={setFilterProvaRed}
                        options={[{ value: 'all', label: 'Todas' }, ...uniqueProvasRed.map(p => ({ value: p, label: p.toUpperCase() }))]}
                        dropdownWidth="min-w-[150px]"
                      />
                    </th>
                    <th className="pb-4 px-4 align-middle">
                      <button
                        onClick={() => toggleSortRed('nota')}
                        className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${sortKeyRed === 'nota'
                            ? 'text-indigo-500'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                          }`}
                      >
                        Nota
                        {sortKeyRed === 'nota' ? (
                          sortDirRed === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                        )}
                      </button>
                    </th>
                    <th className="pb-4 px-4 text-right align-middle">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableRedacoes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                        Nenhuma redação concluída corresponde aos filtros.
                      </td>
                    </tr>
                  ) : (
                    tableRedacoes.slice(0, visibleCountRed).map(r => {
                      const colInfo = COLUMNS.find(c => c.id === r.status)!;
                      const dateStr = formatDate(new Date(r.dataCriacao), "dd/MM/yyyy - EEEE", { locale: ptBR }).replace(/ - (\w)/, (m) => m.toUpperCase());
                      return (
                        <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                          <td className="py-5 px-4 align-top">
                            <div className="font-bold text-slate-800 dark:text-white text-sm mb-1">{dateStr}</div>
                            <div>
                               <span className={`text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${colInfo.badge}`}>
                                {colInfo.label}
                              </span>
                            </div>
                          </td>
                          <td className="py-5 px-4 max-w-[280px]">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></div>
                              <div className="font-bold text-slate-800 dark:text-white text-sm">{r.titulo}</div>
                            </div>
                            {r.tema && (
                              <div className="text-xs text-indigo-500 dark:text-indigo-400 mt-2 font-medium italic break-words whitespace-normal leading-relaxed ml-4">
                                &quot;<span dangerouslySetInnerHTML={{ __html: r.tema.replace(/<p[^>]*>/g, '').replace(/<\/p>/g, '') }} />&quot;
                              </div>
                            )}
                          </td>
                          <td className="py-5 px-4 align-top">
                            <span className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest">
                              {r.tipo_prova || "enem"}
                            </span>
                          </td>
                          <td className="py-5 px-4 align-top">
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="text-base font-black text-indigo-600 dark:text-indigo-400">{r.nota}/1000</div>
                              {(r.tipo_prova || "enem") === "enem" && r.competencia_1 != null && (
                                <div className="flex flex-wrap gap-1.5">
                                  {COMP_KEYS.map((k, i) => (
                                    <span key={k} className="px-2 py-0.5 rounded-[4px] text-[10px] font-black" style={{ backgroundColor: `${COMP_COLORS[i]}15`, color: COMP_COLORS[i] }}>
                                      {COMP_SHORT[i]}: {(r[k] as number) || 0}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-5 px-4 text-right align-top">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all sm:opacity-0 sm:group-hover:opacity-100">
                              <button onClick={() => onEdit(r)}
                                className="p-1.5 flex items-center justify-center rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={(e) => onDelete(r.id, e)}
                                className="p-1.5 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
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
              {tableRedacoes.length > visibleCountRed && (
                <div className="mt-6 flex justify-center pb-2">
                  <button
                    onClick={() => setVisibleCountRed(prev => prev + 5)}
                    className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-[#2C2C2E] text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-[#3C3C3E] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm flex items-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ver Mais ({tableRedacoes.length - visibleCountRed} restantes)
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* 2. Botão de Alternância para Evolução Analítica */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className={`group flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-300 shadow-xl ${showAnalytics ? "bg-slate-800 text-white shadow-slate-900/20" : "bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700"}`}
        >
          {showAnalytics ? <ChevronUp className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
          {showAnalytics ? "Ocultar Evolução" : "Evolução de Redação"}
          {!showAnalytics && <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />}
        </button>
      </div>

      {/* 3. Seção de Evolução Analítica (Condicional) */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 20, height: 0 }}
            transition={{ duration: 0.5, ease: "circOut" }}
            className="space-y-6 overflow-hidden"
          >
            {/* Seletor de prova */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-4 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex items-center gap-3 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">TIPO DE PROVA:</span>
              <div className="flex gap-2 flex-1 min-w-0">
                {TIPOS_PROVA.map(t => {
                  const cnt = redacoes.filter(r => (r.status === "concluida" || r.status === "analisada") && r.nota != null && (r.tipo_prova || "enem") === t.value).length;
                  return (
                    <button key={t.value} onClick={() => setTipoFiltro(t.value)}
                      className={`px-6 py-2.5 rounded-[1.2rem] text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${tipoFiltro === t.value ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-slate-50 dark:bg-[#2C2C2E] text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}>
                      {t.label} {cnt > 0 && <span className="ml-1 opacity-70">({cnt})</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cards de resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "TOTAL CONCLUÍDAS", value: totalConcluidas, accent: "text-slate-700 dark:text-white", suffix: "" },
                { label: "NOTA MÉDIA", value: mediaNota ?? "—", accent: "text-indigo-600 dark:text-indigo-400", suffix: mediaNota ? "/1000" : "" },
                { label: "MELHOR NOTA", value: maiorNota ?? "—", accent: "text-teal-600 dark:text-teal-400", suffix: maiorNota ? "/1000" : "" },
              ].map(stat => (
                <div key={stat.label} className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 border border-slate-100 dark:border-[#2C2C2E] shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
                  <p className={`text-3xl font-black ${stat.accent}`}>
                    {stat.value}<span className="text-sm font-bold opacity-50">{stat.suffix}</span>
                  </p>
                </div>
              ))}
            </div>

            {concluidas.length === 0 ? (
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-12 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col items-center justify-center text-center">
                <BarChart2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">Nenhuma redação para {TIPOS_PROVA.find(t => t.value === tipoFiltro)?.label} com nota.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Gráfico: Evolução da nota total */}
                <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none" />
                  <div className="relative z-10 mb-8">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                      <Activity className="w-6 h-6 text-indigo-500" /> Evolução da Nota
                    </h3>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                      {TIPOS_PROVA.find(t => t.value === tipoFiltro)?.label} • {concluidas.length} redaç{concluidas.length === 1 ? "ão" : "ões"}
                    </p>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={evolucaoData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                        <defs>
                          <linearGradient id="gNotaArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.2} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: "bold" }} dy={10} />
                        <YAxis domain={[0, 1000]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: "bold" }} dx={-10} />
                        <Tooltip content={<TooltipEvolucao />} />
                        <Bar dataKey="nota" fill="#6366f1" fillOpacity={0.05} radius={[10, 10, 0, 0]} barSize={50} name="Fundo" />
                        <Line type="monotone" dataKey="nota" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: "#6366f1", strokeWidth: 3, stroke: "#fff" }} activeDot={{ r: 8, strokeWidth: 0 }} name="Nota Total" />
                        {/* Simulação de área preenchida para o ComposedChart */}
                        <Bar dataKey="nota" fill="url(#gNotaArea)" barSize={50} radius={[10, 10, 0, 0]} opacity={0.5} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfico: 5 Competências ENEM */}
                {tipoFiltro === "enem" && competenciasData.length > 0 && (
                  <>
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
                      <div className="absolute top-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full blur-[120px] -ml-32 -mt-32 pointer-events-none" />
                      <div className="relative z-10 mb-8">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                          <BookOpen className="w-6 h-6 text-rose-500" /> Evolução por Competência
                        </h3>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">ENEM • Escala 0–200</p>
                      </div>
                      <div className="flex flex-wrap gap-4 mb-8">
                        {COMP_SHORT.map((c, i) => (
                          <div key={c} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COMP_COLORS[i] }} />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{c}</span>
                          </div>
                        ))}
                      </div>
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={competenciasData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.2} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: "bold" }} dy={10} />
                            <YAxis domain={[0, 200]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: "bold" }} dx={-10} ticks={STEPS_NOTA} />
                            <Tooltip content={<TooltipCompetencias />} />
                            {COMP_SHORT.map((c, i) => (
                              <Bar key={c} dataKey={c} name={COMP_LABELS[i]} fill={COMP_COLORS[i]} radius={[6, 6, 0, 0]} barSize={18} opacity={0.9} />
                            ))}
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {concluidasEnem.some(r => r.competencia_1 != null) && (
                      <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
                        <div className="mb-10">
                          <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <Activity className="w-6 h-6 text-amber-500" /> Perfil das Competências
                          </h3>
                          <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Média acumulada por competência</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mediaCompetencias}>
                                <PolarGrid stroke="#e2e8f0" strokeOpacity={0.2} />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 14, fontWeight: "black", fill: "#64748b" }} />
                                <PolarRadiusAxis domain={[0, 200]} axisLine={false} tick={false} />
                                <Radar name="Média" dataKey="media" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={3} />
                                <Tooltip formatter={(v: any) => [`${v}/200`, "Média"]} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-6">
                            {mediaCompetencias.map((c, i) => (
                              <div key={c.subject}>
                                <div className="flex justify-between items-end mb-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: COMP_COLORS[i] }}>{c.subject}</span>
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{COMP_LABELS[i].split("•")[1]?.trim()}</span>
                                    </div>
                                  </div>
                                  <span className="text-sm font-black text-slate-700 dark:text-white">{c.media}<span className="text-[10px] opacity-40 ml-0.5">/200</span></span>
                                </div>
                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(c.media / 200) * 100}%` }}
                                    transition={{ duration: 1, delay: i * 0.1, ease: "circOut" }}
                                    className="h-full rounded-full shadow-lg"
                                    style={{
                                      backgroundColor: COMP_COLORS[i],
                                      boxShadow: `0 0 12px ${COMP_COLORS[i]}40`
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Página Principal ──────────────────────────────────────────────────────────
export default function RedacaoPage() {
  const [redacoes, setRedacoes] = useState<RedacaoGlobal[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = createClient();

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const [selectedRedacao, setSelectedRedacao] = useState<RedacaoGlobal | null>(null);

  // Tab
  const [activeTab, setActiveTab] = useState<"bancada" | "evolucao">(() => {
    if (typeof window !== "undefined") {
      const s = localStorage.getItem("redacao_activeTab");
      if (s === "evolucao") return "evolucao";
    }
    return "bancada";
  });

  // Modal Nova Proposta
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ temaId: "", titulo: "", tema: "", imagens: [] as string[], tipo_prova: "enem" as TipoProva });

  // Modal Lançar Nota
  const [notaForm, setNotaForm] = useState<{
    id: string; nota: string; tipo_prova: TipoProva;
    dataConclusao: string;
    c1: string; c2: string; c3: string; c4: string; c5: string;
  } | null>(null);
  const [gapForm, setGapForm] = useState<{ id: string; comentario: string; acao: string; } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  const mapStatusFront = (dbStatus: string): StudentKanbanStatus => {
    if (["PROPOSTA", "A_FAZER", "planejamento"].includes(dbStatus)) return "proposta";
    if (["EM CORREÇÃO", "EM_AVALIACAO", "andamento"].includes(dbStatus)) return "em correção";
    if (["CONCLUIDA", "concluida", "DEVOLVIDA"].includes(dbStatus)) return "concluida";
    if (["ANALISADA", "analisada"].includes(dbStatus)) return "analisada";
    if (["ESTUDADA", "estudada"].includes(dbStatus)) return "estudada";
    if (["REFEITA", "refeita"].includes(dbStatus)) return "refeita";
    return "proposta";
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const me = user?.id;
      if (me) {
        const { data: dtR } = await supabase
          .from("redacoes_aluno")
          .select(`id,status,tema_id,pdf_url,nota,created_at,data_conclusao,tipo_prova,competencia_1,competencia_2,competencia_3,competencia_4,competencia_5,comentario_aluno,acao_melhoria,temas_redacao(titulo,descricao_html)`)
          .eq("aluno_id", me)
          .order("created_at", { ascending: false });
        if (dtR) {
          setRedacoes(dtR.map(r => ({
            id: r.id, studentId: me,
            titulo: (r.temas_redacao as any)?.titulo || "Minha Redação",
            temaId: r.tema_id,
            tema: (r.temas_redacao as any)?.descricao_html || "",
            dataCriacao: r.created_at,
            dataConclusao: r.data_conclusao,
            status: mapStatusFront(r.status),
            imagens: r.pdf_url ? [r.pdf_url] : [],
            nota: r.nota,
            tipo_prova: (r.tipo_prova || "enem") as TipoProva,
            competencia_1: r.competencia_1,
            competencia_2: r.competencia_2,
            competencia_3: r.competencia_3,
            competencia_4: r.competencia_4,
            competencia_5: r.competencia_5,
            comentarioAluno: r.comentario_aluno,
            acaoMelhoria: r.acao_melhoria,
          })));
        }
      }
      setIsLoaded(true);
    };
    fetchData();
    const ch = supabase.channel("redacoes_c_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "redacoes_aluno" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNew = () => { setForm({ temaId: "", titulo: "", tema: "", imagens: [], tipo_prova: "enem" }); setIsModalOpen(true); };

  const saveRedacao = async () => {
    if (!form.titulo.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    let finalTemaId = form.temaId;
    if (!finalTemaId) {
      const { data: newTema } = await supabase.from("temas_redacao").insert([{ admin_id: user?.id, titulo: form.titulo, descricao_html: form.tema, is_published: false }]).select().single();
      if (newTema) finalTemaId = newTema.id;
    }
    const { data: rAl } = await supabase.from("redacoes_aluno").insert([{ aluno_id: user?.id, tema_id: finalTemaId, pdf_url: form.imagens[0] || null, status: "PROPOSTA", tipo_prova: form.tipo_prova }]).select().single();
    if (rAl) setRedacoes([{ id: rAl.id, studentId: user?.id || "", titulo: form.titulo, tema: form.tema, dataCriacao: rAl.created_at, status: "proposta", imagens: form.imagens, tipo_prova: form.tipo_prova }, ...redacoes]);
    setForm({ temaId: "", titulo: "", tema: "", imagens: [], tipo_prova: "enem" });
    setIsModalOpen(false);
  };

  const handleDragStart = (e: DragStartEvent) => setActiveDragId(String(e.active.id));
  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const targetStatus = over.id as StudentKanbanStatus;
    const cur = redacoes.find(r => r.id === activeId);
    if (cur && cur.status !== targetStatus) {
      const now = new Date().toISOString();
      const updates: any = { status: targetStatus.toUpperCase() };
      if (targetStatus === "em correção" && !cur.dataConclusao) {
        updates.data_conclusao = now;
        setRedacoes(prev => prev.map(r => r.id === activeId ? { ...r, status: targetStatus, dataConclusao: now } : r));
      } else {
        setRedacoes(prev => prev.map(r => r.id === activeId ? { ...r, status: targetStatus } : r));
      }
      await supabase.from("redacoes_aluno").update(updates).eq("id", activeId);
      // Abre automaticamente o modal de nota ao mover para "Corrigida" sem nota
      if (targetStatus === "concluida" && cur.nota == null) {
        setNotaForm({
          id: cur.id,
          nota: "",
          tipo_prova: (cur.tipo_prova || "enem") as TipoProva,
          dataConclusao: cur.dataConclusao ? cur.dataConclusao.split("T")[0] : "",
          c1: "", c2: "", c3: "", c4: "", c5: ""
        });
      }
      // Abre modal de análise de lacunas ao mover para "Analisada"
      if (targetStatus === "analisada") {
        setGapForm({ id: cur.id, comentario: cur.comentarioAluno || "", acao: cur.acaoMelhoria || "" });
      }
    }
  };

  const handleAdvance = async (r: RedacaoGlobal) => {
    const next: StudentKanbanStatus =
      r.status === "proposta" ? "em correção" :
        r.status === "em correção" ? "concluida" :
          r.status === "concluida" ? "analisada" :
            r.status === "analisada" ? "estudada" :
              r.status === "estudada" ? "refeita" :
                "refeita";
    if (r.status === "refeita") return;
    const now = new Date().toISOString();
    const updates: any = { status: next.toUpperCase() };
    if (next === "em correção" && !r.dataConclusao) {
      updates.data_conclusao = now;
      setRedacoes(prev => prev.map(x => x.id === r.id ? { ...x, status: next, dataConclusao: now } : x));
    } else {
      setRedacoes(prev => prev.map(x => x.id === r.id ? { ...x, status: next } : x));
    }
    await supabase.from("redacoes_aluno").update(updates).eq("id", r.id);
    // Abre automaticamente o modal de nota ao avançar para "Corrigida" sem nota
    if (next === "concluida" && r.nota == null) {
      setNotaForm({
        id: r.id,
        nota: "",
        tipo_prova: (r.tipo_prova || "enem") as TipoProva,
        dataConclusao: r.dataConclusao ? r.dataConclusao.split("T")[0] : "",
        c1: "", c2: "", c3: "", c4: "", c5: ""
      });
    }
    // Abre modal de análise de lacunas ao avançar para "Analisada"
    if (next === "analisada") {
      setGapForm({ id: r.id, comentario: r.comentarioAluno || "", acao: r.acaoMelhoria || "" });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm(prev => ({ ...prev, imagens: [...prev.imagens, reader.result as string] }));
      reader.readAsDataURL(file);
    }
  };

  const deleteRedacao = async (id: string, e: any) => {
    if (e) e.stopPropagation();
    await supabase.from("redacoes_aluno").delete().eq("id", id);
    setRedacoes(redacoes.filter(r => r.id !== id));
    if (selectedRedacao?.id === id) setSelectedRedacao(null);
  };

  // Lançar nota — calcula total ENEM automaticamente
  const confirmarNota = async () => {
    if (!notaForm) return;
    const isEnem = notaForm.tipo_prova === "enem";
    let totalNota: number;
    const c1 = parseInt(notaForm.c1) || 0, c2 = parseInt(notaForm.c2) || 0, c3 = parseInt(notaForm.c3) || 0;
    const c4 = parseInt(notaForm.c4) || 0, c5 = parseInt(notaForm.c5) || 0;
    if (isEnem) {
      totalNota = c1 + c2 + c3 + c4 + c5;
    } else {
      totalNota = parseInt(notaForm.nota) || 0;
    }
    const payload: any = {
      nota: totalNota,
      tipo_prova: notaForm.tipo_prova,
      data_conclusao: notaForm.dataConclusao ? new Date(notaForm.dataConclusao).toISOString() : null,
    };
    if (isEnem) {
      payload.competencia_1 = c1;
      payload.competencia_2 = c2;
      payload.competencia_3 = c3;
      payload.competencia_4 = c4;
      payload.competencia_5 = c5;
    }
    await supabase.from("redacoes_aluno").update(payload).eq("id", notaForm.id);
    setRedacoes(prev => prev.map(r => r.id === notaForm.id ? {
      ...r,
      nota: totalNota,
      tipo_prova: notaForm.tipo_prova,
      dataConclusao: notaForm.dataConclusao ? new Date(notaForm.dataConclusao).toISOString() : r.dataConclusao,
      competencia_1: isEnem ? c1 : null,
      competencia_2: isEnem ? c2 : null,
      competencia_3: isEnem ? c3 : null,
      competencia_4: isEnem ? c4 : null,
      competencia_5: isEnem ? c5 : null
    } : r));
    setNotaForm(null);
  };

  const saveGapAnalysis = async () => {
    if (!gapForm) return;
    await supabase.from("redacoes_aluno").update({
      comentario_aluno: gapForm.comentario,
      acao_melhoria: gapForm.acao,
      status: "ANALISADA"
    }).eq("id", gapForm.id);
    setRedacoes(prev => prev.map(r => r.id === gapForm.id ? { ...r, status: "analisada", comentarioAluno: gapForm.comentario, acaoMelhoria: gapForm.acao } : r));
    setGapForm(null);
  };

  if (!isLoaded) return null;

  const selectedCol = selectedRedacao ? COLUMNS.find(c => c.id === selectedRedacao.status)! : COLUMNS[0];

  return (
    <div className="max-w-[1600px] mx-auto pb-20 animate-in fade-in duration-500 space-y-8 px-4 md:px-0">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
        <div className="relative">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#1B2B5E]/10 rounded-full blur-[100px] pointer-events-none" />
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4 relative z-10">
            <div className="bg-[#1B2B5E] p-3 rounded-[1.2rem] shadow-lg shadow-[#1B2B5E]/20"><PenTool className="w-8 h-8 text-white" /></div>
            Minha Bancada
          </h1>
          <div className="flex items-center gap-3 mt-3 relative z-10">
            <div className="h-1 w-12 bg-[#F97316] rounded-full" />
            <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em]">Asas para o Enem! Acompanhe suas notas.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={openNew}
            className="flex items-center gap-2 bg-[#F97316] hover:bg-orange-600 active:scale-95 transition-all text-white font-black px-7 py-4 rounded-2xl shadow-xl shadow-orange-500/20 text-sm uppercase tracking-widest">
            <Plus className="w-5 h-5" /> <span className="hidden sm:inline">Nova Proposta</span>
          </button>
        </div>
      </header>

      {/* Toggle Bancada / Evolução */}
      <div className="bg-white dark:bg-[#1C1C1E] p-2 rounded-[2rem] flex items-center w-full border border-slate-100 dark:border-[#2C2C2E] shadow-sm relative z-10">
        <button onClick={() => { setActiveTab("bancada"); localStorage.setItem("redacao_activeTab", "bancada"); }}
          className={`flex-1 py-4 text-sm font-black rounded-[1.8rem] transition-all duration-200 uppercase tracking-[0.18em] ${activeTab === "bancada" ? "bg-[#1B2B5E] text-white shadow-lg shadow-[#1B2B5E]/20" : "text-slate-400 dark:text-[#A1A1AA] hover:text-slate-600 dark:hover:text-white"}`}>
          Minha Bancada
        </button>
        <button onClick={() => { setActiveTab("evolucao"); localStorage.setItem("redacao_activeTab", "evolucao"); }}
          className={`flex-1 py-4 text-sm font-black rounded-[1.8rem] transition-all duration-200 uppercase tracking-[0.18em] ${activeTab === "evolucao" ? "bg-[#1B2B5E] text-white shadow-lg shadow-[#1B2B5E]/20" : "text-slate-400 dark:text-[#A1A1AA] hover:text-slate-600 dark:hover:text-white"}`}>
          Evolução
        </button>
      </div>

      {/* Conteúdo por Tab */}
      {activeTab === "evolucao" && (
        <div className="animate-in fade-in duration-500">
          <EvolucaoRedacao
            redacoes={redacoes}
            onDelete={deleteRedacao}
            onEdit={r => setNotaForm({
              id: r.id,
              nota: String(r.nota || ""),
              tipo_prova: (r.tipo_prova || "enem") as TipoProva,
              dataConclusao: r.dataConclusao ? r.dataConclusao.split("T")[0] : "",
              c1: String(r.competencia_1 || ""),
              c2: String(r.competencia_2 || ""),
              c3: String(r.competencia_3 || ""),
              c4: String(r.competencia_4 || ""),
              c5: String(r.competencia_5 || "")
            })}
            onUpdateStatus={async (id, s) => {
              await supabase.from("redacoes_aluno").update({ status: s.toUpperCase() }).eq("id", id);
              setRedacoes(prev => prev.map(r => r.id === id ? { ...r, status: s } : r));
            }}
            onEditGap={(r) => setGapForm({ id: r.id, comentario: r.comentarioAluno || "", acao: r.acaoMelhoria || "" })}
          />
        </div>
      )}

      {activeTab === "bancada" && (
        <div className="animate-in fade-in duration-500 space-y-8">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="w-full">
              {/* Kanban */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {COLUMNS.map(col => (
                  <KanbanColumn key={col.id} col={col} items={redacoes.filter(r => r.status === col.id)}
                    onDelete={deleteRedacao}
                    onLancarNota={r => setNotaForm({
                      id: r.id,
                      nota: String(r.nota || ""),
                      tipo_prova: (r.tipo_prova || "enem") as TipoProva,
                      dataConclusao: r.dataConclusao ? r.dataConclusao.split("T")[0] : "",
                      c1: String(r.competencia_1 || ""),
                      c2: String(r.competencia_2 || ""),
                      c3: String(r.competencia_3 || ""),
                      c4: String(r.competencia_4 || ""),
                      c5: String(r.competencia_5 || "")
                    })}
                    onOpenDetalhe={setSelectedRedacao}
                    onAdvance={handleAdvance}
                  />
                ))}
              </div>
            </div>

            <DragOverlay>
              {activeDragId ? (
                <div className="opacity-80 rotate-2 scale-105 pointer-events-none">
                  <RedacaoCard
                    redacao={redacoes.find(r => r.id === activeDragId)!}
                    col={COLUMNS.find(c => c.id === redacoes.find(r => r.id === activeDragId)?.status)!}
                    onDelete={() => { }} onLancarNota={() => { }} onOpenDetalhe={() => { }}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* Modal Detalhes da Proposta */}
      <AnimatePresence>
        {selectedRedacao && (
          <DetalheModal redacao={selectedRedacao} col={selectedCol} onClose={() => setSelectedRedacao(null)}
            onDelete={deleteRedacao} onLancarNota={r => setNotaForm({ id: r.id, nota: String(r.nota || ""), tipo_prova: (r.tipo_prova || "enem") as TipoProva, dataConclusao: r.dataConclusao ? r.dataConclusao.split("T")[0] : "", c1: String(r.competencia_1 || ""), c2: String(r.competencia_2 || ""), c3: String(r.competencia_3 || ""), c4: String(r.competencia_4 || ""), c5: String(r.competencia_5 || "") })}
          />
        )}
      </AnimatePresence>

      {/* Modal Lançar Nota (REFATORADO) */}
      <AnimatePresence>
        {notaForm && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setNotaForm(null)}>
            <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative border border-slate-100 dark:border-[#2C2C2E] max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setNotaForm(null)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400">
                <X className="w-5 h-5" />
              </button>
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6"><Award className="w-7 h-7" /></div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Lançar Nota</h2>
              <p className="text-sm text-slate-500 mb-6">Selecione a prova e registre o desempenho.</p>

              {/* Seletor de Tipo de Prova */}
              <div className="mb-6">
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-3">Tipo de Prova</label>
                <div className="grid grid-cols-5 gap-2">
                  {TIPOS_PROVA.map(t => (
                    <button key={t.value} type="button" onClick={() => setNotaForm({ ...notaForm, tipo_prova: t.value })}
                      className={`py-3 px-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-center ${notaForm.tipo_prova === t.value ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-slate-50 dark:bg-[#2C2C2E] text-slate-500 hover:text-slate-700"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campos ENEM */}
              {notaForm.tipo_prova === "enem" && (
                <div className="space-y-4 mb-6">
                  <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Nota Automática</p>
                    <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                      {([notaForm.c1, notaForm.c2, notaForm.c3, notaForm.c4, notaForm.c5].reduce((a, v) => a + (parseInt(v) || 0), 0))}
                      <span className="text-base font-bold opacity-50">/1000</span>
                    </p>
                    <p className="text-[10px] text-indigo-400 mt-1">Soma automática das 5 competências</p>
                  </div>
                  {["c1", "c2", "c3", "c4", "c5"].map((k, i) => (
                    <div key={k} className="space-y-2">
                      <label className="text-[10px] font-black tracking-widest uppercase flex items-center gap-2" style={{ color: COMP_COLORS[i] }}>
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COMP_COLORS[i] }}></span>
                        {COMP_LABELS[i]}
                      </label>
                      <div className="flex gap-2 items-center">
                        <input type="range" min="0" max="200" step="20"
                          value={parseInt((notaForm as any)[k]) || 0}
                          onChange={e => setNotaForm({ ...notaForm, [k]: e.target.value })}
                          className="flex-1 accent-indigo-600" />
                        <span className="w-16 text-center text-lg font-black text-slate-800 dark:text-white bg-slate-50 dark:bg-[#2C2C2E] rounded-xl py-2" style={{ color: COMP_COLORS[i] }}>
                          {parseInt((notaForm as any)[k]) || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Campo para outras provas */}
              {notaForm.tipo_prova !== "enem" && (
                <div className="space-y-2 mb-6">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Nota Alcançada</label>
                  <input type="number" min="0" max="10000"
                    value={notaForm.nota}
                    onChange={e => setNotaForm({ ...notaForm, nota: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-transparent rounded-2xl px-5 py-4 text-2xl font-black text-center focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="Ex: 840" />
                </div>
              )}

              {/* Data de Conclusão */}
              <div className="mb-8 space-y-2">
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block">Data de Conclusão</label>
                <input type="date" value={notaForm.dataConclusao} onChange={e => setNotaForm({ ...notaForm, dataConclusao: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-transparent rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all" />
              </div>

              <button onClick={confirmarNota}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all uppercase tracking-widest text-sm">
                Confirmar e Salvar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {gapForm && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setGapForm(null)}>
            <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative border border-slate-100 dark:border-[#2C2C2E] max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setGapForm(null)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400">
                <X className="w-5 h-5" />
              </button>
              <div className="w-14 h-14 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400 rounded-2xl flex items-center justify-center mb-6"><MessageSquare className="w-7 h-7" /></div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Comentário e Ação</h2>
              <p className="text-sm text-slate-500 mb-8">Reflita sobre sua correção e planeje sua evolução.</p>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">O que aprendi com esta correção?</label>
                  <textarea rows={3} value={gapForm.comentario} onChange={e => setGapForm({ ...gapForm, comentario: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-transparent rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-fuchsia-100 outline-none resize-none transition-all"
                    placeholder="Ex: Preciso melhorar a coesão entre o 2º e 3º parágrafo..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">O que farei de diferente na próxima?</label>
                  <textarea rows={3} value={gapForm.acao} onChange={e => setGapForm({ ...gapForm, acao: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-transparent rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-fuchsia-100 outline-none resize-none transition-all"
                    placeholder="Ex: Dedicarei 5 minutos extras apenas para revisão de conectivos..." />
                </div>
                <button onClick={saveGapAnalysis}
                  className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 active:scale-95 text-white font-black py-4 rounded-2xl shadow-xl shadow-fuchsia-600/20 transition-all uppercase tracking-widest text-sm flex justify-center items-center gap-2 mt-4">
                  Salvar Análise <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Nova Proposta (Livre) */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative border border-slate-100 dark:border-[#2C2C2E] max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400">
                <X className="w-5 h-5" />
              </button>
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6"><Lightbulb className="w-7 h-7" /></div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Nova Proposta</h2>
              <p className="text-sm text-slate-500 mb-8">Crie uma proposta de tema livre.</p>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Título</label>
                  <input type="text" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-transparent rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="Título da proposta" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-3">Tipo de Prova</label>
                  <div className="grid grid-cols-5 gap-2">
                    {TIPOS_PROVA.map(t => (
                      <button key={t.value} type="button" onClick={() => setForm({ ...form, tipo_prova: t.value })}
                        className={`py-3 px-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-center ${form.tipo_prova === t.value ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-slate-50 dark:bg-[#2C2C2E] text-slate-500 hover:text-slate-700"}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Proposta/Tema</label>
                  <textarea rows={4} value={form.tema} onChange={e => setForm({ ...form, tema: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-transparent rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-indigo-100 outline-none resize-none transition-all"
                    placeholder="Descreva brevemente o tema proposto…" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Imagens Manuscritas</label>
                  <div className="grid grid-cols-4 gap-4">
                    <label className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-[#3A3A3C] rounded-2xl cursor-pointer hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-[#2C2C2E] transition-all group">
                      <Plus className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 mb-1" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                    {form.imagens.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group">
                        <img src={img} alt={`Anexo ${i}`} className="w-full h-full object-cover" />
                        <button onClick={() => setForm(f => ({ ...f, imagens: f.imagens.filter((_, idx) => idx !== i) }))}
                          className="absolute inset-0 m-auto w-8 h-8 flex items-center justify-center bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={saveRedacao}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all uppercase tracking-widest text-sm flex justify-center items-center gap-2 mt-4">
                  Criar Proposta <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
