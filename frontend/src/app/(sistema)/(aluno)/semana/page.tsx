"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Calendar, Plus, X, Check, Clock, BookOpen, PenTool,
  Layers, RotateCcw, AlertCircle, ChevronLeft, ChevronRight,
  Trash2, Edit2, Book, Zap, Coffee, BarChart2,
  CheckSquare, Loader2, ArrowRight, Target, Save
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClient } from "@/utils/supabase/client";

// ─── TYPES ─────────────────────────────────────────────────────────
type TipoBloco = "aula" | "estudo" | "revisao" | "simulado" | "livre" | "outro";
type StatusBloco = "prontidao" | "personalizado" | "concluido" | "abandonado" | "reposicao";

type Disciplina = { id: string; nome: string; cor_hex: string };

type RotinaItem = {
  id: string;
  user_id: string;
  dia_semana: number;
  ordem: number;
  tipo: TipoBloco;
  horario_ini: string;
  horario_fim: string;
  disciplina_id: string | null;
  descricao: string;
  disciplinas?: Disciplina;
};

type SemanaBloco = {
  id: string;
  user_id: string;
  rotina_id: string | null;
  tarefa_origem_id?: string | null;
  data_referencia: string;
  tipo: TipoBloco;
  horario_ini: string;
  horario_fim: string;
  disciplina_id: string | null;
  descricao: string;
  status: StatusBloco;
  sessao_id: string | null;
  notas: string | null;
  disciplinas?: Disciplina;
};


// ─── CONSTANTS ─────────────────────────────────────────────────────
const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DIAS_COMPLETO = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const TIPOS_BLOCO: { value: TipoBloco; label: string; icon: React.ReactNode; cor: string }[] = [
  { value: "aula", label: "Aula", icon: <BookOpen className="w-4 h-4" />, cor: "bg-blue-500" },
  { value: "estudo", label: "Estudo", icon: <Book className="w-4 h-4" />, cor: "bg-indigo-500" },
  { value: "revisao", label: "Revisão", icon: <RotateCcw className="w-4 h-4" />, cor: "bg-purple-500" },
  { value: "simulado", label: "Simulado", icon: <BarChart2 className="w-4 h-4" />, cor: "bg-rose-500" },
  { value: "livre", label: "Livre", icon: <Coffee className="w-4 h-4" />, cor: "bg-emerald-500" },
  { value: "outro", label: "Outro", icon: <Zap className="w-4 h-4" />, cor: "bg-amber-500" },
];

const STATUS_CONFIG: Record<StatusBloco, { cor: string; label: string; bg: string; border: string }> = {
  prontidao:   { cor: "text-amber-700 dark:text-amber-300",  label: "Prontidão",   bg: "bg-amber-50 dark:bg-amber-500/10",   border: "border-amber-200 dark:border-amber-500/30" },
  personalizado:{ cor: "text-indigo-700 dark:text-indigo-300",label: "Personalizado",bg: "bg-indigo-50 dark:bg-indigo-500/10", border: "border-indigo-200 dark:border-indigo-500/30" },
  concluido:   { cor: "text-emerald-700 dark:text-emerald-300",label: "Concluído", bg: "bg-emerald-50 dark:bg-emerald-500/10",border: "border-emerald-200 dark:border-emerald-500/30" },
  abandonado:  { cor: "text-slate-500 dark:text-slate-400",   label: "Abandonado", bg: "bg-slate-50 dark:bg-slate-800",       border: "border-slate-200 dark:border-slate-700" },
  reposicao:   { cor: "text-sky-700 dark:text-sky-300",       label: "Reposição",  bg: "bg-sky-50 dark:bg-sky-500/10",        border: "border-sky-200 dark:border-sky-500/30" },
};

function getTipoCor(tipo: TipoBloco) {
  return TIPOS_BLOCO.find(t => t.value === tipo)?.cor ?? "bg-slate-400";
}

// ─── HELPERS ───────────────────────────────────────────────────────
function getSemanaAtual(refDate: Date): Date[] {
  const dom = startOfWeek(refDate, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) => addDays(dom, i));
}

function calcPreenchimento(blocos: SemanaBloco[]): number {
  const ativos = blocos.filter(b => b.status !== "abandonado").length;
  const totalSlots = 7 * 16; // ~16 slots úteis por dia
  return Math.min(100, Math.round((ativos / totalSlots) * 100));
}

