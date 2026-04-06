"use client";

import React, { useState, useEffect } from "react";
import {
  PenTool, Plus, Trash2, ArrowRight,
  Lightbulb, FileText, ClipboardCheck, Award,
  X, Star, Calendar, GripVertical
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
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";

type KanbanStatus = "proposta" | "rascunho" | "correcao" | "corrigida";

interface Redacao {
  id: string;
  titulo: string;
  tema: string;
  dataCriacao: string;
  status: KanbanStatus;
  nota?: number | null;
}

const COLUMNS: {
  id: KanbanStatus;
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
    accent: "text-violet-500",
    dot: "bg-violet-500",
    card: "hover:border-violet-200 dark:hover:border-violet-900/60",
    badge: "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900/30",
    emptyText: "Solte um card aqui.",
  },
  {
    id: "rascunho",
    label: "Rascunho",
    icon: FileText,
    accent: "text-indigo-500",
    dot: "bg-indigo-500",
    card: "hover:border-indigo-200 dark:hover:border-indigo-900/60",
    badge: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30",
    emptyText: "Solte um card aqui.",
  },
  {
    id: "correcao",
    label: "Em Correção",
    icon: ClipboardCheck,
    accent: "text-amber-500",
    dot: "bg-amber-500",
    card: "hover:border-amber-200 dark:hover:border-amber-900/60",
    badge: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
    emptyText: "Solte um card aqui.",
  },
  {
    id: "corrigida",
    label: "Corrigida",
    icon: Award,
    accent: "text-teal-500",
    dot: "bg-teal-500",
    card: "hover:border-teal-200 dark:hover:border-teal-900/60",
    badge: "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/30",
    emptyText: "Solte um card aqui.",
  },
];

