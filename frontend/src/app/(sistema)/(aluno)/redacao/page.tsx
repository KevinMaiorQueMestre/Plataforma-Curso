"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  PenTool, Plus, Trash2, ArrowRight,
  Lightbulb, FileText, ClipboardCheck, Award, Activity,
  X, Star, Calendar, GripVertical, Edit2, Clock, CheckCircle2, FileImage, User,
  BookOpen, ChevronRight
} from "lucide-react";
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
  CartesianGrid, ComposedChart, Line, Legend, Bar 
} from "recharts";
import { format as formatDate } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { createClient } from "@/utils/supabase/client";

type StudentKanbanStatus = "proposta" | "fazendo" | "concluida";

interface RedacaoGlobal {
  id: string;
  studentId: string;
  titulo: string;
  temaId?: string;
  tema: string;
  dataCriacao: string;
  status: StudentKanbanStatus;
  imagens: string[];
  nota?: number | null;
}

interface TemaProposta {
  id: string;
  titulo: string;
  tema: string;
  dataCriacao: string;
}

const COLUMNS: {
  id: StudentKanbanStatus;
  label: string;
  icon: React.ComponentType<any>;
  accent: string;
  dot: string;
  card: string;
  badge: string;
  emptyText: string;
}[] = [
  {
    id: "proposta",
    label: "Proposta",
    icon: Lightbulb,
    accent: "text-slate-500 dark:text-[#A1A1AA]",
    dot: "bg-slate-400",
    card: "hover:border-slate-300 dark:hover:border-slate-700",
    badge: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#2C2C2E] dark:text-[#A1A1AA] dark:border-[#3A3A3C]",
    emptyText: "Nenhuma proposta ainda.",
  },
  {
    id: "fazendo",
    label: "Fazendo",
    icon: PenTool,
    accent: "text-indigo-500",
    dot: "bg-indigo-500",
    card: "hover:border-indigo-200 dark:hover:border-indigo-900/60",
    badge: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900/30",
    emptyText: "Nenhuma redação em andamento.",
  },
  {
    id: "concluida",
    label: "Concluída",
    icon: CheckCircle2,
    accent: "text-teal-500",
    dot: "bg-teal-500",
    card: "hover:border-teal-200 dark:hover:border-teal-900/60",
    badge: "bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-900/30",
    emptyText: "Arraste as finalizadas para cá.",
  },
];