// ─── COMPONENTE: BLOCO CARD ────────────────────────────────────────
function BlocoCard({
  bloco,
  disciplinas,
  onConfirmar,
  onNaoFeito,
  onEditar,
  onRemover,
}: {
  bloco: SemanaBloco;
  disciplinas: Disciplina[];
  onConfirmar: (bloco: SemanaBloco) => void;
  onNaoFeito: (bloco: SemanaBloco) => void;
  onEditar: (bloco: SemanaBloco) => void;
  onRemover: (id: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const cfg = STATUS_CONFIG[bloco.status];
  const tipoDef = TIPOS_BLOCO.find(t => t.value === bloco.tipo);
  const disc = disciplinas.find(d => d.id === bloco.disciplina_id);
  const concluido = bloco.status === "concluido" || bloco.status === "abandonado";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border px-3 py-2.5 text-xs font-bold transition-all relative group ${cfg.bg} ${cfg.border} ${concluido ? "opacity-60" : "hover:shadow-md cursor-pointer"}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* DISCIPLINA OU TIPO (Destaque superior) */}
          {disc ? (
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: disc.cor_hex }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: disc.cor_hex }}>
                {disc.nome}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`w-1.5 h-1.5 rounded-full ${getTipoCor(bloco.tipo)}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {tipoDef?.label}
              </span>
            </div>
          )}

          {/* DESCRIÇÃO (Principal Destaque) */}
          <div className={`text-[11px] font-black leading-tight mb-1 truncate ${cfg.cor}`}>
            {bloco.descricao}
          </div>

          {/* HORÁRIO (Secundário) */}
          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400/70">
            <span>{bloco.horario_ini.slice(0,5)} – {bloco.horario_fim.slice(0,5)}</span>
          </div>

          {bloco.notas && (
            <p className="text-slate-400 text-[9px] mt-2 italic truncate border-t border-slate-100 dark:border-slate-800 pt-1">
              {bloco.notas}
            </p>
          )}
        </div>

        {/* Actions */}
        {!concluido && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              title="Confirmar feito"
              onClick={() => onConfirmar(bloco)}
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 hover:bg-emerald-200 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              title="Não feito"
              onClick={() => onNaoFeito(bloco)}
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-500 hover:bg-rose-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <button
              title="Editar"
              onClick={() => onEditar(bloco)}
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              title="Remover"
              onClick={() => onRemover(bloco.id)}
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── MODAL: CONFIRMAR EXECUÇÃO ─────────────────────────────────────
function ModalConfirmar({
  bloco,
  disciplinas,
  onClose,
  onSave,
}: {
  bloco: SemanaBloco | null;
  disciplinas: Disciplina[];
  onClose: () => void;
  onSave: (blocoId: string, dados: { notas: string; tipo_estudo?: string; duracao_min?: number; acertos?: number; total_questoes?: number }) => Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [notas, setNotas] = useState("");
  const [tipoEstudo, setTipoEstudo] = useState<"teorico" | "pratico" | "misto">("misto");
  const [duracaoH, setDuracaoH] = useState("0");
  const [duracaoM, setDuracaoM] = useState("0");
  const [acertos, setAcertos] = useState("0");
  const [questoes, setQuestoes] = useState("0");

  if (!bloco) return null;
  const precisaDetalhe = ["estudo", "revisao"].includes(bloco.tipo);
  const precisaQuestoes = ["estudo", "revisao", "simulado"].includes(bloco.tipo) && tipoEstudo !== "teorico";

  async function handleSave() {
    setIsSaving(true);
    await onSave(bloco!.id, {
      notas,
      tipo_estudo: precisaDetalhe ? tipoEstudo : undefined,
      duracao_min: precisaDetalhe ? parseInt(duracaoH) * 60 + parseInt(duracaoM) : undefined,
      acertos: precisaQuestoes ? parseInt(acertos) : undefined,
      total_questoes: precisaQuestoes ? parseInt(questoes) : undefined,
    });
    setIsSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-black text-slate-800 dark:text-white mb-1">Confirmar Conclusão</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">{bloco.descricao}</p>

          {/* Tipo de estudo (apenas para estudo/revisão) */}
          {precisaDetalhe && (
            <>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl grid grid-cols-3 gap-2 mb-4 border border-slate-100 dark:border-slate-700">
                {(["teorico", "pratico", "misto"] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipoEstudo(t)}
                    className={`py-3 rounded-xl flex flex-col items-center gap-2 transition-all text-xs font-black uppercase ${
                      tipoEstudo === t
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {t === "teorico" ? <Book className="w-5 h-5" /> : t === "pratico" ? <PenTool className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                    {t}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Horas</label>
                  <input type="number" min="0" value={duracaoH} onChange={e => setDuracaoH(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xl font-black text-center outline-none border-2 border-transparent focus:border-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Minutos</label>
                  <input type="number" min="0" max="59" value={duracaoM} onChange={e => setDuracaoM(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xl font-black text-center outline-none border-2 border-transparent focus:border-indigo-500" />
                </div>
              </div>

              {precisaQuestoes && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Questões</label>
                    <input type="number" min="0" value={questoes} onChange={e => setQuestoes(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xl font-black text-center outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Acertos</label>
                    <input type="number" min="0" value={acertos} onChange={e => setAcertos(e.target.value)}
                      className="w-full bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl text-xl font-black text-center outline-none text-emerald-600" />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="space-y-1 mb-6">
            <label className="text-[10px] font-black text-slate-400 uppercase">Anotações (Opcional)</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={3}
              placeholder="O que você estudou, observações..."
              className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm font-medium outline-none border border-slate-200 dark:border-slate-700 focus:border-indigo-500 resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
            Confirmar Conclusão
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── MODAL: NÃO FEITO ─────────────────────────────────────────────
function ModalNaoFeito({
  bloco,
  onClose,
  onAbandonar,
  onCriarReposicao,
}: {
  bloco: SemanaBloco | null;
  onClose: () => void;
  onAbandonar: (blocoId: string) => Promise<void>;
  onCriarReposicao: (blocoId: string, prazo: string) => Promise<void>;
}) {
  const [opcao, setOpcao] = useState<"" | "abandonar" | "repor">("");
  const [prazo, setPrazo] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!bloco) return null;

  const isPersonalizado = bloco.tarefa_origem_id != null;

  async function handleConfirm() {
    setIsSaving(true);
    if (opcao === "abandonar" || isPersonalizado) {
      await onAbandonar(bloco!.id);
    } else if (opcao === "repor") {
      await onCriarReposicao(bloco!.id, prazo);
    }
    setIsSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-700">
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-rose-500" />
        </div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white mb-1">Não foi feito?</h2>
        <p className="text-sm text-slate-400 mb-6">"{bloco.descricao}"</p>

        {isPersonalizado ? (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 mb-6">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
              Esta atividade voltará automaticamente para sua lista de atividades pendentes.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            <button
              onClick={() => setOpcao("repor")}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                opcao === "repor"
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-500/10"
                  : "border-slate-100 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              <p className="font-black text-slate-800 dark:text-white text-sm">⏩ Criar Reposição</p>
              <p className="text-xs text-slate-400 mt-0.5">Agendar esta tarefa para outro dia</p>
            </button>
            <button
              onClick={() => setOpcao("abandonar")}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                opcao === "abandonar"
                  ? "border-rose-400 bg-rose-50 dark:bg-rose-500/10"
                  : "border-slate-100 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              <p className="font-black text-slate-800 dark:text-white text-sm">🚫 Abandonar</p>
              <p className="text-xs text-slate-400 mt-0.5">Registrar como não feito (sem reposição)</p>
            </button>
          </div>
        )}

        {opcao === "repor" && (
          <div className="mb-6">
            <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Prazo para reposição</label>
            <input
              type="date"
              value={prazo}
              min={new Date().toISOString().split("T")[0]}
              onChange={e => setPrazo(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-sky-500"
            />
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={isSaving || (!isPersonalizado && !opcao) || (opcao === "repor" && !prazo)}
          className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Check className="w-5 h-5" />}
          Confirmar
        </button>
      </motion.div>
    </div>
  );
}

// ─── MODAL: ADICIONAR / EDITAR BLOCO ──────────────────────────────
function ModalBloco({
  bloco,
  diaAlvo,
  disciplinas,
  onClose,
  onSave,
}: {
  bloco: SemanaBloco | null;
  diaAlvo: string | null;
  disciplinas: Disciplina[];
  onClose: () => void;
  onSave: (dados: Partial<SemanaBloco>) => Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    tipo: (bloco?.tipo ?? "estudo") as TipoBloco,
    horario_ini: bloco?.horario_ini?.slice(0, 5) ?? "08:00",
    horario_fim: bloco?.horario_fim?.slice(0, 5) ?? "09:00",
    descricao: bloco?.descricao ?? "",
    disciplina_id: bloco?.disciplina_id ?? "",
    data_referencia: bloco?.data_referencia ?? diaAlvo ?? "",
  });

  async function handleSave() {
    if (!form.data_referencia) { toast.error("Selecione uma data."); return; }
    const tipoDef = TIPOS_BLOCO.find(t => t.value === form.tipo);
    const descricaoFinal = form.descricao.trim() || tipoDef?.label || form.tipo;
    setIsSaving(true);
    await onSave({
      ...form,
      descricao: descricaoFinal,
      disciplina_id: form.disciplina_id || null,
    });
    setIsSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6">
            {bloco ? "Editar Bloco" : "Novo Bloco"}
          </h2>

          <div className="space-y-5">
            {/* Tipo */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Tipo</label>
              <div className="grid grid-cols-3 gap-2">
                {TIPOS_BLOCO.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, tipo: t.value }))}
                    className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 text-[10px] font-black uppercase transition-all border-2 ${
                      form.tipo === t.value
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600"
                        : "border-slate-100 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <span className={`p-1.5 rounded-lg text-white ${t.cor}`}>{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Descrição <span className="text-slate-300 normal-case font-medium">(opcional)</span></label>
              <input
                type="text"
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Ex: Aula de Física - Cinemática"
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-bold outline-none"
              />
            </div>

            {/* Disciplina */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Disciplina (Opcional)</label>
              <select
                value={form.disciplina_id}
                onChange={e => setForm(f => ({ ...f, disciplina_id: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-bold outline-none"
              >
                <option value="">Sem disciplina</option>
                {disciplinas.map(d => (
                  <option key={d.id} value={d.id}>{d.nome}</option>
                ))}
              </select>
            </div>

            {/* Horários */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Início</label>
                <input
                  type="time"
                  value={form.horario_ini}
                  onChange={e => setForm(f => ({ ...f, horario_ini: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Fim</label>
                <input
                  type="time"
                  value={form.horario_fim}
                  onChange={e => setForm(f => ({ ...f, horario_fim: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>
            </div>

            {/* Data (só ao criar) */}
            {!bloco && (
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Data</label>
                <input
                  type="date"
                  value={form.data_referencia}
                  onChange={e => setForm(f => ({ ...f, data_referencia: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-4 mt-6 bg-indigo-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
            {bloco ? "Salvar Alterações" : "Adicionar Bloco"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── TELA: SETUP DE ROTINA ─────────────────────────────────────────
function RotinaSetup({
  disciplinas,
  initialData = [],
  onSalvar,
}: {
  disciplinas: Disciplina[];
  initialData?: RotinaItem[];
  onSalvar: (itens: Omit<RotinaItem, "id" | "user_id" | "ordem">[]) => Promise<void>;
}) {
  type ItemTemp = { dia_semana: number; tipo: TipoBloco; horario_ini: string; horario_fim: string; disciplina_id: string; descricao: string };
  const [itens, setItens] = useState<ItemTemp[]>(initialData.map(d => ({
    dia_semana: d.dia_semana,
    tipo: d.tipo,
    horario_ini: d.horario_ini.slice(0, 5),
    horario_fim: d.horario_fim.slice(0, 5),
    disciplina_id: d.disciplina_id ?? "",
    descricao: d.descricao
  })));
  const [isSaving, setIsSaving] = useState(false);
  const [diaAtivo, setDiaAtivo] = useState(1);
  const [form, setForm] = useState<ItemTemp>({
    dia_semana: 1, tipo: "estudo", horario_ini: "08:00", horario_fim: "09:00", disciplina_id: "", descricao: ""
  });

  function addItem() {
    const tipoDef = TIPOS_BLOCO.find(t => t.value === form.tipo);
    const descricaoFinal = form.descricao.trim() || tipoDef?.label || form.tipo;
    const disciplinaFinal = form.disciplina_id.trim() || null;
    setItens(prev => [...prev, { 
      ...form, 
      descricao: descricaoFinal,
      disciplina_id: disciplinaFinal as any,
      dia_semana: diaAtivo 
    }]);
    setForm(f => ({ ...f, descricao: "", disciplina_id: "" }));
  }

  function removeItem(idx: number) {
    setItens(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSalvar() {
    if (itens.length === 0) { toast.error("Adicione pelo menos 1 atividade."); return; }
    setIsSaving(true);
    await onSalvar(itens);
    setIsSaving(false);
  }

  const itensDia = itens.filter(i => i.dia_semana === diaAtivo);
  const pct = Math.round((itens.length / (7 * 6)) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <div className="text-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-600/30">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Configure sua Rotina Ideal</h1>
        <p className="text-slate-400 font-medium max-w-lg mx-auto">
          Monte sua semana perfeita. Adicione as atividades do jeito que preferir — sem metas obrigatórias.
        </p>
      </div>

      {/* Progress - puramente informativo */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 border border-slate-100 dark:border-[#2C2C2E]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-black text-slate-400 uppercase">Atividades adicionadas</span>
          <span className="text-xs font-black text-indigo-500">{itens.length} {itens.length === 1 ? "atividade" : "atividades"}</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all bg-indigo-500"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          💡 Dica: um bom equilíbrio é deixar espaço livre para imprevistos — mais importante do que preencher tudo.
        </p>
      </div>

      {/* Seletor de dias */}
      <div className="grid grid-cols-7 gap-2">
        {DIAS_SEMANA.map((d, i) => {
          const count = itens.filter(it => it.dia_semana === i).length;
          return (
            <button
              key={i}
              onClick={() => { setDiaAtivo(i); setForm(f => ({ ...f, dia_semana: i })); }}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${
                diaAtivo === i
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                  : "border-slate-100 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              <span className="text-[10px] font-black text-slate-500 uppercase">{d}</span>
              {count > 0 && (
                <span className={`text-[10px] font-black px-1.5 rounded-full ${diaAtivo === i ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form de adição */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 border border-slate-100 dark:border-[#2C2C2E] space-y-4">
          <h3 className="font-black text-slate-700 dark:text-white text-sm uppercase tracking-widest">
            Adicionar em {DIAS_COMPLETO[diaAtivo]}
          </h3>

          <div className="grid grid-cols-3 gap-1.5">
            {TIPOS_BLOCO.map(t => (
              <button
                key={t.value}
                onClick={() => setForm(f => ({ ...f, tipo: t.value }))}
                className={`p-2 rounded-xl flex flex-col items-center gap-1 text-[9px] font-black uppercase transition-all border ${
                  form.tipo === t.value
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600"
                    : "border-slate-100 dark:border-slate-700 text-slate-500 hover:border-indigo-300"
                }`}
              >
                <span className={`p-1 rounded-md text-white ${t.cor}`}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={form.descricao}
            onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && addItem()}
            placeholder="Descrição opcional (ex: Física - Cinemática)"
            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-bold outline-none"
          />

          <select
            value={form.disciplina_id}
            onChange={e => setForm(f => ({ ...f, disciplina_id: e.target.value }))}
            className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none"
          >
            <option value="">Sem disciplina vinculada</option>
            {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Início</label>
              <input type="time" value={form.horario_ini} onChange={e => setForm(f => ({ ...f, horario_ini: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm font-bold outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Fim</label>
              <input type="time" value={form.horario_fim} onChange={e => setForm(f => ({ ...f, horario_fim: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm font-bold outline-none" />
            </div>
          </div>

          <button
            onClick={addItem}
            className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>

        {/* Lista do dia */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 border border-slate-100 dark:border-[#2C2C2E]">
          <h3 className="font-black text-slate-700 dark:text-white text-sm uppercase tracking-widest mb-4">
            {DIAS_COMPLETO[diaAtivo]} ({itensDia.length} atividades)
          </h3>
          {itensDia.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Coffee className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-bold">Nenhuma atividade ainda</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto custom-scrollbar max-h-60">
              {[...itensDia].sort((a, b) => a.horario_ini.localeCompare(b.horario_ini)).map((item, idx) => {
                const globalIdx = itens.indexOf(item);
                const tipoDef = TIPOS_BLOCO.find(t => t.value === item.tipo);
                return (
                  <div key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                    <span className={`p-1.5 rounded-lg text-white ${tipoDef?.cor}`}>{tipoDef?.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-white truncate">{item.descricao}</p>
                      <p className="text-[9px] text-slate-400">{item.horario_ini} – {item.horario_fim}</p>
                    </div>
                    <button onClick={() => removeItem(globalIdx)} className="text-slate-300 hover:text-rose-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 justify-end">
        <button
          onClick={handleSalvar}
          disabled={isSaving || itens.length === 0}
          className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl disabled:opacity-40 flex items-center gap-2 shadow-xl shadow-indigo-600/20"
        >
          {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Check className="w-5 h-5" />}
          Salvar Minha Rotina
        </button>
      </div>
    </div>
  );
}


// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────
export default function SemanaPage() {
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [view, setView] = useState<"semana" | "rotina">("semana");

  const [weekRef, setWeekRef] = useState(new Date());
  const semana = getSemanaAtual(weekRef);

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [rotina, setRotina] = useState<RotinaItem[]>([]);
  const [blocos, setBlocos] = useState<SemanaBloco[]>([]);

  // Modals
  const [modalConfirmar, setModalConfirmar] = useState<SemanaBloco | null>(null);
  const [modalNaoFeito, setModalNaoFeito] = useState<SemanaBloco | null>(null);
  const [modalBloco, setModalBloco] = useState<{ bloco: SemanaBloco | null; diaAlvo: string | null } | null>(null);

  // ── FETCH ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: discs }, { data: rot }] = await Promise.all([
        supabase.from("disciplinas").select("*").order("nome"),
        supabase.from("rotina_semanal").select("*, disciplinas(id,nome,cor_hex)").eq("user_id", user.id).order("horario_ini"),
      ]);

      if (discs) setDisciplinas(discs);
      if (rot) setRotina(rot as any);

      await fetchBlocos(user.id);
      setIsLoaded(true);
    })();
  }, []);

  async function fetchBlocos(uid: string) {
    const ini = semana[0].toISOString().split("T")[0];
    const fim = semana[6].toISOString().split("T")[0];
    const { data } = await supabase
      .from("semana_blocos")
      .select("*, disciplinas(id,nome,cor_hex)")
      .eq("user_id", uid)
      .gte("data_referencia", ini)
      .lte("data_referencia", fim)
      .order("horario_ini");
    if (data) setBlocos(data as any);
  }

  useEffect(() => {
    if (userId) fetchBlocos(userId);
  }, [weekRef, userId]);

  // ── Gerar semana a partir da rotina ────────────────────────────
  async function gerarSemana() {
    if (!userId || rotina.length === 0) return;
    let criados = 0;

    for (const dia of semana) {
      const diaSemana = dia.getDay();
      const dataRef = dia.toISOString().split("T")[0];
      const itensDia = rotina.filter(r => r.dia_semana === diaSemana);

      for (const item of itensDia) {
        const { data: existente } = await supabase
          .from("semana_blocos")
          .select("id")
          .eq("user_id", userId)
          .eq("data_referencia", dataRef)
          .eq("rotina_id", item.id)
          .single();

        if (!existente) {
          const { error } = await supabase.from("semana_blocos").insert({
            user_id: userId,
            rotina_id: item.id,
            data_referencia: dataRef,
            tipo: item.tipo,
            horario_ini: item.horario_ini,
            horario_fim: item.horario_fim,
            disciplina_id: item.disciplina_id,
            descricao: item.descricao,
            status: "prontidao",
          });
          if (!error) criados++;
        }
      }
    }

    if (criados > 0) {
      toast.success(`${criados} blocos gerados a partir da rotina!`);
      await fetchBlocos(userId);
    } else {
      toast.info("Semana já gerada com base na rotina.");
    }
  }


  // ── Confirmar bloco ────────────────────────────────────────────
  async function handleConfirmar(blocoId: string, dados: any) {
    if (!userId) return;

    let sessaoId: string | null = null;

    if (["estudo", "revisao", "simulado"].includes(modalConfirmar!.tipo)) {
      const { data: sessao } = await supabase.from("sessoes_estudo").insert({
        user_id: userId,
        disciplina_id: modalConfirmar!.disciplina_id,
        duracao_segundos: (dados.duracao_min ?? 0) * 60,
        tipo_estudo: dados.tipo_estudo ?? "misto",
        acertos: dados.acertos ?? 0,
        total_questoes: dados.total_questoes ?? 0,
        comentario: dados.notas ?? null,
      }).select("id").single();
      if (sessao) sessaoId = sessao.id;
    }

    const { error } = await supabase.from("semana_blocos").update({
      status: "concluido",
      notas: dados.notas ?? null,
      sessao_id: sessaoId,
      updated_at: new Date().toISOString(),
    }).eq("id", blocoId);

    if (!error) {
      setBlocos(prev => prev.map(b => b.id === blocoId ? { ...b, status: "concluido", notas: dados.notas ?? null } : b));
      toast.success("Bloco concluído! " + (sessaoId ? "Sessão registrada no Diário." : ""));
    } else {
      toast.error("Erro ao confirmar.");
    }
  }

  // ── Não feito: Abandonar ───────────────────────────────────────
  async function handleAbandonar(blocoId: string) {
    const { error } = await supabase.from("semana_blocos").update({ status: "abandonado", updated_at: new Date().toISOString() }).eq("id", blocoId);
    if (!error) {
      setBlocos(prev => prev.map(b => b.id === blocoId ? { ...b, status: "abandonado" } : b));
    }
  }

  // ── Criar Reposição ────────────────────────────────────────────
  async function handleCriarReposicao(blocoId: string) {
    const { error } = await supabase.from("semana_blocos").update({
      status: "reposicao",
      updated_at: new Date().toISOString(),
    }).eq("id", blocoId);

    if (!error) {
      setBlocos(prev => prev.map(b => b.id === blocoId ? { ...b, status: "reposicao" } : b));
      toast.success("Bloco marcado para reposição!");
    }
  }

  async function handleRemoverBloco(id: string) {
    await supabase.from("semana_blocos").delete().eq("id", id);
    setBlocos(prev => prev.filter(b => b.id !== id));
    toast.success("Bloco removido.");
  }

  // ── Limpar Semana ──────────────────────────────────────────────
  async function limparSemana() {
    if (!userId) return;
    const confirm = window.confirm("Tem certeza que deseja apagar todos os eventos desta semana?");
    if (!confirm) return;

    const ini = semana[0].toISOString().split("T")[0];
    const fim = semana[6].toISOString().split("T")[0];

    const { error } = await supabase
      .from("semana_blocos")
      .delete()
      .eq("user_id", userId)
      .gte("data_referencia", ini)
      .lte("data_referencia", fim);

    if (!error) {
      setBlocos([]);
      toast.success("Semana limpa com sucesso!");
    } else {
      toast.error("Erro ao limpar a semana.");
    }
  }

  // ── Salvar bloco (novo ou editar) ──────────────────────────────
  async function handleSalvarBloco(dados: Partial<SemanaBloco>) {
    if (!userId) return;

    if (modalBloco?.bloco) {
      // Editar
      const { error } = await supabase.from("semana_blocos")
        .update({ ...dados, status: "personalizado", updated_at: new Date().toISOString() })
        .eq("id", modalBloco.bloco.id);
      if (!error) {
        setBlocos(prev => prev.map(b => b.id === modalBloco.bloco!.id ? { ...b, ...dados, status: "personalizado" } : b));
        toast.success("Bloco atualizado!");
      }
    } else {
      // Novo
      const { data, error } = await supabase.from("semana_blocos").insert({
        user_id: userId,
        ...dados,
        status: "personalizado",
      }).select("*, disciplinas(id,nome,cor_hex)").single();
      if (!error && data) {
        setBlocos(prev => [...prev, data as any]);
        toast.success("Bloco adicionado!");
      }
    }
  }

  // ── Salvar rotina ──────────────────────────────────────────────
  async function handleSalvarRotina(itens: Omit<RotinaItem, "id" | "user_id" | "ordem">[]) {
    if (!userId) return;

    // Apaga rotina antiga e recria
    await supabase.from("rotina_semanal").delete().eq("user_id", userId);

    const inserts = itens.map((item, i) => ({
      user_id: userId,
      dia_semana: item.dia_semana,
      ordem: i,
      tipo: item.tipo,
      horario_ini: item.horario_ini || "08:00",
      horario_fim: item.horario_fim || "09:00",
      descricao: item.descricao?.trim() || TIPOS_BLOCO.find(t => t.value === item.tipo)?.label || item.tipo,
      disciplina_id: (item.disciplina_id && item.disciplina_id.trim() !== "") ? item.disciplina_id : null,
    }));
    const { data, error } = await supabase.from("rotina_semanal").insert(inserts).select("*, disciplinas(id,nome,cor_hex)");
    if (error) console.error("Erro ao salvar rotina:", error);

    if (!error && data) {
      setRotina(data as any);
      setView("semana");
      toast.success("Rotina salva com sucesso!");
      await gerarSemana();
    } else {
      const msg = (error as any)?.message || (error as any)?.details || JSON.stringify(error);
      toast.error(`Erro: ${msg}`);
    }
  }

  // ── RENDER ────────────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Mostra setup se não tem rotina
  if (rotina.length === 0 && view !== "rotina") {
    return (
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-[2rem] p-10 text-center mb-8 border border-indigo-100 dark:border-indigo-500/20">
          <Calendar className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Bem-vindo ao Planejador Semanal!</h1>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Para começar, você precisa configurar sua <strong>rotina ideal</strong>. Ela será a base de cada semana.
          </p>
          <button
            onClick={() => setView("rotina")}
            className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center gap-2 mx-auto"
          >
            <Calendar className="w-5 h-5" />
            Criar Minha Rotina
          </button>
        </div>
      </div>
    );
  }


  // ─── VIEW PRINCIPAL: SEMANA ──────────────────────────────────────
  const preenchimento = calcPreenchimento(blocos);


  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* HEADER DESIGN NOVO */}
      <header className="relative">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          {/* LADO ESQUERDO: TÍTULO */}
          <div className="flex items-center gap-5">
            <div className="bg-[#1B2B5E] p-4 rounded-[1.2rem] shadow-xl shadow-[#1B2B5E]/20">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-[#1B2B5E] dark:text-white tracking-tight">
                Semana
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="h-1 w-10 bg-[#F97316] rounded-full" />
                <p className="text-[10px] md:text-xs text-[#8E9AAF] font-black uppercase tracking-[0.2em]">
                  ASAS PARA O ENEM! PLANEJE SUA SEMANA.
                </p>
              </div>
            </div>
          </div>

          {/* CENTRO: PERÍODO (entre título e abas) */}
          <div className="flex-1 flex justify-center">
            {view === "semana" && (
              <div className="flex items-center gap-2 bg-white dark:bg-[#1C1C1E] p-1.5 rounded-2xl border border-slate-100 dark:border-[#2C2C2E] shadow-sm animate-in fade-in zoom-in duration-500">
                <button
                  onClick={() => setWeekRef(w => subWeeks(w, 1))}
                  className="p-2 rounded-xl text-slate-400 hover:text-[#1B2B5E] hover:bg-slate-50 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-4 py-1 border-x border-slate-100 dark:border-[#2C2C2E]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Período</p>
                  <p className="text-xs font-black text-[#1B2B5E] dark:text-white whitespace-nowrap">
                    {format(semana[0], "dd MMM", { locale: ptBR })} – {format(semana[6], "dd MMM", { locale: ptBR })}
                  </p>
                </div>
                <button
                  onClick={() => setWeekRef(w => addWeeks(w, 1))}
                  className="p-2 rounded-xl text-slate-400 hover:text-[#1B2B5E] hover:bg-slate-50 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* LADO DIREITO: ABAS */}
          <div className="bg-white dark:bg-[#1C1C1E] p-1.5 rounded-[2rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm flex items-center w-full md:w-auto">
            <button
              onClick={() => setView("semana")}
              className={`px-8 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${
                view === "semana"
                  ? "bg-[#1B2B5E] text-white shadow-lg shadow-[#1B2B5E]/20"
                  : "text-[#8E9AAF] hover:text-[#1B2B5E] dark:hover:text-white"
              }`}
            >
              Rotina
            </button>
            <button
              onClick={() => setView("rotina")}
              className={`px-8 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${
                view === "rotina"
                  ? "bg-[#1B2B5E] text-white shadow-lg shadow-[#1B2B5E]/20"
                  : "text-[#8E9AAF] hover:text-[#1B2B5E] dark:hover:text-white"
              }`}
            >
              Edição
            </button>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={gerarSemana}
          title="Gerar semana a partir da rotina"
          className="px-4 py-2 bg-[#1B2B5E] text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#253b7d] flex items-center gap-2 shadow-lg shadow-[#1B2B5E]/20 transition-all active:scale-95"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" /> Gerar Semana
        </button>

        <button
          onClick={limparSemana}
          className="px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
        >
          <Trash2 className="w-3.5 h-3.5" /> Limpar Tudo
        </button>
      </div>

      {/* BARRA DE PREENCHIMENTO */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 border border-slate-100 dark:border-[#2C2C2E] flex items-center gap-6 shadow-sm">
        <div className="flex-1">
          <div className="flex justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Carga Horária Semanal</span>
            <span className="text-[10px] font-black text-[#1B2B5E] dark:text-indigo-400 uppercase tracking-widest">
              {blocos.filter(b => b.status !== "abandonado").length} blocos planejados
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, preenchimento)}%` }}
              className="h-full rounded-full bg-[#1B2B5E]"
            />
          </div>
        </div>
        <div className="text-right flex-shrink-0 bg-slate-50 dark:bg-[#2C2C2E] px-5 py-3 rounded-2xl border border-slate-100 dark:border-transparent">
          <p className="text-2xl font-black text-[#1B2B5E] dark:text-white leading-none">{blocos.filter(b => b.status === "concluido").length}</p>
          <p className="text-[9px] text-[#8E9AAF] font-bold uppercase tracking-tighter mt-1">Concluídos</p>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL: SEMANA ou ROTINA */}
      {view === "rotina" ? (
        <div className="max-w-5xl mx-auto px-4 pb-20">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => setView("semana")}
              className="p-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] text-slate-500 hover:text-indigo-500 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-700 dark:text-white">Editando Rotina Semanal</h2>
          </div>
          <RotinaSetup
            disciplinas={disciplinas}
            initialData={rotina}
            onSalvar={handleSalvarRotina}
          />
        </div>
      ) : (
        <>

      <div className="flex gap-4">
        {/* GRID DE 7 DIAS */}
        <div className="flex-1 overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 min-w-[700px]">
            {semana.map((dia, i) => {
              const dataRef = dia.toISOString().split("T")[0];
              const blocosDia = blocos
                .filter(b => b.data_referencia === dataRef)
                .sort((a, b) => a.horario_ini.localeCompare(b.horario_ini));
              const hoje = isToday(dia);

              return (
                <div
                  key={i}
                  className={`flex flex-col rounded-3xl border-2 overflow-hidden transition-all ${
                    hoje
                      ? "border-indigo-300 dark:border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                      : "border-slate-100 dark:border-[#2C2C2E]"
                  } bg-white dark:bg-[#1C1C1E]`}
                >
                  {/* Header do dia */}
                  <div className={`p-3 text-center border-b ${hoje ? "bg-indigo-600" : "bg-slate-50 dark:bg-[#2C2C2E]/50"} border-slate-100 dark:border-[#2C2C2E]`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${hoje ? "text-indigo-200" : "text-slate-400"}`}>
                      {DIAS_SEMANA[dia.getDay()]}
                    </p>
                    <p className={`text-xl font-black ${hoje ? "text-white" : "text-slate-800 dark:text-white"}`}>
                      {format(dia, "dd")}
                    </p>
                  </div>

                  {/* Blocos do dia */}
                  <div className="flex-1 p-2 space-y-1.5 min-h-[200px] overflow-y-auto custom-scrollbar">
                    <AnimatePresence>
                      {blocosDia.map(bloco => (
                        <BlocoCard
                          key={bloco.id}
                          bloco={bloco}
                          disciplinas={disciplinas}
                          onConfirmar={b => setModalConfirmar(b)}
                          onNaoFeito={b => setModalNaoFeito(b)}
                          onEditar={b => setModalBloco({ bloco: b, diaAlvo: null })}
                          onRemover={handleRemoverBloco}
                        />
                      ))}
                    </AnimatePresence>

                    {blocosDia.length === 0 && (
                      <div className="flex items-center justify-center h-24 text-slate-300 dark:text-slate-700">
                        <div className="text-center">
                          <Coffee className="w-5 h-5 mx-auto mb-1" />
                          <p className="text-[9px] font-bold">Livre</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botão adicionar */}
                  <button
                    onClick={() => setModalBloco({ bloco: null, diaAlvo: dataRef })}
                    className="w-full py-2 text-slate-300 dark:text-slate-600 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all text-xs font-black flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      </>
      )}

      {/* MODAIS */}
      <AnimatePresence>
        {modalConfirmar && (
          <ModalConfirmar
            bloco={modalConfirmar}
            disciplinas={disciplinas}
            onClose={() => setModalConfirmar(null)}
            onSave={handleConfirmar}
          />
        )}
        {modalNaoFeito && (
          <ModalNaoFeito
            bloco={modalNaoFeito}
            onClose={() => setModalNaoFeito(null)}
            onAbandonar={handleAbandonar}
            onCriarReposicao={handleCriarReposicao}
          />
        )}
        {modalBloco !== null && (
          <ModalBloco
            bloco={modalBloco.bloco}
            diaAlvo={modalBloco.diaAlvo}
            disciplinas={disciplinas}
            onClose={() => setModalBloco(null)}
            onSave={handleSalvarBloco}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