// ─── Card Componente (Draggable) ───────────────────────────────────────────────
function RedacaoCard({
  redacao,
  col,
  onDelete,
  onAvancar,
  onSalvarNota,
}: {
  redacao: Redacao;
  col: typeof COLUMNS[number];
  onDelete: (id: string) => void;
  onAvancar: (id: string) => void;
  onSalvarNota: (id: string, nota: number) => void;
}) {
  const [editingNota, setEditingNota] = useState(false);
  const [notaInput, setNotaInput] = useState("");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: redacao.id, data: { status: redacao.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const handleSalvarNota = () => {
    const n = parseInt(notaInput);
    if (!isNaN(n) && n >= 0 && n <= 1000) {
      onSalvarNota(redacao.id, n);
    }
    setEditingNota(false);
    setNotaInput("");
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`group bg-white dark:bg-[#1C1C1E] p-5 rounded-[1.5rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm transition-all ${col.card} ${isDragging ? "shadow-xl ring-2 ring-indigo-400/40" : ""}`}
      >
        <div className="flex items-start gap-2">
          {/* Alça de arrasto */}
          <div
            {...attributes}
            {...listeners}
            className="mt-0.5 p-1 -ml-1 text-slate-300 dark:text-[#3A3A3C] cursor-grab active:cursor-grabbing hover:text-slate-500 transition-colors rounded-lg opacity-0 group-hover:opacity-100"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-snug">
                {redacao.titulo}
              </h3>
              <button
                onClick={() => onDelete(redacao.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-300 hover:text-rose-500 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {redacao.tema && (
              <p className="text-[11px] text-slate-400 dark:text-[#71717A] leading-relaxed line-clamp-2 mb-4">
                {redacao.tema}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-300 dark:text-[#52525B] font-bold uppercase">
                <Calendar className="w-3 h-3" />
                {new Date(redacao.dataCriacao).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })}
              </div>

              <div className="flex items-center gap-2">
                {/* Nota — apenas em "corrigida" */}
                {col.id === "corrigida" &&
                  (editingNota ? (
                    <div className="flex items-center gap-1">
                      <input
                        autoFocus
                        type="number"
                        min={0}
                        max={1000}
                        value={notaInput}
                        onChange={(e) => setNotaInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSalvarNota()}
                        className="w-16 text-center font-black text-xs bg-slate-100 dark:bg-[#2C2C2E] rounded-lg px-2 py-1 outline-none border-none"
                        placeholder="0"
                      />
                      <button onClick={handleSalvarNota} className="p-1 text-teal-500 font-black">
                        ✓
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingNota(true);
                        setNotaInput(redacao.nota?.toString() ?? "");
                      }}
                      className={`flex items-center gap-1 font-black text-xs transition-opacity ${redacao.nota != null ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    >
                      {redacao.nota != null ? (
                        <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {redacao.nota}
                        </span>
                      ) : (
                        <span className="text-slate-400 border border-dashed border-slate-200 dark:border-[#3A3A3C] px-2 py-0.5 rounded-lg">
                          + nota
                        </span>
                      )}
                    </button>
                  ))}

                {/* Avançar */}
                {col.id !== "corrigida" && (
                  <button
                    onClick={() => onAvancar(redacao.id)}
                    className={`opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl ${col.badge}`}
                  >
                    Avançar <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Coluna Droppable ──────────────────────────────────────────────────────────
function KanbanColumn({
  col,
  items,
  onDelete,
  onAvancar,
  onSalvarNota,
}: {
  col: typeof COLUMNS[number];
  items: Redacao[];
  onDelete: (id: string) => void;
  onAvancar: (id: string) => void;
  onSalvarNota: (id: string, nota: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  const Icon = col.icon;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
          <h2 className={`text-xs font-black uppercase tracking-[0.15em] ${col.accent}`}>
            {col.label}
          </h2>
        </div>
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${col.badge}`}>
          {items.length}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[60vh] rounded-[2rem] p-3 space-y-3 border-2 transition-all duration-200 ${
          isOver
            ? "border-indigo-400 dark:border-indigo-600 bg-indigo-50/60 dark:bg-indigo-900/10 scale-[1.01]"
            : "border-transparent bg-slate-50/80 dark:bg-[#1C1C1E]/60 border-slate-100 dark:border-[#2C2C2E]"
        }`}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.length === 0 && (
            <div className={`h-32 flex items-center justify-center rounded-2xl border-2 border-dashed transition-all ${isOver ? "border-indigo-300 dark:border-indigo-700" : "border-slate-200 dark:border-[#2C2C2E]"}`}>
              <p className="text-[11px] text-slate-400 dark:text-[#52525B] font-medium">
                {col.emptyText}
              </p>
            </div>
          )}
          {items.map((redacao) => (
            <RedacaoCard
              key={redacao.id}
              redacao={redacao}
              col={col}
              onDelete={onDelete}
              onAvancar={onAvancar}
              onSalvarNota={onSalvarNota}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

// ─── Ghost Card (durante o arrasto) ───────────────────────────────────────────
function GhostCard({ redacao }: { redacao: Redacao }) {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-[1.5rem] border border-indigo-300 dark:border-indigo-700 shadow-2xl shadow-indigo-500/20 ring-2 ring-indigo-400/30 rotate-2 min-w-[240px] cursor-grabbing">
      <h3 className="font-bold text-slate-800 dark:text-white text-sm">{redacao.titulo}</h3>
      {redacao.tema && (
        <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">{redacao.tema}</p>
      )}
    </div>
  );
}

// ─── PAGE ──────────────────────────────────────────────────────────────────────
export default function RedacaoPage() {
  const [redacoes, setRedacoes] = useState<Redacao[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", tema: "" });
  const [activeRedacao, setActiveRedacao] = useState<Redacao | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("@sinapse/redacoes");
      if (saved) setRedacoes(JSON.parse(saved));
    } catch {}
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("@sinapse/redacoes", JSON.stringify(redacoes));
    }
  }, [redacoes, isLoaded]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const r = redacoes.find((r) => r.id === event.active.id.toString());
    if (r) setActiveRedacao(r);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveRedacao(null);
    if (!over) return;

    const draggedId = active.id.toString();
    const overId = over.id.toString();

    // Se soltou sobre uma COLUNA
    if (COLUMNS.find((c) => c.id === overId)) {
      const newStatus = overId as KanbanStatus;
      setRedacoes((prev) =>
        prev.map((r) => (r.id === draggedId ? { ...r, status: newStatus } : r))
      );
      return;
    }

    // Se soltou sobre outro CARD (reordenação dentro da mesma coluna)
    const draggedItem = redacoes.find((r) => r.id === draggedId);
    const overItem = redacoes.find((r) => r.id === overId);
    if (!draggedItem || !overItem) return;

    if (draggedItem.status === overItem.status) {
      const filtered = redacoes.filter((r) => r.status === draggedItem.status);
      const oldIdx = filtered.findIndex((r) => r.id === draggedId);
      const newIdx = filtered.findIndex((r) => r.id === overId);
      const reordered = arrayMove(filtered, oldIdx, newIdx);
      setRedacoes((prev) => [
        ...prev.filter((r) => r.status !== draggedItem.status),
        ...reordered,
      ]);
    } else {
      // Moveu para outra coluna soltando sobre um card
      setRedacoes((prev) =>
        prev.map((r) => (r.id === draggedId ? { ...r, status: overItem.status } : r))
      );
    }
  };

  const addRedacao = () => {
    if (!form.titulo.trim()) return;
    const nova: Redacao = {
      id: Date.now().toString(36),
      titulo: form.titulo,
      tema: form.tema,
      dataCriacao: new Date().toISOString(),
      status: "proposta",
      nota: null,
    };
    setRedacoes((prev) => [nova, ...prev]);
    setForm({ titulo: "", tema: "" });
    setIsModalOpen(false);
  };

  const avançarEstagio = (id: string) => {
    setRedacoes((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const idx = COLUMNS.findIndex((c) => c.id === r.status);
        const next = COLUMNS[idx + 1];
        return next ? { ...r, status: next.id } : r;
      })
    );
  };

  const salvarNota = (id: string, nota: number) => {
    setRedacoes((prev) => prev.map((r) => (r.id === id ? { ...r, nota } : r)));
  };

  const deleteRedacao = (id: string) => {
    setRedacoes((prev) => prev.filter((r) => r.id !== id));
  };

  if (!isLoaded) return null;

  const corrigidas = redacoes.filter((r) => r.status === "corrigida" && r.nota != null);
  const mediaNotas =
    corrigidas.length > 0
      ? Math.round(corrigidas.reduce((a, b) => a + (b.nota ?? 0), 0) / corrigidas.length)
      : null;

  return (
    <div className="max-w-[1600px] mx-auto pb-20 animate-in fade-in duration-500 space-y-8">

      {/* ─── HEADER ─── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <PenTool className="w-10 h-10 text-indigo-600" />
            Redação
          </h1>
          <p className="text-slate-500 dark:text-[#A1A1AA] mt-1 font-medium">
            Arraste os cards entre as colunas para mover no Kanban.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all text-white font-black px-7 py-4 rounded-2xl shadow-xl shadow-indigo-500/20 text-sm uppercase tracking-widest"
        >
          <Plus className="w-5 h-5" /> Nova Redação
        </button>
      </header>

      {/* ─── STATS ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: redacoes.length, accent: "text-slate-700 dark:text-white" },
          { label: "Em andamento", value: redacoes.filter((r) => r.status !== "corrigida").length, accent: "text-indigo-600 dark:text-indigo-400" },
          { label: "Corrigidas", value: redacoes.filter((r) => r.status === "corrigida").length, accent: "text-teal-600 dark:text-teal-400" },
          { label: "Nota média", value: mediaNotas != null ? `${mediaNotas}/1000` : "—", accent: "text-amber-600 dark:text-amber-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-[#1C1C1E] rounded-2xl px-6 py-4 border border-slate-100 dark:border-[#2C2C2E] shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.accent}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ─── KANBAN DRAG & DROP ─── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              col={col}
              items={redacoes.filter((r) => r.status === col.id)}
              onDelete={deleteRedacao}
              onAvancar={avançarEstagio}
              onSalvarNota={salvarNota}
            />
          ))}
        </div>

        {/* Ghost card enquanto arrasta */}
        <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
          {activeRedacao ? <GhostCard redacao={activeRedacao} /> : null}
        </DragOverlay>
      </DndContext>

      {/* ─── MODAL ─── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl relative"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Nova Redação</h2>
              <p className="text-sm text-slate-400 mb-8">
                Preencha os dados. O card entrará em <strong>Proposta</strong>.
              </p>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título</label>
                  <input
                    autoFocus
                    type="text"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && addRedacao()}
                    placeholder="Ex: Redação #01 — Mercado de trabalho"
                    className="w-full bg-slate-50 dark:bg-[#2C2C2E] rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tema Proposto</label>
                  <textarea
                    rows={4}
                    value={form.tema}
                    onChange={(e) => setForm({ ...form, tema: e.target.value })}
                    placeholder="Descreva o tema, a coletânea ou o enunciado..."
                    className="w-full bg-slate-50 dark:bg-[#2C2C2E] rounded-2xl px-5 py-4 text-sm font-medium resize-none outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-[#2C2C2E] text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addRedacao}
                    disabled={!form.titulo.trim()}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                  >
                    Criar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