// ─── Modal de detalhes da proposta ────────────────────────────────────────────
function DetalheModal({
  redacao,
  col,
  onClose,
  onDelete,
  onLancarNota,
}: {
  redacao: RedacaoGlobal;
  col: typeof COLUMNS[number];
  onClose: () => void;
  onDelete: (id: string, e: any) => void;
  onLancarNota: (r: RedacaoGlobal) => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative border border-slate-100 dark:border-[#2C2C2E]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 dark:hover:bg-[#3A3A3C] rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>

        {/* Badge de status */}
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border mb-5 ${col.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
          {col.label}
        </span>

        {/* Título */}
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 leading-tight">
          {redacao.titulo}
        </h2>

        {/* Data */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase mb-6">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(redacao.dataCriacao).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "long", year: "numeric"
          })}
        </div>

        {/* Tema */}
        {redacao.tema && (
          <div className="bg-slate-50 dark:bg-[#2C2C2E] rounded-2xl p-5 mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tema Base</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {redacao.tema}
            </p>
          </div>
        )}

        {/* Imagens */}
        {redacao.imagens && redacao.imagens.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Anexos</p>
            <div className="grid grid-cols-3 gap-3">
              {redacao.imagens.map((img, idx) => (
                <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-slate-100 dark:border-[#3A3A3C]">
                  <img src={img} alt={`Anexo ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nota (se concluída) */}
        {redacao.status === "concluida" && (
          <div className="mb-6">
            {redacao.nota != null ? (
              <div className={`flex items-center gap-3 p-4 rounded-2xl border ${col.badge}`}>
                <Star className="w-5 h-5 fill-current" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Nota Enem</p>
                  <p className="text-2xl font-black">{redacao.nota} <span className="text-sm font-bold opacity-60">/ 1000</span></p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { onLancarNota(redacao); onClose(); }}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed text-sm font-black uppercase tracking-widest transition-all hover:brightness-95 ${col.badge}`}
              >
                <Star className="w-4 h-4" /> Lançar Nota da Redação
              </button>
            )}
          </div>
        )}

        {/* Ações */}
        <button
          onClick={(e) => { onDelete(redacao.id, e); onClose(); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Excluir proposta
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Card Kanban ───────────────────────────────────────────────────────────────
function RedacaoCard({
  redacao,
  col,
  onDelete,
  onLancarNota,
  onOpenDetalhe,
  onAdvance,
}: {
  redacao: RedacaoGlobal;
  col: typeof COLUMNS[number];
  onDelete: (id: string, e: any) => void;
  onLancarNota: (redacao: RedacaoGlobal) => void;
  onOpenDetalhe: (redacao: RedacaoGlobal) => void;
  onAdvance?: (redacao: RedacaoGlobal) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: redacao.id, data: { status: redacao.status } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      onPointerDown={(e) => { 
        if (listeners?.onPointerDown) listeners.onPointerDown(e as any);
        dragStartPos.current = { x: e.clientX, y: e.clientY }; 
      }}
      onPointerUp={(e) => {
        if (!dragStartPos.current) return;
        const dx = Math.abs(e.clientX - dragStartPos.current.x);
        const dy = Math.abs(e.clientY - dragStartPos.current.y);
        if (dx < 5 && dy < 5 && !isDragging) {
          onOpenDetalhe(redacao);
        }
        dragStartPos.current = null;
      }}
    >
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
                {redacao.imagens.length > 3 && (
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-[#2C2C2E] flex items-center justify-center text-[10px] font-black text-slate-500">
                    +{redacao.imagens.length - 3}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-snug">
                {redacao.titulo}
              </h3>
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onPointerDown={(e) => { e.stopPropagation(); onDelete(redacao.id, e); }}
                  className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {redacao.tema && (
              <p className="text-[11px] text-slate-400 dark:text-[#71717A] leading-relaxed line-clamp-2 mb-4">
                {redacao.tema}
              </p>
            )}

            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-300 dark:text-[#52525B] font-bold uppercase">
                <Calendar className="w-3 h-3" />
                {new Date(redacao.dataCriacao).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </div>

              <div className="flex items-center gap-2">
                {col.id === "concluida" && (
                  <>
                    {redacao.nota != null ? (
                      <span className={`flex items-center gap-1 font-black text-xs px-2 py-0.5 rounded-lg ${col.badge}`}>
                        <Star className="w-3 h-3 fill-current" /> {redacao.nota}
                      </span>
                    ) : (
                      <button
                        onPointerDown={(e) => { e.stopPropagation(); onLancarNota(redacao); }}
                        className={`opacity-0 group-hover:opacity-100 transition-all text-[10px] font-black uppercase px-2 py-1 rounded-lg ${col.badge} hover:brightness-95 border-dashed border-2`}
                      >
                        Lançar Nota
                      </button>
                    )}
                  </>
                )}
                {/* Ícone indicativo de clique */}
                {col.id !== "concluida" && onAdvance ? (
                  <button
                    onPointerDown={(e) => { e.stopPropagation(); onAdvance(redacao); }}
                    className="p-1.5 text-slate-300 dark:text-[#3A3A3C] hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                    title="Avançar etapa"
                  >
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

// ─── Coluna Kanban ─────────────────────────────────────────────────────────────
function KanbanColumn({ col, items, onDelete, onLancarNota, onOpenDetalhe, onAdvance }: {
  col: typeof COLUMNS[number]; items: RedacaoGlobal[];
  onDelete: (id: string, e: any) => void;
  onLancarNota: (r: RedacaoGlobal) => void;
  onOpenDetalhe: (r: RedacaoGlobal) => void;
  onAdvance: (r: RedacaoGlobal) => void;
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
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.length === 0 && (
            <div className={`h-32 flex items-center justify-center rounded-[2rem] border-2 border-dashed transition-all ${isOver ? "border-indigo-300 dark:border-indigo-700" : "border-slate-200 dark:border-[#2C2C2E]"}`}>
              <p className="text-[11px] text-slate-400 dark:text-[#52525B] font-medium">{col.emptyText}</p>
            </div>
          )}
          {items.map((redacao) => (
            <RedacaoCard
              key={redacao.id}
              redacao={redacao}
              col={col}
              onDelete={onDelete}
              onLancarNota={onLancarNota}
              onOpenDetalhe={onOpenDetalhe}
              onAdvance={onAdvance}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

// ─── Modal de Detalhe do Tema Proposto ────────────────────────────────────────
function TemaDetalheModal({
  tema,
  onClose,
  onAddProposta,
}: {
  tema: TemaProposta;
  onClose: () => void;
  onAddProposta: (t: TemaProposta) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    await onAddProposta(tema);
    setLoading(false);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative border border-slate-100 dark:border-[#2C2C2E]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 dark:hover:bg-[#3A3A3C] rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>

        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30 mb-5">
          <Star className="w-3 h-3 fill-current" /> Tema Oficial
        </span>

        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 leading-tight">
          {tema.titulo}
        </h2>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase mb-6">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(tema.dataCriacao).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "long", year: "numeric",
          })}
        </div>

        {tema.tema && (
          <div className="bg-slate-50 dark:bg-[#2C2C2E] rounded-2xl p-5 mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Proposta / Desenvolvimento</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {tema.tema}
            </p>
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-60 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all uppercase tracking-widest text-sm"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {loading ? "Adicionando…" : "Adicionar às Minhas Propostas"}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Item de Tema Oficial ──────────────────────────────────────────────────────
function TemaItem({
  tema,
  onAddProposta,
  onVerDetalhe,
}: {
  tema: TemaProposta;
  onAddProposta: (t: TemaProposta) => void;
  onVerDetalhe: (t: TemaProposta) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    await onAddProposta(tema);
    setLoading(false);
  };

  return (
    <div
      onClick={() => onVerDetalhe(tema)}
      className="cursor-pointer bg-white dark:bg-[#1C1C1E] p-5 rounded-[1.5rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm hover:border-amber-300 dark:hover:border-amber-700/60 hover:shadow-md transition-all flex flex-col group"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
          <Star className="w-3 h-3 fill-current" /> Oficial
        </span>
        <span className="text-[10px] text-slate-400 font-bold uppercase ml-auto">
          {formatDate(new Date(tema.dataCriacao), "dd/MMM", { locale: ptBR })}
        </span>
      </div>
      <h3 className="font-black text-slate-800 dark:text-white text-sm mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{tema.titulo}</h3>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">{tema.tema}</p>

      <button
        onClick={handleAdd}
        disabled={loading}
        className="mt-auto w-full py-2.5 bg-slate-50 hover:bg-indigo-600 dark:bg-[#2C2C2E] dark:hover:bg-indigo-600 text-slate-500 hover:text-white disabled:opacity-50 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Plus className="w-3.5 h-3.5" />
        )}
        {loading ? "Adicionando…" : "Adicionar às Propostas"}
      </button>
    </div>
  );
}


// ─── Página Principal ──────────────────────────────────────────────────────────
export default function RedacaoPage() {
  const [redacoes, setRedacoes] = useState<RedacaoGlobal[]>([]);
  const [temasOficiais, setTemasOficiais] = useState<TemaProposta[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = createClient();

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [selectedRedacao, setSelectedRedacao] = useState<RedacaoGlobal | null>(null);
  const [selectedTema, setSelectedTema] = useState<TemaProposta | null>(null);

  // Modal Nova Proposta (Tema Livre)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    temaId: "",
    titulo: "",
    tema: "",
    imagens: [] as string[],
  });

  // Modal Lançar Nota
  const [notaForm, setNotaForm] = useState<{ id: string; nota: string } | null>(null);

  // ⚠️ Hooks de sensor ANTES de qualquer return condicional
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  const mapStatusFront = (dbStatus: string): StudentKanbanStatus => {
    if (dbStatus === "PROPOSTA" || dbStatus === "A_FAZER" || dbStatus === "planejamento") return "proposta";
    if (dbStatus === "FAZENDO" || dbStatus === "EM_AVALIACAO" || dbStatus === "andamento") return "fazendo";
    if (dbStatus === "CONCLUIDA" || dbStatus === "concluida" || dbStatus === "DEVOLVIDA") return "concluida";
    return "proposta";
  };

  useEffect(() => {
    const fetchData = async () => {
      // Temas Oficiais
      const { data: dtTemas } = await supabase
        .from("temas_redacao")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (dtTemas) {
        setTemasOficiais(
          dtTemas.map((t) => ({
            id: t.id,
            titulo: t.titulo,
            tema: t.descricao_html || t.eixo_tematico || "",
            dataCriacao: t.created_at,
          }))
        );
      }

      // Sessão
      const { data: { user } } = await supabase.auth.getUser();
      const me = user?.id;

      if (me) {
        const { data: dtRedacoes } = await supabase
          .from("redacoes_aluno")
          .select(`id, status, tema_id, pdf_url, nota, created_at, temas_redacao (titulo, descricao_html)`)
          .eq("aluno_id", me)
          .order("created_at", { ascending: false });

        if (dtRedacoes) {
          setRedacoes(
            dtRedacoes.map((r) => ({
              id: r.id,
              studentId: me,
              titulo: (r.temas_redacao as any)?.titulo || "Minha Redação",
              temaId: r.tema_id,
              tema: (r.temas_redacao as any)?.descricao_html || "",
              dataCriacao: r.created_at,
              status: mapStatusFront(r.status),
              imagens: r.pdf_url ? [r.pdf_url] : [],
              nota: r.nota,
            }))
          );
        }
      }
      setIsLoaded(true);
    };

    fetchData();

    const rChannel = supabase
      .channel("redacoes_c_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "redacoes_aluno" }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(rChannel); };
  }, []);

  // ── Nova Proposta (Tema Livre) ──
  const openNew = () => {
    setForm({ temaId: "", titulo: "", tema: "", imagens: [] });
    setIsModalOpen(true);
  };

  // ── Adicionar Tema Oficial direto em Propostas (sem modal) ──
  const addTemaComoProposta = async (t: TemaProposta) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: rAl } = await supabase
      .from("redacoes_aluno")
      .insert([{
        aluno_id: user.id,
        tema_id: t.id,
        pdf_url: null,
        status: "PROPOSTA",
      }])
      .select()
      .single();

    if (rAl) {
      const nova: RedacaoGlobal = {
        id: rAl.id,
        studentId: user.id,
        titulo: t.titulo,
        tema: t.tema,
        dataCriacao: rAl.created_at,
        status: "proposta",
        imagens: [],
      };
      setRedacoes((prev) => [nova, ...prev]);
    }
  };

  // ── Salvar Proposta Livre ──
  const saveRedacao = async () => {
    if (!form.titulo.trim()) return;

    let finalTemaId = form.temaId;
    const { data: { user } } = await supabase.auth.getUser();

    if (!finalTemaId) {
      const { data: newTema } = await supabase
        .from("temas_redacao")
        .insert([{
          admin_id: user?.id,
          titulo: form.titulo,
          descricao_html: form.tema,
          is_published: false,
        }])
        .select()
        .single();
      if (newTema) finalTemaId = newTema.id;
    }

    const { data: rAl } = await supabase
      .from("redacoes_aluno")
      .insert([{
        aluno_id: user?.id,
        tema_id: finalTemaId,
        pdf_url: form.imagens[0] || null,
        status: "PROPOSTA",
      }])
      .select()
      .single();

    if (rAl) {
      const nova: RedacaoGlobal = {
        id: rAl.id,
        studentId: user?.id || "",
        titulo: form.titulo,
        tema: form.tema,
        dataCriacao: rAl.created_at,
        status: "proposta",
        imagens: form.imagens,
      };
      setRedacoes([nova, ...redacoes]);
    }

    setForm({ temaId: "", titulo: "", tema: "", imagens: [] });
    setIsModalOpen(false);
  };

  const handleDragStart = (e: DragStartEvent) => {
    setActiveDragId(String(e.active.id));
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = e;
    if (!over) return;

    const activeId = String(active.id);
    const targetStatus = over.id as StudentKanbanStatus;
    const currentRedacao = redacoes.find((r) => r.id === activeId);

    if (currentRedacao && currentRedacao.status !== targetStatus) {
      setRedacoes((prev) => prev.map((r) => r.id === activeId ? { ...r, status: targetStatus } : r));
      await supabase.from("redacoes_aluno").update({ status: targetStatus.toUpperCase() }).eq("id", activeId);
      // Atualiza selectedRedacao se estiver aberto
      if (selectedRedacao?.id === activeId) {
        setSelectedRedacao((prev) => prev ? { ...prev, status: targetStatus } : null);
      }
    }
  };

  const handleAdvance = async (redacao: RedacaoGlobal) => {
    let nextStatus: StudentKanbanStatus = "proposta";
    if (redacao.status === "proposta") nextStatus = "fazendo";
    else if (redacao.status === "fazendo") nextStatus = "concluida";
    else return;

    setRedacoes((prev) => prev.map((r) => r.id === redacao.id ? { ...r, status: nextStatus } : r));
    await supabase.from("redacoes_aluno").update({ status: nextStatus.toUpperCase() }).eq("id", redacao.id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, imagens: [...prev.imagens, reader.result as string] }));
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteRedacao = async (id: string, e: any) => {
    if (e) e.stopPropagation();
    await supabase.from("redacoes_aluno").delete().eq("id", id);
    setRedacoes(redacoes.filter((r) => r.id !== id));
    if (selectedRedacao?.id === id) setSelectedRedacao(null);
  };

  const confirmarNota = async () => {
    if (!notaForm || !notaForm.nota) return;
    const num = parseInt(notaForm.nota);
    if (isNaN(num)) return;

    await supabase.from("redacoes_aluno").update({ nota: num }).eq("id", notaForm.id);
    setRedacoes((prev) => prev.map((r) => r.id === notaForm.id ? { ...r, nota: num } : r));
    setNotaForm(null);
  };

  if (!isLoaded) return null;

  const concluidas = redacoes.filter((r) => r.status === "concluida" && r.nota != null);
  const mediaNotas = concluidas.length > 0
    ? Math.round(concluidas.reduce((a, b) => a + (b.nota || 0), 0) / concluidas.length)
    : null;
  const dChart = redacoes
    .filter((r) => r.nota != null)
    .map((r) => ({
      name: r.titulo,
      nota: r.nota || 0,
      date: formatDate(new Date(r.dataCriacao), "dd/MM", { locale: ptBR }),
    }))
    .slice(-10);

  const selectedCol = selectedRedacao
    ? COLUMNS.find((c) => c.id === selectedRedacao.status)!
    : COLUMNS[0];

  const temasDisponiveis = temasOficiais.filter((t) => !redacoes.some((r) => r.temaId === t.id));

  return (
    <div className="max-w-[1600px] mx-auto pb-20 animate-in fade-in duration-500 space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="relative">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4 relative z-10">
            <div className="bg-indigo-600 p-3 rounded-[1.2rem] shadow-lg shadow-indigo-600/20">
              <PenTool className="w-8 h-8 text-white" />
            </div>
            Minha Bancada
          </h1>
          <div className="flex items-center gap-3 mt-3 relative z-10">
            <div className="h-1 w-12 bg-indigo-500 rounded-full" />
            <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em]">Asas para o Enem! Acompanhe suas notas.</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all text-white font-black px-7 py-4 rounded-2xl shadow-xl shadow-indigo-500/20 text-sm uppercase tracking-widest"
        >
          <Plus className="w-5 h-5" /> Nova Proposta
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Feitas", value: redacoes.length, accent: "text-slate-700 dark:text-white" },
          { label: "Em Proposta", value: redacoes.filter((r) => r.status === "proposta").length, accent: "text-slate-500 dark:text-[#A1A1AA]" },
          { label: "Concluídas", value: redacoes.filter((r) => r.status === "concluida").length, accent: "text-teal-600 dark:text-teal-400" },
          { label: "Nota média", value: mediaNotas ? `${mediaNotas}/1000` : "—", accent: "text-indigo-600 dark:text-indigo-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-[#1C1C1E] rounded-2xl px-6 py-4 border border-slate-100 dark:border-[#2C2C2E] shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.accent}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid lg:grid-cols-[1fr_3.5fr] gap-6 items-start">

          {/* Temas Oficiais */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1 mb-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-black uppercase tracking-[0.15em] text-slate-800 dark:text-white">Temas Propostos</h2>
            </div>

            <div className="bg-amber-50/50 dark:bg-amber-900/10 border-2 border-amber-100 dark:border-amber-900/30 rounded-[2.5rem] p-4 flex flex-col gap-3 max-h-[80vh] overflow-y-auto no-scrollbar">
              {temasDisponiveis.map((t) => (
                <TemaItem key={t.id} tema={t} onAddProposta={addTemaComoProposta} onVerDetalhe={setSelectedTema} />
              ))}
              {temasDisponiveis.length === 0 && (
                <div className="py-10 text-center">
                  <Star className="w-6 h-6 text-amber-300 mx-auto mb-2" />
                  <p className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Nenhum tema oficial</p>
                </div>
              )}
            </div>
          </div>

          {/* Quadro Kanban */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                col={col}
                items={redacoes.filter((r) => r.status === col.id)}
                onDelete={deleteRedacao}
                onLancarNota={(r) => setNotaForm({ id: r.id, nota: String(r.nota || "") })}
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
                redacao={redacoes.find((r) => r.id === activeDragId)!}
                col={COLUMNS.find((c) => c.id === redacoes.find((r) => r.id === activeDragId)?.status)!}
                onDelete={() => {}}
                onLancarNota={() => {}}
                onOpenDetalhe={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Gráfico de Evolução */}
      {dChart && dChart.length > 0 && (
        <div className="mt-12 bg-white dark:bg-[#1C1C1E] p-8 md:p-10 rounded-[3rem] shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Activity className="w-6 h-6 text-indigo-500" /> Evolução das Notas
              </h3>
              <p className="text-sm text-slate-500 mt-1">Acompanhe seu desempenho nas redações recentes.</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dChart}>
                <defs>
                  <linearGradient id="colorNota" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} dx={-10} domain={[0, 1000]} />
                <Tooltip
                  contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,.1)", padding: "12px 16px", fontWeight: "bold" }}
                />
                <Line yAxisId="left" type="monotone" dataKey="nota" name="Nota" stroke="#4F46E5" strokeWidth={4} dot={{ r: 6, fill: "#4F46E5", strokeWidth: 3, stroke: "#fff" }} activeDot={{ r: 8 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Modal Detalhes da Proposta (card Kanban) ── */}
      <AnimatePresence>
        {selectedRedacao && (
          <DetalheModal
            redacao={selectedRedacao}
            col={selectedCol}
            onClose={() => setSelectedRedacao(null)}
            onDelete={deleteRedacao}
            onLancarNota={(r) => setNotaForm({ id: r.id, nota: String(r.nota || "") })}
          />
        )}
      </AnimatePresence>

      {/* ── Modal Detalhes do Tema Proposto (painel esquerdo) ── */}
      <AnimatePresence>
        {selectedTema && (
          <TemaDetalheModal
            tema={selectedTema}
            onClose={() => setSelectedTema(null)}
            onAddProposta={addTemaComoProposta}
          />
        )}
      </AnimatePresence>

      {/* ── Modal Lançar Nota ── */}
      <AnimatePresence>
        {notaForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative border border-slate-100 dark:border-[#2C2C2E]"
            >
              <button onClick={() => setNotaForm(null)} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                <Award className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Lançar Nota (Enem)</h2>
              <p className="text-sm text-slate-500 mb-6">Registre quanto você tirou nessa redação ao corrigi-la em seu cursinho ou plataforma.</p>
              <div className="space-y-4 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Nota Alcançada (0 – 1000)</label>
                  <input
                    type="number" min="0" max="1000"
                    value={notaForm.nota}
                    onChange={(e) => setNotaForm({ ...notaForm, nota: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-transparent rounded-2xl px-5 py-4 text-2xl font-black text-center focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="Ex: 840"
                  />
                </div>
              </div>
              <button onClick={confirmarNota} className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all uppercase tracking-widest text-sm">
                Confirmar e Salvar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal Nova Proposta (Livre) ── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative border border-slate-100 dark:border-[#2C2C2E]"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 dark:hover:bg-[#3A3A3C] rounded-full flex items-center justify-center transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>

              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                <Lightbulb className="w-7 h-7" />
              </div>

              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Nova Proposta</h2>
              <p className="text-sm text-slate-500 mb-8">Crie uma proposta de tema livre. Ela vai direto para a coluna de Propostas.</p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Título</label>
                  <input
                    type="text" value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-transparent rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="Título da proposta"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Tema Base</label>
                  <textarea
                    rows={4} value={form.tema}
                    onChange={(e) => setForm({ ...form, tema: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-transparent rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-indigo-100 outline-none resize-none transition-all"
                    placeholder="Descreva brevemente o tema proposto…"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Imagens Manuscritas</label>
                  <div className="grid grid-cols-4 gap-4">
                    <label className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-[#3A3A3C] rounded-2xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-[#2C2C2E] transition-all group">
                      <Plus className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 mb-1" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                    {form.imagens.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group">
                        <img src={img} alt={`Anexo ${i}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setForm((f) => ({ ...f, imagens: f.imagens.filter((_, idx) => idx !== i) }))}
                          className="absolute inset-0 m-auto w-8 h-8 flex items-center justify-center bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={saveRedacao}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all uppercase tracking-widest text-sm flex justify-center items-center gap-2 mt-4"
                >
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
