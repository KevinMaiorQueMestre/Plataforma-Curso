
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
"use client";

import { useState, useEffect, useRef } from "react";
import { useCountdown } from "@/hooks/useTimestamp";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Book, Globe2, Leaf, Calculator, PenTool, Send, Clock, Play, Pause, X, PieChart, Maximize2, Minimize2, Trash2, Loader2, ChevronDown, Pencil, Filter, Plus, CheckCircle, TrendingUp, RotateCcw, Zap } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getPreferences, updatePreferences } from "@/lib/db/preferences";
import {
  listarSimulados,
  criarSimulado,
  atualizarSimulado,
  deletarSimulado,
  desmarcarSimuladoAnalisado,
  type SimuladoDB
} from "@/lib/db/simulados";
import { criarProblemaManual, listarProblemas, deletarProblema, reabrirProblema, type ProblemaEstudo } from "@/lib/db/estudo";
import ModuleTarefasSimulado from "@/components/tarefas/ModuleTarefasSimulado";
import { MODELOS_PROVAS, getExamItemCount, getENEMConfig, getFUVESTFase1Config, getFUVESTFase2Config, type ModeloProva, type FaseProva, type CampoProva } from "@/lib/config/provas";
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

// --- CUSTOM TOOLTIPS FOR GRAPHS ---
function TooltipGeral({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-bold text-indigo-400">
          📊 {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

function TooltipD1({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const ling = payload.find((p: any) => p.dataKey === "linguagens");
  const hum = payload.find((p: any) => p.dataKey === "humanas");
  const temp = payload.find((p: any) => p.dataKey === "tempo1");
  return (
    <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md min-w-[180px]">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      {ling && <p className="text-sm font-bold text-indigo-400">📚 Linguagens: {ling.value}</p>}
      {hum && <p className="text-sm font-bold text-amber-500">🌍 Humanas: {hum.value}</p>}
      {temp && <p className="text-sm font-bold text-slate-400 border-t border-white/5 mt-2 pt-2">⏱ Tempo: {temp.value} min</p>}
    </div>
  );
}

function TooltipRedacao({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const nota = payload.find((p: any) => p.dataKey === "nota");
  const tempo = payload.find((p: any) => p.dataKey === "tempo");
  return (
    <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      {nota && <p className="text-lg font-black text-rose-500">✍️ Nota: {nota.value}</p>}
      {tempo && <p className="text-sm font-bold text-slate-400 mt-1">⏱ Tempo: {tempo.value} min</p>}
    </div>
  );
}

function TooltipD2({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const mat = payload.find((p: any) => p.dataKey === "matematica");
  const nat = payload.find((p: any) => p.dataKey === "naturezas");
  const temp = payload.find((p: any) => p.dataKey === "tempo2");
  return (
    <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md min-w-[180px]">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      {mat && <p className="text-sm font-bold text-blue-400">🧮 Matemática: {mat.value}</p>}
      {nat && <p className="text-sm font-bold text-emerald-400">🧪 Naturezas: {nat.value}</p>}
      {temp && <p className="text-sm font-bold text-slate-400 border-t border-white/5 mt-2 pt-2">⏱ Tempo: {temp.value} min</p>}
    </div>
  );
}

function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = "",
  dropdownClasses = "",
  onAddNewItem
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
  dropdownClasses?: string;
  onAddNewItem?: (val: string) => Promise<void> | void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newVal, setNewVal] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpenRef.current && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => o.value === value);

  const handleAddNew = async () => {
    if (!newVal.trim() || !onAddNewItem) return;
    await onAddNewItem(newVal.trim());
    setNewVal("");
    setIsAdding(false);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left flex justify-between items-center outline-none transition-all ${className} ${disabled ? 'opacity-50 cursor-not-allowed shadow-none' : 'cursor-pointer hover:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'}`}
      >
        <span className="truncate">{selectedOpt ? selectedOpt.label : <span className="opacity-50 font-medium">{placeholder}</span>}</span>
        <ChevronDown className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : 'text-slate-400'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`absolute z-[100] w-full mt-2 bg-white dark:bg-[#1C1C1EE6] backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden ${dropdownClasses}`}
          >
            <div className="max-h-60 overflow-y-auto p-1.5 flex flex-col gap-1 custom-scrollbar">
              {onAddNewItem && (
                isAdding ? (
                  <div className="flex gap-2 p-1 border border-indigo-200 dark:border-indigo-500/30 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/10 mb-1">
                    <input
                      autoFocus
                      value={newVal}
                      onChange={e => setNewVal(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); handleAddNew(); }
                      }}
                      placeholder="Digite e aperte Enter..."
                      className="flex-1 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-slate-700/50 rounded-lg px-2 py-2 text-sm outline-none w-full shadow-inner text-slate-700 dark:text-white"
                    />
                    <button onClick={handleAddNew} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">OK</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsAdding(true); }}
                    className="w-full text-left px-3 py-2.5 text-indigo-600 dark:text-indigo-400 font-black text-sm bg-indigo-50/50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl flex items-center gap-2 mb-1 border border-indigo-100 dark:border-transparent transition-all shadow-sm"
                  >
                    <span className="text-lg leading-none">+</span> Adicionar Outro
                  </button>
                )
              )}
              {[...options].sort((a, b) => {
                if (a.value === "") return -1;
                if (b.value === "") return 1;
                return a.label.localeCompare(b.label);
              }).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${value === opt.value ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'}`}
                >
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

function SimuladoFormFields({ form, setForm, modelo, diaSelecionado, examYear }: { form: any; setForm: any; modelo: ModeloProva; diaSelecionado?: number; examYear?: string | number }) {
  if (modelo.id === 'ENEM') {
    const config = getENEMConfig(examYear || form.anoProva);
    
    const renderNum = (id: string, label: string, max: number, cor: string) => (
      <div key={id} className="flex-1 min-w-[220px] bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-5 shadow-sm relative overflow-hidden group transition-all">
        <label className={`font-black uppercase tracking-[0.25em] text-[10px] ${cor}`}>{label}</label>
        <div className="relative flex items-end gap-3 mt-3">
          <input
            type="number" min="0" max={max}
            value={form[id] || ''}
            onChange={e => {
              const raw = parseInt(e.target.value) || 0;
              const clamped = Math.min(raw, max);
              setForm({ ...form, [id]: clamped > 0 ? String(clamped) : '' });
            }}
            className="w-full bg-white dark:bg-[#1C1C1E] font-black text-4xl px-3 py-3 rounded-2xl shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 text-center border border-transparent transition-all"
          />
          <span className="text-[10px] font-black opacity-40 absolute bottom-4 right-4">/{max}</span>
        </div>
      </div>
    );

    const renderTempo = (hKey: string, mKey: string, label: string, maxMin: number) => {
      const totalMin = (parseInt(form[hKey]) || 0) * 60 + (parseInt(form[mKey]) || 0);
      const excedeu = totalMin > maxMin && totalMin > 0;
      const maxH = Math.floor(maxMin / 60);
      const maxM = maxMin % 60;

      return (
        <div key={hKey} className={`flex-1 min-w-[220px] bg-slate-50 dark:bg-[#2C2C2E]/50 border rounded-[2rem] p-6 shadow-sm transition-all ${excedeu ? 'border-amber-300 dark:border-amber-500/30 ring-4 ring-amber-500/5' : 'border-slate-100 dark:border-white/5'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${excedeu ? 'text-amber-500' : 'text-slate-400'}`} />
              <label className={`text-[10px] font-black uppercase tracking-[0.25em] ${excedeu ? 'text-amber-500' : 'text-slate-400'}`}>{label}</label>
            </div>
            {excedeu && (
              <span className="text-[9px] font-black bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 animate-pulse">
                ⚠️ Acima de {maxH}h{maxM > 0 ? `${maxM}m` : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5">
              <input type="number" min="0" placeholder="0" value={form[hKey] || ''} onChange={e => setForm({ ...form, [hKey]: e.target.value })} className="w-full bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none" />
              <p className="text-[8px] text-slate-400 text-center uppercase font-bold tracking-widest">Horas</p>
            </div>
            <span className="text-xl font-black text-slate-300 dark:text-slate-700">:</span>
            <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5">
              <input type="number" min="0" max="59" placeholder="00" value={form[mKey] || ''} onChange={e => setForm({ ...form, [mKey]: e.target.value })} className="w-full bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none" />
              <p className="text-[8px] text-slate-400 text-center uppercase font-bold tracking-widest">Mins</p>
            </div>
          </div>
        </div>
      );
    };

    const eraBadges = {
      classica: { label: 'Era Clássica (1998–2008) · 63 Questões · Dia Único', color: 'text-slate-500 bg-slate-100 dark:bg-[#2C2C2E]' },
      transitoria: { label: 'Era Transitória (2009–2016) · Humanas/Natureza no Dia 1', color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
      moderna: { label: 'Era Moderna (2017+) · Linguagens/Humanas no Dia 1', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' }
    };
    const currentEra = eraBadges[config.era];

    return (
      <div className="space-y-6">
        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest inline-block ${currentEra.color}`}>
          {currentEra.label}
        </div>

        {/* Dia 1 */}
        {(!diaSelecionado || diaSelecionado === 1) && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 md:gap-6 w-full">
              {config.dia1.areas.map(area => renderNum(area.id, area.label, area.max, area.cor))}
              {renderTempo("tempo1H", "tempo1M", config.diasCount === 1 ? "Tempo de Prova" : "Tempo 1º Dia", config.dia1.duracao)}
            </div>

            {config.dia1.temRedacao && (
              <div className="flex flex-wrap gap-4 md:gap-6 w-full">
                <div className="flex-1 min-w-[220px] bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-100 dark:border-rose-500/20 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between group">
                  <div>
                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.25em]">Módulo Redação</label>
                    <p className="text-[8px] text-rose-400 font-black tracking-widest mt-0.5">NOTA FINAL (MAX 1000)</p>
                  </div>
                  <input
                    type="number" step="20" min="0" max="1000"
                    value={form.redacao || ''}
                    onChange={e => {
                      const v = Math.min(1000, Math.max(0, parseInt(e.target.value) || 0));
                      setForm({ ...form, redacao: v > 0 ? String(v) : '' });
                    }}
                    className="w-full bg-white dark:bg-[#1C1C1E] text-rose-600 dark:text-rose-400 font-black text-4xl px-4 py-4 rounded-2xl shadow-inner mt-4 focus:outline-none text-center"
                    placeholder="0"
                  />
                </div>
                {renderTempo("tempoRedH", "tempoRedM", "Tempo Redação", 90)} {/* Redação estimada em 1h30 se separada */}
              </div>
            )}
          </div>
        )}

        {/* Dia 2 */}
        {config.dia2 && (!diaSelecionado || diaSelecionado === 2) && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 md:gap-6 w-full">
              {config.dia2.areas.map(area => renderNum(area.id, area.label, area.max, area.cor))}
              {renderTempo("tempo2H", "tempo2M", "Tempo 2º Dia", config.dia2.duracao)}
            </div>

            {config.dia2.temRedacao && (
              <div className="flex flex-wrap gap-4 md:gap-6 w-full">
                <div className="flex-1 min-w-[220px] bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-100 dark:border-rose-500/20 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between group">
                  <div>
                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.25em]">Módulo Redação</label>
                    <p className="text-[8px] text-rose-400 font-black tracking-widest mt-0.5">NOTA FINAL (MAX 1000)</p>
                  </div>
                  <input
                    type="number" step="20" min="0" max="1000"
                    value={form.redacao || ''}
                    onChange={e => {
                      const v = Math.min(1000, Math.max(0, parseInt(e.target.value) || 0));
                      setForm({ ...form, redacao: v > 0 ? String(v) : '' });
                    }}
                    className="w-full bg-white dark:bg-[#1C1C1E] text-rose-600 dark:text-rose-400 font-black text-4xl px-4 py-4 rounded-2xl shadow-inner mt-4 focus:outline-none text-center"
                    placeholder="0"
                  />
                </div>
                {renderTempo("tempoRedH", "tempoRedM", "Tempo Redação", 90)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (modelo.id === 'FUVEST_1') {
    const cfg = getFUVESTFase1Config(examYear || form.anoProva);
    const eraBadge = cfg.era === 'moderna'
      ? { label: 'Era Moderna (2027+) · 80 Questões', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' }
      : { label: 'Formato Clássico (≤2026) · 90 Questões', color: 'text-slate-500 bg-slate-100 dark:bg-[#2C2C2E]' };

    const renderTempo = (hKey: string, mKey: string, label: string, maxMin: number) => {
      const totalMin = (parseInt(form[hKey]) || 0) * 60 + (parseInt(form[mKey]) || 0);
      const excedeu = totalMin > maxMin && totalMin > 0;
      const maxH = Math.floor(maxMin / 60);
      const maxM = maxMin % 60;

      return (
        <div key={hKey} className={`flex-1 min-w-[220px] bg-slate-50 dark:bg-[#2C2C2E]/50 border rounded-[2rem] p-6 shadow-sm transition-all ${excedeu ? 'border-amber-300 dark:border-amber-500/30 ring-4 ring-amber-500/5' : 'border-slate-100 dark:border-white/5'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${excedeu ? 'text-amber-500' : 'text-slate-400'}`} />
              <label className={`text-[10px] font-black uppercase tracking-[0.25em] ${excedeu ? 'text-amber-500' : 'text-slate-400'}`}>{label}</label>
            </div>
            {excedeu && (
              <span className="text-[9px] font-black bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 animate-pulse">
                ⚠️ Acima de {maxH}h{maxM > 0 ? `${maxM}m` : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5">
              <input type="number" min="0" placeholder="0" value={form[hKey] || ''} onChange={e => setForm({ ...form, [hKey]: e.target.value })} className="w-full bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none" />
              <p className="text-[8px] text-slate-400 text-center uppercase font-bold tracking-widest">Horas</p>
            </div>
            <span className="text-xl font-black text-slate-300 dark:text-slate-700">:</span>
            <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5">
              <input type="number" min="0" max="59" placeholder="00" value={form[mKey] || ''} onChange={e => setForm({ ...form, [mKey]: e.target.value })} className="w-full bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none" />
              <p className="text-[8px] text-slate-400 text-center uppercase font-bold tracking-widest">Mins</p>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest inline-block ${eraBadge.color}`}>
          {eraBadge.label}
        </div>

        <div className="flex flex-wrap gap-4 md:gap-6 w-full">
          <div className="flex-1 min-w-[220px] bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-5 shadow-sm relative overflow-hidden group transition-all">
            <label className={`font-black uppercase tracking-[0.25em] text-[10px] text-indigo-500`}>Questões Objetivas</label>
            <div className="relative flex items-end gap-3 mt-3">
              <input
                type="number" min="0" max={cfg.max}
                value={form.conhecimentos_gerais || ''}
                onChange={e => {
                  const raw = parseInt(e.target.value) || 0;
                  const clamped = Math.min(raw, cfg.max);
                  setForm({ ...form, conhecimentos_gerais: clamped > 0 ? String(clamped) : '' });
                }}
                className="w-full bg-white dark:bg-[#1C1C1E] font-black text-4xl px-3 py-3 rounded-2xl shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 text-center border border-transparent transition-all"
              />
              <span className="text-[10px] font-black opacity-40 absolute bottom-4 right-4">/{cfg.max}</span>
            </div>
          </div>
          {renderTempo("tempo1H", "tempo1M", "Tempo de Prova", cfg.duracao)}
        </div>
      </div>
    );
  }

  if (modelo.id === 'FUVEST_2') {
    const cfg = getFUVESTFase2Config(examYear || form.anoProva);
    const eraBadge = cfg.era === 'trifasica'
      ? { label: 'Formato Trifásico (≤2018) · 3 Dias', color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' }
      : { label: 'Formato Atual (2019+) · 2 Dias', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' };

    const renderTempo = (hKey: string, mKey: string, label: string, maxMin: number) => {
      const totalMin = (parseInt(form[hKey]) || 0) * 60 + (parseInt(form[mKey]) || 0);
      const excedeu = totalMin > maxMin && totalMin > 0;
      const maxH = Math.floor(maxMin / 60);
      const maxM = maxMin % 60;

      return (
        <div key={hKey} className={`flex-1 min-w-[220px] bg-slate-50 dark:bg-[#2C2C2E]/50 border rounded-[2rem] p-6 shadow-sm transition-all ${excedeu ? 'border-amber-300 dark:border-amber-500/30 ring-4 ring-amber-500/5' : 'border-slate-100 dark:border-white/5'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${excedeu ? 'text-amber-500' : 'text-slate-400'}`} />
              <label className={`text-[10px] font-black uppercase tracking-[0.25em] ${excedeu ? 'text-amber-500' : 'text-slate-400'}`}>{label}</label>
            </div>
            {excedeu && (
              <span className="text-[9px] font-black bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 animate-pulse">
                ⚠️ Acima de {maxH}h{maxM > 0 ? `${maxM}m` : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5">
              <input type="number" min="0" placeholder="0" value={form[hKey] || ''} onChange={e => setForm({ ...form, [hKey]: e.target.value })} className="w-full bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none" />
              <p className="text-[8px] text-slate-400 text-center uppercase font-bold tracking-widest">Horas</p>
            </div>
            <span className="text-xl font-black text-slate-300 dark:text-slate-700">:</span>
            <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5">
              <input type="number" min="0" max="59" placeholder="00" value={form[mKey] || ''} onChange={e => setForm({ ...form, [mKey]: e.target.value })} className="w-full bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none" />
              <p className="text-[8px] text-slate-400 text-center uppercase font-bold tracking-widest">Mins</p>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest inline-block ${eraBadge.color}`}>
          {eraBadge.label}
        </div>

        {cfg.dias.map(dia => (
          (!diaSelecionado || diaSelecionado === dia.numero) && (
            <div key={dia.numero} className="bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{dia.label}</label>
                  <p className="text-xs font-bold text-slate-500 mt-1">{dia.detalhes}</p>
                </div>
                {dia.maxQuestoes > 0 && (
                  <span className="text-[10px] font-black bg-white dark:bg-[#1C1C1E] px-3 py-1 rounded-full border border-slate-100 dark:border-white/5 text-slate-400">
                    {dia.maxQuestoes} Questões
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4">
                {renderTempo(`tempo${dia.numero}H`, `tempo${dia.numero}M`, `Tempo ${dia.numero}º Dia`, dia.duracao)}
                {dia.temRedacao && (
                  <div className="flex-1 min-w-[220px] bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-100 dark:border-rose-500/20 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.25em]">Redação</label>
                    <input
                      type="number" step="0.5" min="0" max="50"
                      value={form.redacao || ''}
                      onChange={e => setForm({ ...form, redacao: e.target.value })}
                      className="w-full bg-white dark:bg-[#1C1C1E] text-rose-600 dark:text-rose-400 font-black text-3xl px-4 py-3 rounded-2xl shadow-inner mt-4 focus:outline-none text-center"
                      placeholder="0.0"
                    />
                  </div>
                )}
              </div>
            </div>
          )
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {modelo.fases.map((fase, i) => (
        <div key={i} className="space-y-6 relative">
          {modelo.fases.length > 1 && (
             <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/5"></div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{fase.nome}</h4>
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/5"></div>
             </div>
          )}

          <div className="flex flex-wrap gap-4 md:gap-6">
            {fase.campos.map(campo => {
              if (diaSelecionado && campo.dia && campo.dia !== diaSelecionado) return null;

              const anoParaCalculo = examYear ?? form.anoProva;
              let dynamicMax = campo.max;
              if (modelo.id === 'UNB') {
                 dynamicMax = getExamItemCount(anoParaCalculo, campo.dia || 1);
              }

              if (campo.tipo === 'numerico') {
                return (
                  <div key={campo.id} className="flex-1 min-w-[220px] bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-5 shadow-sm relative overflow-hidden group transition-all">
                    <label className={`font-black uppercase tracking-[0.25em] text-[10px] ${campo.cor}`}>{campo.label}</label>
                    <div className="relative flex items-end gap-3 mt-3">
                      <input
                        type="number" min="0" max={dynamicMax}
                        value={form[campo.id] || ''}
                        onChange={e => {
                          const raw = parseInt(e.target.value) || 0;
                          const clamped = Math.min(raw, dynamicMax);
                          setForm({ ...form, [campo.id]: clamped > 0 ? String(clamped) : '' });
                        }}
                        className="w-full bg-white dark:bg-[#1C1C1E] font-black text-4xl px-3 py-3 rounded-2xl shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 text-center border border-transparent transition-all"
                      />
                      <span className="text-[10px] font-black opacity-40 absolute bottom-4 right-4">/{dynamicMax}</span>
                    </div>
                  </div>
                );
              }
              if (campo.tipo === 'certo_errado') {
                const cId = `${campo.id}_c`;
                const eId = `${campo.id}_e`;
                const bId = `${campo.id}_b`;
                const handleCEB = (key: string, raw: string) => {
                  const val = Math.max(0, parseInt(raw) || 0);
                  const certos  = key === cId ? val : (parseInt(form[cId]) || 0);
                  const errados = key === eId ? val : (parseInt(form[eId]) || 0);
                  const branco  = key === bId ? val : (parseInt(form[bId]) || 0);
                  const soma = certos + errados + branco;
                  // Se a soma ultrapassa o max, trava o campo que está sendo editado
                  const clamped = soma > dynamicMax ? Math.max(0, val - (soma - dynamicMax)) : val;
                  setForm({ ...form, [key]: String(clamped) });
                };
                const certos  = parseInt(form[cId]) || 0;
                const errados = parseInt(form[eId]) || 0;
                const branco  = parseInt(form[bId]) || 0;
                const soma = certos + errados + branco;
                const somaOk = soma <= dynamicMax;
                return (
                  <div key={campo.id} className="flex-[2] min-w-[320px] bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-5 shadow-sm relative overflow-hidden transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <label className={`font-black uppercase tracking-[0.25em] text-[10px] ${campo.cor}`}>{campo.label}</label>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${somaOk ? 'text-slate-400' : 'text-rose-500 bg-rose-50 dark:bg-rose-500/10'}`}>
                        {soma}/{dynamicMax}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5 flex flex-col justify-center items-center">
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Certo</span>
                        <input
                          type="number" min="0" max={dynamicMax} placeholder="0"
                          value={form[cId] || ''}
                          onChange={e => handleCEB(cId, e.target.value)}
                          className="w-full bg-transparent font-black text-3xl text-center outline-none text-emerald-600 dark:text-emerald-400"
                        />
                      </div>
                      <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5 flex flex-col justify-center items-center">
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Errado</span>
                        <input
                          type="number" min="0" max={dynamicMax} placeholder="0"
                          value={form[eId] || ''}
                          onChange={e => handleCEB(eId, e.target.value)}
                          className="w-full bg-transparent font-black text-3xl text-center outline-none text-rose-600 dark:text-rose-400"
                        />
                      </div>
                      <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5 flex flex-col justify-center items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Branco</span>
                        <input
                          type="number" min="0" max={dynamicMax} placeholder="0"
                          value={form[bId] || ''}
                          onChange={e => handleCEB(bId, e.target.value)}
                          className="w-full bg-transparent font-black text-3xl text-center outline-none text-slate-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              }
              if (campo.tipo === 'informativo') {
                return (
                  <div key={campo.id} className="flex-[2] min-w-[320px] bg-indigo-50/50 dark:bg-[#2C2C2E]/50 border border-indigo-100/50 dark:border-white/5 rounded-[2rem] p-6 shadow-sm relative overflow-hidden transition-all flex flex-col justify-center items-start">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                       <label className={`font-black uppercase tracking-[0.25em] text-[10px] ${campo.cor}`}>{campo.label}</label>
                    </div>
                    <p className="text-xs text-slate-500 font-bold leading-relaxed">{campo.detalhes}</p>
                  </div>
                );
              }
              return null;
            })}

            {fase.temRedacao && (!diaSelecionado || !fase.diaRedacao || fase.diaRedacao === diaSelecionado) && (
              <div className="flex-1 min-w-[220px] bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-100 dark:border-rose-500/20 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between group">
                <div>
                   <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.25em]">Módulo Redação</label>
                   <p className="text-[8px] text-rose-400 font-black tracking-widest mt-0.5">NOTA FINAL (MAX 1000)</p>
                </div>
                <input
                  type="number" step="20" min="0" max="1000"
                  value={form.redacao || ''}
                  onChange={e => setForm({ ...form, redacao: e.target.value })}
                  className="w-full bg-white dark:bg-[#1C1C1E] text-rose-600 dark:text-rose-400 font-black text-4xl px-4 py-4 rounded-2xl shadow-inner mt-4 focus:outline-none text-center"
                  placeholder="0"
                />
              </div>
            )}
            
            {fase.dias > 0 && Array.from({ length: fase.dias }).map((_, d) => {
              const currentDay = d + 1;
              if (diaSelecionado && currentDay !== diaSelecionado) return null;
              
              const hKey = `tempo${fase.dias > 1 ? currentDay : 1}H`;
              const mKey = `tempo${fase.dias > 1 ? currentDay : 1}M`;
              return (
                <div key={d} className="flex-1 min-w-[220px] bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.25em]">
                      {fase.dias > 1 ? `Tempo ${d + 1}º Dia` : 'Tempo da Prova'}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5">
                      <input type="number" min="0" placeholder="0" value={form[hKey] || ''} onChange={e => setForm({ ...form, [hKey]: e.target.value })} className="w-full bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none" />
                      <p className="text-[8px] text-slate-400 text-center uppercase font-bold tracking-widest">Horas</p>
                    </div>
                    <span className="text-xl font-black text-slate-300 dark:text-slate-700">:</span>
                    <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5">
                      <input type="number" min="0" max="59" placeholder="00" value={form[mKey] || ''} onChange={e => setForm({ ...form, [mKey]: e.target.value })} className="w-full bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none" />
                      <p className="text-[8px] text-slate-400 text-center uppercase font-bold tracking-widest">Mins</p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {fase.temRedacao && (
               <div className="flex-1 min-w-[220px] bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-rose-400" />
                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.25em]">Tempo Redação</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5">
                      <input type="number" min="0" placeholder="0" value={form.tempoRedH || ''} onChange={e => setForm({ ...form, tempoRedH: e.target.value })} className="w-full bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none" />
                      <p className="text-[8px] text-slate-400 text-center uppercase font-bold tracking-widest">Horas</p>
                    </div>
                    <span className="text-xl font-black text-slate-300 dark:text-slate-700">:</span>
                    <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5">
                      <input type="number" min="0" max="59" placeholder="00" value={form.tempoRedM || ''} onChange={e => setForm({ ...form, tempoRedM: e.target.value })} className="w-full bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none" />
                      <p className="text-[8px] text-slate-400 text-center uppercase font-bold tracking-widest">Mins</p>
                    </div>
                  </div>
               </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EditSimuladoModal({
  sim,
  cfgProvas,
  cfgAplicacoes,
  cfgCores,
  onClose,
  onSave,
}: {
  sim: SimuladoDB;
  cfgProvas: string[];
  cfgAplicacoes: string[];
  cfgCores: string[];
  onClose: () => void;
  onSave: (updated: SimuladoDB) => void;
}) {
  const parseTituloFull = (titulo: string) => {
    const cleanT = titulo.replace('Simulado: ', '');
    const parts = cleanT.split(' ');
    const prova = parts[0] || '';
    const ano = parts[1] || '';

    const aplicacaoMatch = cleanT.match(/- ([^(]+)/);
    const aplicacao = aplicacaoMatch ? aplicacaoMatch[1].split(' - Cor')[0].trim() : '';

    const diaMatch = cleanT.match(/\(([^)]+)\)/);
    const dia = diaMatch ? diaMatch[1] : '';

    const corMatch = cleanT.match(/- Cor (.+)/);
    const cor = corMatch ? corMatch[1] : '';

    return { prova, ano, aplicacao, dia, cor };
  };

  const parsed = parseTituloFull(sim.titulo_simulado);

  const initialForm: any = {
     nomeProva: parsed.prova || sim.titulo_simulado.split(' ')[0],
     anoProva: parsed.ano || (sim.titulo_simulado.split(' ').length > 1 ? sim.titulo_simulado.split(' ')[1] : ''),
     aplicacao: parsed.aplicacao,
     dia: parsed.dia,
     cor: parsed.cor,
     modeloProva: sim.modelo_prova || 'ENEM',
     tempo1H: String(Math.floor((sim.tempo1_min || 0) / 60)),
     tempo1M: String((sim.tempo1_min || 0) % 60),
     tempo2H: String(Math.floor((sim.tempo2_min || 0) / 60)),
     tempo2M: String((sim.tempo2_min || 0) % 60),
     tempoRedH: String(Math.floor((sim.tempo_red_min || 0) / 60)),
     tempoRedM: String((sim.tempo_red_min || 0) % 60),
     redacao: sim.redacao ? String(sim.redacao) : '',
  };

  if (sim.dados_modelo) {
     Object.keys(sim.dados_modelo).forEach(k => {
         const val = (sim.dados_modelo as any)[k];
         if (typeof val === 'object' && val !== null) {
            initialForm[`${k}_c`] = (val as any).certos;
            initialForm[`${k}_e`] = (val as any).errados;
            initialForm[`${k}_b`] = (val as any).branco;
         } else {
            initialForm[k] = val ? String(val) : '';
         }
     });
  } else {
     initialForm.linguagens = sim.linguagens > 0 ? String(sim.linguagens) : '';
     initialForm.humanas = sim.humanas > 0 ? String(sim.humanas) : '';
     initialForm.naturezas = sim.naturezas > 0 ? String(sim.naturezas) : '';
     initialForm.matematica = sim.matematica > 0 ? String(sim.matematica) : '';
  }

  const [editForm, setEditForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [localAplicacoes, setLocalAplicacoes] = useState(cfgAplicacoes);
  const [localCores, setLocalCores] = useState(cfgCores);

  const modeloSelecionado = MODELOS_PROVAS.find(m => m.id === editForm.modeloProva) || MODELOS_PROVAS[0];

  const handleSave = async () => {
    if (!editForm.nomeProva) { toast.error('Preencha o nome da prova!'); return; }
    
    let acertos = 0;
    let totalQuestoes = 0;
    let nLing = 0, nHum = 0, nNat = 0, nMat = 0, nRed = parseInt(editForm.redacao) || 0;
    const novosDados: any = {};

    let diaNumEdit: number | undefined = undefined;
    if (editForm.dia) {
       if (editForm.dia.includes('Dia 1') || editForm.dia === '1') diaNumEdit = 1;
       else if (editForm.dia.includes('Dia 2') || editForm.dia === '2') diaNumEdit = 2;
    }

    if (modeloSelecionado.id === 'ENEM') {
      const cfg = getENEMConfig(editForm.anoProva);
      const areasFiltradas = [];
      if (!diaNumEdit || diaNumEdit === 1) areasFiltradas.push(...cfg.dia1.areas);
      if (cfg.dia2 && (!diaNumEdit || diaNumEdit === 2)) areasFiltradas.push(...cfg.dia2.areas);

      areasFiltradas.forEach(area => {
        const v = parseInt(editForm[area.id]) || 0;
        novosDados[area.id] = v;
        acertos += v;
        totalQuestoes += area.max;
        if (area.id === 'linguagens') nLing = v;
        if (area.id === 'humanas') nHum = v;
        if (area.id === 'naturezas') nNat = v;
        if (area.id === 'matematica') nMat = v;
      });
    } else {
      modeloSelecionado.fases.forEach(f => {
         f.campos.forEach(c => {
            if (diaNumEdit && c.dia && c.dia !== diaNumEdit) return;

            let dynamicMax = c.max;
            if (modeloSelecionado.id === 'UNB') {
               dynamicMax = getExamItemCount(editForm.anoProva, c.dia || 1);
            } else if (modeloSelecionado.id === 'FUVEST_1') {
               const cfg = getFUVESTFase1Config(editForm.anoProva);
               dynamicMax = cfg.max;
            }

            if (c.tipo === 'numerico') {
               const v = parseInt(editForm[c.id]) || 0;
               novosDados[c.id] = v;
               acertos += v;
               totalQuestoes += dynamicMax;
             } else if (c.tipo === 'certo_errado') {
               const certos = parseInt(editForm[`${c.id}_c`]) || 0;
               const errados = parseInt(editForm[`${c.id}_e`]) || 0;
               const branco = parseInt(editForm[`${c.id}_b`]) || 0;
               novosDados[c.id] = { certos, errados, branco };
               totalQuestoes += dynamicMax;
               acertos += Math.max(0, certos - errados);
            }
         });
      });
    }

    // ── Validação de limites ──────────────────────────────────
    const errosEdit: string[] = [];
    if (modeloSelecionado.id === 'ENEM') {
      const cfg = getENEMConfig(editForm.anoProva);
      const areasValidar = [];
      if (!diaNumEdit || diaNumEdit === 1) areasValidar.push(...cfg.dia1.areas);
      if (cfg.dia2 && (!diaNumEdit || diaNumEdit === 2)) areasValidar.push(...cfg.dia2.areas);

      areasValidar.forEach(area => {
        const val = parseInt(editForm[area.id]) || 0;
        if (val > area.max) {
          errosEdit.push(`${area.label}: ${val} excede o máximo de ${area.max} questões.`);
        }
      });
    } else {
      modeloSelecionado.fases.forEach(f => {
         f.campos.forEach(c => {
            if (diaNumEdit && c.dia && c.dia !== diaNumEdit) return;
            let dMax = c.max;
            if (modeloSelecionado.id === 'UNB') {
               dMax = getExamItemCount(editForm.anoProva, c.dia || 1);
            } else if (modeloSelecionado.id === 'FUVEST_1') {
               const cfg = getFUVESTFase1Config(editForm.anoProva);
               dMax = cfg.max;
            }
            if (c.tipo === 'numerico') {
               const v = parseInt(editForm[c.id]) || 0;
               if (v > dMax) errosEdit.push(`${c.label}: ${v} excede o máximo de ${dMax} questões.`);
            } else if (c.tipo === 'certo_errado') {
               const soma = (parseInt(editForm[`${c.id}_c`]) || 0) + (parseInt(editForm[`${c.id}_e`]) || 0) + (parseInt(editForm[`${c.id}_b`]) || 0);
               if (soma > dMax) errosEdit.push(`${c.label}: ${soma} itens excedem o máximo de ${dMax}.`);
            }
         });
      });
    }
    if (errosEdit.length > 0) {
       errosEdit.forEach(msg => toast.error(msg));
       return;
    }
    // ─────────────────────────────────────────────────────────

    const t1 = (parseInt(editForm.tempo1H) || 0) * 60 + (parseInt(editForm.tempo1M) || 0);
    const t2 = (parseInt(editForm.tempo2H) || 0) * 60 + (parseInt(editForm.tempo2M) || 0);
    const tRed = (parseInt(editForm.tempoRedH) || 0) * 60 + (parseInt(editForm.tempoRedM) || 0);
    
    const tituloCompleto = `${editForm.nomeProva} ${editForm.anoProva} ${editForm.aplicacao ? `- ${editForm.aplicacao}` : ''} ${editForm.dia ? `(${editForm.dia})` : ''} ${editForm.cor ? `- Cor ${editForm.cor}` : ''}`.trim();
    
    setIsSaving(true);
    try {
      const updated = await atualizarSimulado({
        id: sim.id,
        tituloSimulado: tituloCompleto,
        modeloProva: editForm.modeloProva,
        dadosModelo: novosDados,
        totalQuestoes,
        acertos,
        examYear: parseInt(editForm.anoProva) || undefined,
        examDay: diaNumEdit,
        linguagens: nLing, humanas: nHum, naturezas: nNat, matematica: nMat, redacao: nRed,
        tempo1Min: t1, tempo2Min: t2, tempoRedMin: tRed,
      });
      if (updated) {
        onSave(updated);
        toast.success('Simulado atualizado com sucesso! ✏️');
        onClose();
      } else {
        toast.error('Erro ao atualizar.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white dark:bg-[#1C1C1E] rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-[#2C2C2E] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative"
      >
        <div className="p-5 md:p-8 flex-1 overflow-y-auto custom-scrollbar w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <Pencil className="w-6 h-6 text-indigo-500" />
              Editar Simulado
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Atualize os dados do seu desempenho</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.25em]">Modelo da Prova</label>
              <CustomDropdown
                  value={editForm.modeloProva}
                  onChange={v => setEditForm({ ...editForm, modeloProva: v })}
                  options={cfgProvas.length > 0 ? cfgProvas.map(p => { const m = MODELOS_PROVAS.find(model => model.id === p); return { value: p, label: m ? m.nome : p }; }) : MODELOS_PROVAS.map(m => ({ value: m.id, label: m.nome }))}
                  placeholder="Modelo..."
                  className="h-12 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-4 text-sm font-bold text-slate-700 dark:text-white"
                />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.25em]">Nome da Prova</label>
              <input 
                type="text" 
                value={editForm.nomeProva} 
                onChange={e => setEditForm({ ...editForm, nomeProva: e.target.value })}
                placeholder="Ex: Simulado Poliedro"
                className="w-full h-12 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-4 text-sm font-bold text-slate-700 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.25em]">Ano</label>
              <input 
                type="number" 
                value={editForm.anoProva} 
                onChange={e => setEditForm({ ...editForm, anoProva: e.target.value })}
                placeholder="Ex: 2024"
                className="w-full h-12 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-4 text-sm font-bold text-slate-700 dark:text-white outline-none"
              />
            </div>
          </div>

          {(() => {
            const isUNB = editForm.modeloProva === 'UNB';
            const anoInt = parseInt(editForm.anoProva) || 0;
            const isOldUNB = isUNB && anoInt <= 2013 && anoInt > 0;
            const showAplicacao = !(isUNB && !isOldUNB);
            const showDia = modeloSelecionado.fases.some(f => f.dias > 1);
            let cols = 1; // Cor
            if (showAplicacao) cols++;
            if (showDia) cols++;

            return (
              <div className={`grid grid-cols-1 gap-4 ${cols === 3 ? 'md:grid-cols-3' : cols === 2 ? 'md:grid-cols-2' : ''}`}>
                {showAplicacao && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.25em]">Aplicação</label>
                    {isOldUNB ? (
                      <CustomDropdown
                        value={editForm.aplicacao}
                        onChange={v => setEditForm({ ...editForm, aplicacao: v })}
                        options={[{ value: "1º Semestre", label: "1º Semestre" }, { value: "2º Semestre", label: "2º Semestre" }]}
                        placeholder="Semestre"
                        className="h-12 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-4 text-sm font-bold text-slate-700 dark:text-white"
                      />
                    ) : (
                      <CustomDropdown
                        value={editForm.aplicacao}
                        onChange={v => setEditForm({ ...editForm, aplicacao: v })}
                        options={localAplicacoes.map(a => ({ value: a, label: a }))}
                        placeholder="Regular, PPL..."
                        onAddNewItem={async (v) => {
                          const newAps = [...localAplicacoes, v];
                          setLocalAplicacoes(newAps);
                          await updatePreferences({ aplicacoes: newAps });
                          setEditForm({ ...editForm, aplicacao: v });
                        }}
                        className="h-12 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-4 text-sm font-bold text-slate-700 dark:text-white"
                      />
                    )}
                  </div>
                )}
                {showDia && (
                  <div className="animate-in fade-in zoom-in-95">
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.25em]">Dia</label>
                    <CustomDropdown
                      value={editForm.dia}
                      onChange={(val) => setEditForm({...editForm, dia: val})}
                      options={(() => {
                        if (editForm.modeloProva === 'FUVEST_2') {
                          const cfg = getFUVESTFase2Config(editForm.anoProva);
                          const opts = cfg.dias.map(d => ({ value: `Dia ${d.numero}`, label: d.label }));
                          opts.push({ value: "Completo", label: "Completo / Único" });
                          return opts;
                        }
                        return [
                          { value: "Dia 1", label: "Dia 1" },
                          { value: "Dia 2", label: "Dia 2" },
                          { value: "Completo", label: "Completo / Único" },
                        ];
                      })()}
                      placeholder="Selecione..."
                      className="h-12 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-4 text-sm font-bold text-slate-700 dark:text-white"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.25em]">Cor</label>
                  <CustomDropdown
                    value={editForm.cor}
                    onChange={v => setEditForm({ ...editForm, cor: v })}
                    options={localCores.map(c => ({ value: c, label: c }))}
                    placeholder="Azul, Amarela..."
                    onAddNewItem={async (v) => {
                      const newCores = [...localCores, v];
                      setLocalCores(newCores);
                      await updatePreferences({ cores: newCores });
                      setEditForm({ ...editForm, cor: v });
                    }}
                    className="h-12 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-4 text-sm font-bold text-slate-700 dark:text-white"
                  />
                </div>
              </div>
            );
          })()}
        </div>

        <SimuladoFormFields form={editForm} setForm={setEditForm} modelo={modeloSelecionado} examYear={editForm.anoProva} />

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 h-12 bg-slate-100 dark:bg-[#2C2C2E] text-slate-600 dark:text-slate-400 font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
            {isSaving ? 'Salvando...' : 'Salvar Edição'}
          </button>
        </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SimuladosPage() {
  const [simulados, setSimulados] = useState<SimuladoDB[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [editingSimulado, setEditingSimulado] = useState<SimuladoDB | null>(null);
  const [activeTab, setActiveTab] = useState<"tarefas" | "lancamento" | "metricas">(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('simulados_activeTab');
      if (saved === 'metricas') return 'metricas';
      if (saved === 'lancamento') return 'lancamento';
    }
    return 'tarefas';
  });

  const [cfgProvas, setCfgProvas] = useState<string[]>([]);
  const [cfgAplicacoes, setCfgAplicacoes] = useState<string[]>([]);
  const [cfgCores, setCfgCores] = useState<string[]>([]);

  // ONE GLOBAL MODEL FOR EVERYTHING
  const [globalModeloProva, setGlobalModeloProva] = useState("ENEM");

  // Tasks Modal Logic
  const [isModalNovoOpen, setIsModalNovoOpen] = useState(false);
  const [isSavingTarefa, setIsSavingTarefa] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [formNovoTarefa, setFormNovoTarefa] = useState({ prova: '', ano: '', aplicacao: '', dia: '', cor: '', agendado_para: '', prioridade: 0 });

  // Simulados concluídos (da sub-aba tarefas) para uso no Lançamento
  const [simuladosConcluidos, setSimuladosConcluidos] = useState<ProblemaEstudo[]>([]);
  const [selectedTarefaSimulado, setSelectedTarefaSimulado] = useState<ProblemaEstudo | null>(null);

  const handleNovoTarefaSimulado = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await createClient().auth.getUser();
    if (!user || !formNovoTarefa.prova.trim() || !formNovoTarefa.ano.trim()) {
      toast.error("Prova e Ano são obrigatórios!");
      return;
    }
    setIsSavingTarefa(true);
    
    const titulo = `Simulado: ${formNovoTarefa.prova} ${formNovoTarefa.ano} ${formNovoTarefa.aplicacao ? `- ${formNovoTarefa.aplicacao}` : ''} ${formNovoTarefa.dia ? `(${formNovoTarefa.dia})` : ''} ${formNovoTarefa.cor ? `- Cor ${formNovoTarefa.cor}` : ''}`.trim();

    const p = await criarProblemaManual({
      userId: user.id,
      titulo,
      agendadoPara: formNovoTarefa.agendado_para || null,
      prioridade: formNovoTarefa.prioridade,
      origem: 'simulado',
      prova: formNovoTarefa.prova,
      ano: formNovoTarefa.ano,
      corProva: formNovoTarefa.cor
    });
    
    if (p) {
      toast.success("Tarefa de simulado criada!");
      setIsModalNovoOpen(false);
      setFormNovoTarefa({ prova: '', ano: '', aplicacao: '', dia: '', cor: '', agendado_para: '', prioridade: 0 });
      setRefreshTrigger(prev => prev + 1);
    } else {
      toast.error("Erro ao criar tarefa.");
    }
    setIsSavingTarefa(false);
  };


  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const prefs = await getPreferences();
      setCfgProvas(prefs.provas || []);
      setCfgAplicacoes(prefs.aplicacoes || []);
      setCfgCores(prefs.cores || []);

      const data = await listarSimulados(user.id);
      setSimulados(data);

      // Carrega simulados concluídos da sub-aba tarefas
      const todos = await listarProblemas(user.id);
      const concluidos = todos.filter(p => p.origem === 'simulado' && p.status === 'concluido');
      setSimuladosConcluidos(concluidos);

      setIsLoaded(true);
    }
    init();
  }, [refreshTrigger]);

  const [form, setForm] = useState<any>({
    nomeProva: "",
    anoProva: "",
    tempo1H: "", tempo1M: "",
    tempo2H: "", tempo2M: "",
    tempoRedH: "", tempoRedM: "",
    questoesErradas: []
  });

  // When global model changes, reset form
  useEffect(() => {
    setForm((prev: any) => ({
       nomeProva: prev.nomeProva,
       anoProva: prev.anoProva,
       tempo1H: "", tempo1M: "", tempo2H: "", tempo2M: "", tempoRedH: "", tempoRedM: "",
       questoesErradas: []
    }));
  }, [globalModeloProva]);

  const modeloSelecionado = MODELOS_PROVAS.find(m => m.id === globalModeloProva) || MODELOS_PROVAS[0];

  const [timerConfig, setTimerConfig] = useState({ hours: 5, minutes: 30 });

  // Countdown ancorado em Date.now() — resistente a tela apagada
  const {
    timeLeft,
    isRunning: isTimerRunning,
    start: startCountdown,
    pause: pauseTimer,
    resume: resumeCountdown,
    reset: resetTimer,
  } = useCountdown(() => {
    // Bipe de alarme via Web Audio API (sem arquivo externo)
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, startTime);
        gain.gain.setValueAtTime(0.4, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      // Dois bipes: imediato + 0.35s depois
      playTone(ctx.currentTime, 0.25);
      playTone(ctx.currentTime + 0.35, 0.25);
    } catch { /* navegador sem suporte a AudioContext — sem bipe, sem crash */ }
    toast.success("Tempo esgotado!");
  }, 'metauto_timer_simulados');

  const [showExactTime, setShowExactTime] = useState(false);

  // Persiste no localStorage para que GlobalTimerWidget saiba quando mostrar o timer flutuante
  const setIsFocusMode     = (v: boolean) => {
    _setIsFocusMode(v);
    try {
      const cur = JSON.parse(localStorage.getItem('metauto_timer_ui') || '{}');
      localStorage.setItem('metauto_timer_ui', JSON.stringify({ ...cur, isFocusMode: v }));
    } catch { /* noop */ }
  };
  const setIsTimerMinimized = (v: boolean) => {
    _setIsTimerMinimized(v);
    try {
      const cur = JSON.parse(localStorage.getItem('metauto_timer_ui') || '{}');
      localStorage.setItem('metauto_timer_ui', JSON.stringify({ ...cur, isMinimized: v }));
    } catch { /* noop */ }
  };
  const [isFocusMode,      _setIsFocusMode]      = useState(false);
  const [isTimerMinimized, _setIsTimerMinimized]  = useState(false);
  const [floatPos, setFloatPos] = useState({ x: 24, y: 80 });
  const [questaoInput, setQuestaoInput] = useState("");

  /**
   * Inicia o countdown:
   * - Se timeLeft === 0 → começa do zero com a config atual
   * - Se timeLeft > 0 (timer pausado) → retoma de onde parou
   */
  const startTimer = () => {
    if (timeLeft === 0) {
      startCountdown(timerConfig.hours * 3600 + timerConfig.minutes * 60);
    } else {
      resumeCountdown();
    }
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

    // Máscaras progressivas de alerta: 30min -> 15min -> 5min
    const CINCO_MIN = 5 * 60;
    const TRINTA_MIN = 30 * 60;
    
    let blockSize: number;
    if (totalSeconds <= CINCO_MIN) {
      blockSize = 5 * 60; // Bloco de 5 min se faltarem 5 min ou menos
    } else if (totalSeconds <= TRINTA_MIN) {
      blockSize = 15 * 60; // Bloco de 15 min se faltarem entre 5 e 30 min
    } else {
      blockSize = 30 * 60; // Bloco de 30 min se faltarem mais de 30 min
    }

    const masked = Math.ceil(totalSeconds / blockSize) * blockSize;
    return formatTime(masked);
  };

  const handleSubmit = async () => {
    if (!form.nomeProva && !selectedTarefaSimulado) { toast.error("Selecione ou identifique um simulado!"); return; }
    if (!userId) { toast.error("Sessão expirada. Faça login novamente."); return; }

    const currentModelId = selectedTarefaSimulado ? (selectedTarefaSimulado.prova || globalModeloProva) : globalModeloProva;
    const currentModel = MODELOS_PROVAS.find(m => m.id === currentModelId) || MODELOS_PROVAS[0];

    // Determine diaSelecionado based on title
    let diaSelecionado: number | undefined = undefined;
    if (selectedTarefaSimulado) {
      if (selectedTarefaSimulado.titulo.includes("(Dia 1)")) diaSelecionado = 1;
      if (selectedTarefaSimulado.titulo.includes("(Dia 2)")) diaSelecionado = 2;
    }

    let acertos = 0;
    let totalQuestoes = 0;
    let nLing = 0, nHum = 0, nNat = 0, nMat = 0, nRed = parseInt(form.redacao) || 0;
    const novosDados: any = {};

    if (currentModelId === 'ENEM') {
      const yStr = selectedTarefaSimulado ? (selectedTarefaSimulado.titulo.replace('Simulado: ', '').split(' ')[1] || '') : form.anoProva;
      const cfg = getENEMConfig(yStr);
      
      const areasFiltradas = [];
      if (!diaSelecionado || diaSelecionado === 1) areasFiltradas.push(...cfg.dia1.areas);
      if (cfg.dia2 && (!diaSelecionado || diaSelecionado === 2)) areasFiltradas.push(...cfg.dia2.areas);

      areasFiltradas.forEach(area => {
        const v = parseInt(form[area.id]) || 0;
        novosDados[area.id] = v;
        acertos += v;
        totalQuestoes += area.max;
        
        if (area.id === 'linguagens') nLing = v;
        if (area.id === 'humanas') nHum = v;
        if (area.id === 'naturezas') nNat = v;
        if (area.id === 'matematica') nMat = v;
        if (area.id === 'questoes') {
          // Na era clássica (63 questões), podemos distribuir ou apenas somar
          // Para métricas, vamos considerar como acertos gerais
        }
      });
    } else {
      currentModel.fases.forEach(f => {
         f.campos.forEach(c => {
            if (diaSelecionado && c.dia && c.dia !== diaSelecionado) return;

            let dynamicMax = c.max;
            if (currentModelId === 'UNB') {
               let anoStr = form.anoProva;
               if (selectedTarefaSimulado) {
                  const cleanT = selectedTarefaSimulado.titulo.replace('Simulado: ', '');
                  anoStr = cleanT.split(' ')[1] || '';
               }
               dynamicMax = getExamItemCount(anoStr, c.dia || 1);
            } else if (currentModelId === 'FUVEST_1') {
               let anoStr = form.anoProva;
               if (selectedTarefaSimulado) {
                  const cleanT = selectedTarefaSimulado.titulo.replace('Simulado: ', '');
                  anoStr = cleanT.split(' ')[1] || '';
               }
               const cfg = getFUVESTFase1Config(anoStr);
               dynamicMax = cfg.max;
            }

            if (c.tipo === 'numerico') {
               const v = parseInt(form[c.id]) || 0;
               novosDados[c.id] = v;
               acertos += v;
               totalQuestoes += dynamicMax;
             } else if (c.tipo === 'certo_errado') {
               const certos = parseInt(form[`${c.id}_c`]) || 0;
               const errados = parseInt(form[`${c.id}_e`]) || 0;
               const branco = parseInt(form[`${c.id}_b`]) || 0;
               novosDados[c.id] = { certos, errados, branco };
               totalQuestoes += dynamicMax;
               acertos += Math.max(0, certos - errados);
            }
         });
      });
    }

    // ── Validação de limites ──────────────────────────────────
    const errosValidacao: string[] = [];
    
    if (currentModelId === 'ENEM') {
      const yStr = selectedTarefaSimulado ? (selectedTarefaSimulado.titulo.replace('Simulado: ', '').split(' ')[1] || '') : form.anoProva;
      const cfg = getENEMConfig(yStr);
      
      const areasValidar = [];
      if (!diaSelecionado || diaSelecionado === 1) areasValidar.push(...cfg.dia1.areas);
      if (cfg.dia2 && (!diaSelecionado || diaSelecionado === 2)) areasValidar.push(...cfg.dia2.areas);

      areasValidar.forEach(area => {
        const val = parseInt(form[area.id]) || 0;
        if (val > area.max) {
          errosValidacao.push(`${area.label}: ${val} excede o máximo de ${area.max} questões.`);
        }
      });
    } else {
      currentModel.fases.forEach(f => {
         f.campos.forEach(c => {
            if (diaSelecionado && c.dia && c.dia !== diaSelecionado) return;
            let dMax = c.max;
            if (currentModelId === 'UNB') {
               let anoStr2 = form.anoProva;
               if (selectedTarefaSimulado) {
                  const cleanT2 = selectedTarefaSimulado.titulo.replace('Simulado: ', '');
                  anoStr2 = cleanT2.split(' ')[1] || '';
               }
               dMax = getExamItemCount(anoStr2, c.dia || 1);
            } else if (currentModelId === 'FUVEST_1') {
               let anoStr2 = form.anoProva;
               if (selectedTarefaSimulado) {
                  const cleanT2 = selectedTarefaSimulado.titulo.replace('Simulado: ', '');
                  anoStr2 = cleanT2.split(' ')[1] || '';
               }
               const cfg = getFUVESTFase1Config(anoStr2);
               dMax = cfg.max;
            }
            if (c.tipo === 'numerico') {
               const v = parseInt(form[c.id]) || 0;
               if (v > dMax) errosValidacao.push(`${c.label}: ${v} excede o máximo de ${dMax} questões.`);
            } else if (c.tipo === 'certo_errado') {
               const soma = (parseInt(form[`${c.id}_c`]) || 0) + (parseInt(form[`${c.id}_e`]) || 0) + (parseInt(form[`${c.id}_b`]) || 0);
               if (soma > dMax) errosValidacao.push(`${c.label}: ${soma} itens somados excedem o máximo de ${dMax}.`);
            }
         });
      });
    }

    if (errosValidacao.length > 0) {
       errosValidacao.forEach(msg => toast.error(msg));
       return;
    }
    // ─────────────────────────────────────────────────────────

    const t1 = (parseInt(form.tempo1H) || 0) * 60 + (parseInt(form.tempo1M) || 0);
    const t2 = (parseInt(form.tempo2H) || 0) * 60 + (parseInt(form.tempo2M) || 0);
    const tRed = (parseInt(form.tempoRedH) || 0) * 60 + (parseInt(form.tempoRedM) || 0);

    setIsSaving(true);
    try {
      const tituloCompleto = selectedTarefaSimulado
        ? selectedTarefaSimulado.titulo
        : (form.anoProva ? `${form.nomeProva} ${form.anoProva}` : form.nomeProva);
        
      let anoStrSubmit = form.anoProva;
      if (selectedTarefaSimulado) {
         const cleanT = selectedTarefaSimulado.titulo.replace('Simulado: ', '');
         anoStrSubmit = cleanT.split(' ')[1] || '';
      }

      const entry = await criarSimulado({
        userId,
        tituloSimulado: tituloCompleto,
        modeloProva: currentModelId,
        dadosModelo: novosDados,
        totalQuestoes,
        acertos,
        examYear: parseInt(anoStrSubmit) || undefined,
        examDay: diaSelecionado,
        linguagens: nLing, humanas: nHum, naturezas: nNat, matematica: nMat, redacao: nRed,
        tempo1Min: t1, tempo2Min: t2, tempoRedMin: tRed,
      });
      if (entry) {
        setSimulados(prev => [entry, ...prev]);
        toast.success("Desempenho salvo no banco! 🎯");

        if (selectedTarefaSimulado) {
           await deletarProblema(selectedTarefaSimulado.id);
           setSimuladosConcluidos(prev => prev.filter(t => t.id !== selectedTarefaSimulado.id));
           setSelectedTarefaSimulado(null);
        }

        if (form.questoesErradas && form.questoesErradas.length > 0) {
           const nums = form.questoesErradas;
           if (nums.length > 0) {
              const promises = nums.map((qNum: number) => {
                 return criarProblemaManual({
                    userId,
                    titulo: `Q${qNum} - ${tituloCompleto}`,
                    agendadoPara: null,
                    prioridade: 0,
                    origem: 'kevquest',
                    prova: currentModelId,
                    ano: selectedTarefaSimulado?.ano || form.anoProva || '',
                    corProva: selectedTarefaSimulado?.cor_prova || form.cor || null,
                    qNum: qNum.toString(),
                    tipoErro: null as any,
                    comentario: ""
                 });
              });
              await Promise.all(promises);
              toast.success(`${nums.length} questões enviadas ao funil KevQuest! 📥`);
           }
        }

        // triggers re-render and cleans form via useEffect but let's force a clean manually preserving name
        setForm({
           nomeProva: form.nomeProva,
           anoProva: form.anoProva,
           tempo1H: "", tempo1M: "", tempo2H: "", tempo2M: "", tempoRedH: "", tempoRedM: "",
           questoesErradas: []
        });
      } else {
        toast.error("Erro ao salvar.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await deletarSimulado(id);
    if (ok) {
      setSimulados(prev => prev.filter(s => s.id !== id));
      toast.success("Simulado removido.");
    } else {
      toast.error("Erro ao remover.");
    }
  };

  const handleDesconcluirAnalise = async (sim: SimuladoDB) => {
    const ok = await desmarcarSimuladoAnalisado(sim.id, sim.dados_modelo);
    if (ok) {
      setSimulados(prev => prev.map(s =>
        s.id === sim.id
          ? { ...s, dados_modelo: { ...s.dados_modelo, kevquest_analisado: false } }
          : s
      ));
      toast.success("Análise reaberta — simulado voltou para a fila do KevQuest.");
    } else {
      toast.error("Erro ao desfazer análise.");
    }
  };

  const simuladosFiltrados = simulados.filter(s => (s.modelo_prova || 'ENEM') === globalModeloProva);

  const getGeneralAnalysisData = () => {
    if (globalModeloProva === 'ENEM') {
      const groups: Record<string, { acertos: number; maxQ: number; realizado_em: string }> = {};

      simuladosFiltrados.forEach((sim) => {
        const cleanT = sim.titulo_simulado.replace('Simulado: ', '');
        const parts = cleanT.split(' ');
        const prova = parts[0] || '';
        const ano = parts[1] || '';
        const aplicacaoMatch = cleanT.match(/- ([^(]+)/);
        const aplicacao = aplicacaoMatch ? aplicacaoMatch[1].split(' - Cor')[0].trim() : '';

        const groupKey = `${prova} ${ano}${aplicacao ? ` - ${aplicacao}` : ''}`.trim();

        if (!groups[groupKey]) {
          groups[groupKey] = { acertos: 0, maxQ: 0, realizado_em: sim.realizado_em };
        } else {
          if (new Date(sim.realizado_em) > new Date(groups[groupKey].realizado_em)) {
            groups[groupKey].realizado_em = sim.realizado_em;
          }
        }

        groups[groupKey].acertos += sim.acertos;
        groups[groupKey].maxQ += sim.total_questoes;
      });

      return Object.entries(groups)
        .map(([name, data]) => ({
          name,
          display: `${name} (${format(new Date(data.realizado_em), "dd/MM", { locale: ptBR })})`,
          acertos: data.acertos,
          maxQ: data.maxQ,
          realizado_em: data.realizado_em,
        }))
        .sort((a, b) => new Date(a.realizado_em).getTime() - new Date(b.realizado_em).getTime());
    }

    return [...simuladosFiltrados].reverse().map(sim => {
      const dateStr = sim.realizado_em ? format(new Date(sim.realizado_em), "dd/MM", { locale: ptBR }) : "";
      return {
        name: sim.titulo_simulado,
        display: `${sim.titulo_simulado} (${dateStr})`,
        acertos: sim.acertos,
        maxQ: sim.total_questoes,
      };
    });
  };

  const getChartDataDay1 = () => {
    return [...simuladosFiltrados]
      .filter(sim => {
        if (globalModeloProva !== 'ENEM') return true;
        return !sim.titulo_simulado.includes('(Dia 2)');
      })
      .reverse().map((sim) => {
        const dateStr = sim.realizado_em ? format(new Date(sim.realizado_em), "dd/MM", { locale: ptBR }) : "";
        return {
          name: `${sim.titulo_simulado} (${dateStr})`,
          linguagens: sim.linguagens || 0,
          humanas: sim.humanas || 0,
          tempo1: sim.tempo1_min || 0,
        };
      });
  };

  const getChartDataDay2 = () => {
    return [...simuladosFiltrados]
      .filter(sim => {
        if (globalModeloProva !== 'ENEM') return true;
        return !sim.titulo_simulado.includes('(Dia 1)');
      })
      .reverse().map((sim) => {
        const dateStr = sim.realizado_em ? format(new Date(sim.realizado_em), "dd/MM", { locale: ptBR }) : "";
        return {
          name: `${sim.titulo_simulado} (${dateStr})`,
          matematica: sim.matematica || 0,
          naturezas: sim.naturezas || 0,
          tempo2: sim.tempo2_min || 0,
        };
      });
  };

  const getRedacaoPerformanceData = () => {
    return [...simuladosFiltrados]
      .filter(sim => {
        if (globalModeloProva !== 'ENEM') return true;
        return !sim.titulo_simulado.includes('(Dia 2)') && sim.redacao > 0;
      })
      .reverse().map(sim => {
        const dateStr = sim.realizado_em ? format(new Date(sim.realizado_em), "dd/MM", { locale: ptBR }) : "";
        return {
          name: `${sim.titulo_simulado} (${dateStr})`,
          nota: sim.redacao || 0,
          tempo: sim.tempo_red_min || 0,
        };
      });
  };

  const getUNBAnalysisData = () => {
    return [...simuladosFiltrados].reverse().map(sim => {
       const dateStr = sim.realizado_em ? format(new Date(sim.realizado_em), "dd/MM", { locale: ptBR }) : "";
       let certos = 0, errados = 0;
       if (sim.dados_modelo) {
          Object.values(sim.dados_modelo).forEach((v: any) => {
             if (v?.certos !== undefined) certos += v.certos;
             if (v?.errados !== undefined) errados += v.errados;
          });
       }
       return {
         name: `${sim.titulo_simulado} (${dateStr})`,
         Liquido: sim.acertos, 
         Certo: certos,
         Errado: errados
       };
    });
  }

  if (!isLoaded) return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Carregando Simulados...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-7xl pb-20 px-4 md:px-0">
      
      {/* ─── HEAD & GLOBAL SELECTOR ───────────────────────────────────────── */}
      <header className="mb-2 relative z-50">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#1B2B5E]/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3 md:gap-4">
              <div className="bg-[#1B2B5E] p-2.5 md:p-3 rounded-[1rem] md:rounded-[1.2rem] shadow-lg shadow-[#1B2B5E]/20">
                <Activity className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              Simulados
            </h1>
            <div className="flex items-center gap-3 mt-2 md:mt-3">
              <div className="h-1 w-12 bg-[#F97316] rounded-full"></div>
              <p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-[0.15em] md:tracking-[0.2em]">Alta Performance & Múltiplas Bancas</p>
            </div>
          </div>

          <button
            onClick={() => { setIsFocusMode(true); setIsTimerMinimized(false); }}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border-2 font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-sm ${
              isTimerRunning
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-500/30 animate-pulse'
                : 'bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-[#2C2C2E] text-slate-700 dark:text-white hover:border-indigo-400'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Cronômetro</span>
            {isTimerRunning && <span className="text-xs font-mono">{getDisplayTime().slice(0,5)}</span>}
          </button>

        </div>
      </header>

      {isFocusMode && !isTimerMinimized && (
        <SimulatorOverlay
          getDisplayTime={getDisplayTime}
          timeLeft={timeLeft}
          timerConfig={timerConfig}
          setTimerConfig={setTimerConfig}
          isTimerRunning={isTimerRunning}
          pauseTimer={pauseTimer}
          startTimer={startTimer}
          resetTimer={resetTimer}
          showExactTime={showExactTime}
          setShowExactTime={setShowExactTime}
          onClose={() => setIsFocusMode(false)}
          onMinimize={() => setIsTimerMinimized(true)}
        />
      )}

      {isFocusMode && isTimerMinimized && (
        <FloatingTimer
          getDisplayTime={getDisplayTime}
          isTimerRunning={isTimerRunning}
          pauseTimer={pauseTimer}
          startTimer={startTimer}
          pos={floatPos}
          setPos={setFloatPos}
          onExpand={() => setIsTimerMinimized(false)}
          onClose={() => { setIsFocusMode(false); setIsTimerMinimized(false); }}
        />
      )}

      {/* ─── TOGGLE TRIFÁSICO ─────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1C1C1E] p-2 rounded-[2rem] flex items-center w-full border border-slate-100 dark:border-[#2C2C2E] shadow-sm mb-6 relative z-10">
        <button onClick={() => { setActiveTab("tarefas"); localStorage.setItem('simulados_activeTab', 'tarefas'); }} className={`flex-1 py-4 text-sm font-black rounded-[1.8rem] transition-all duration-200 uppercase tracking-[0.18em] ${activeTab === "tarefas" ? "bg-[#1B2B5E] text-white shadow-lg shadow-[#1B2B5E]/20" : "text-slate-400 dark:text-[#A1A1AA] hover:text-slate-600 dark:hover:text-white"}`}>
          Programados
        </button>
        <button onClick={() => { setActiveTab("lancamento"); localStorage.setItem('simulados_activeTab', 'lancamento'); }} className={`flex-1 py-4 text-sm font-black rounded-[1.8rem] transition-all duration-200 uppercase tracking-[0.18em] ${activeTab === "lancamento" ? "bg-[#1B2B5E] text-white shadow-lg shadow-[#1B2B5E]/20" : "text-slate-400 dark:text-[#A1A1AA] hover:text-slate-600 dark:hover:text-white"}`}>
          Lançamento
        </button>
        <button onClick={() => { setActiveTab("metricas"); localStorage.setItem('simulados_activeTab', 'metricas'); }} className={`flex-1 py-4 text-sm font-black rounded-[1.8rem] transition-all duration-200 uppercase tracking-[0.18em] ${activeTab === "metricas" ? "bg-[#1B2B5E] text-white shadow-lg shadow-[#1B2B5E]/20" : "text-slate-400 dark:text-[#A1A1AA] hover:text-slate-600 dark:hover:text-white"}`}>
          Evolução
        </button>
      </div>

      {activeTab === "tarefas" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">Simulados Agendados</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Gerencie seus simulados planejados</p>
            </div>
            <button
              onClick={() => setIsModalNovoOpen(true)}
              className="flex items-center justify-center gap-2 bg-[#F97316] hover:bg-orange-600 text-white font-black px-6 py-4 rounded-[1.5rem] text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-orange-500/20 w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Novo Simulado</span>
            </button>
          </div>
          <ModuleTarefasSimulado refreshTrigger={refreshTrigger} onRefresh={() => setRefreshTrigger(prev => prev + 1)} />
        </div>
      )}

      {activeTab === "lancamento" && (
        <>
          <div className="mb-2">
            <h2 className="text-xl font-black text-slate-800 dark:text-white">Lançar Desempenho</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Registre o resultado do simulado concluído</p>
          </div>

          <section className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] -ml-40 -mt-40 pointer-events-none"></div>

            <div className="relative z-10 space-y-10">
              {/* Seleção do simulado concluído */}
              <div className="pb-6 border-b border-slate-100 dark:border-[#2C2C2E]">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3"><Send className="w-7 h-7 text-indigo-500" />Cadastrar Desempenho</h3>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Selecione o simulado que você concluiu</p>
                  </div>
                  {selectedTarefaSimulado && (
                    <button onClick={handleSubmit} disabled={isSaving} className="h-12 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black px-8 rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {isSaving ? "Salvando..." : "Finalizar"}
                    </button>
                  )}
                </div>

                {simuladosConcluidos.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-[#2C2C2E] border-2 border-dashed border-slate-200 dark:border-[#3A3A3C] rounded-[2rem] p-10 flex flex-col items-center justify-center text-center gap-3">
                    <CheckCircle className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-black uppercase tracking-widest text-slate-400">Nenhum simulado concluído ainda.</p>
                    <p className="text-xs text-slate-400">Crie e conclua um simulado na sub-aba <strong className="text-[#F97316]">Programados</strong> para lançar aqui.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {simuladosConcluidos.map(tarefa => {
                      const isSelected = selectedTarefaSimulado?.id === tarefa.id;
                      return (
                        <div key={tarefa.id} className="relative group/card">
                          <button
                            onClick={() => setSelectedTarefaSimulado(isSelected ? null : tarefa)}
                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                                : 'border-slate-100 dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] hover:border-slate-200 dark:hover:border-[#3A3A3C]'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                                isSelected ? 'bg-indigo-500 text-white' : 'bg-[#1B2B5E]/10 text-[#1B2B5E] dark:text-blue-400'
                              }`}>
                                <Activity className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-black text-sm leading-tight truncate ${
                                  isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-white'
                                }`}>{tarefa.titulo}</p>
                                {tarefa.concluido_at && (
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                    Concluído em {new Date(tarefa.concluido_at).toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                          </button>
                          {/* Botão de reabrir — aparece no hover */}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const ok = await reabrirProblema(tarefa.id);
                              if (ok) {
                                setSimuladosConcluidos(prev => prev.filter(t => t.id !== tarefa.id));
                                if (selectedTarefaSimulado?.id === tarefa.id) setSelectedTarefaSimulado(null);
                                toast.success('Simulado reaberto — voltou para Programados! ↩️');
                              } else {
                                toast.error('Erro ao reabrir simulado.');
                              }
                            }}
                            title="Desfazer conclusão"
                            className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 p-1.5 rounded-xl border border-amber-100 dark:border-transparent"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {selectedTarefaSimulado ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SimuladoFormFields
                    form={form}
                    setForm={setForm}
                    modelo={MODELOS_PROVAS.find(m => m.id === selectedTarefaSimulado?.prova) || modeloSelecionado}
                    examYear={(() => {
                      const cleanT = selectedTarefaSimulado.titulo.replace('Simulado: ', '');
                      return cleanT.split(' ')[1] || form.anoProva;
                    })()}
                    diaSelecionado={(() => {
                      if (!selectedTarefaSimulado) return undefined;
                      if (selectedTarefaSimulado.titulo.includes("(Dia 1)")) return 1;
                      if (selectedTarefaSimulado.titulo.includes("(Dia 2)")) return 2;
                      return undefined;
                    })()}
                  />
                  
                  <div className="mt-8 bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm">
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.25em]">Questões Erradas (KevQuest)</label>
                    <p className="text-xs text-slate-500 mb-4 font-bold">Digite o número da questão e aperte Enter. Elas serão enviadas automaticamente para o funil do KevQuest.</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Array.isArray(form.questoesErradas) && form.questoesErradas.map((num: number) => (
                        <div key={num} className="flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 text-rose-500 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-500/20 shadow-sm">
                          <span className="text-xs font-black">Q{num}</span>
                          <button 
                            type="button" 
                            onClick={() => setForm({...form, questoesErradas: form.questoesErradas.filter((n: number) => n !== num)})}
                            className="hover:bg-rose-200 dark:hover:bg-rose-500/30 p-0.5 rounded-md transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <input
                      type="number"
                      value={questaoInput}
                      onChange={e => setQuestaoInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = parseInt(questaoInput);
                          if (!isNaN(val) && val > 0 && !form.questoesErradas.includes(val)) {
                            setForm({...form, questoesErradas: [...form.questoesErradas, val]});
                            setQuestaoInput("");
                          }
                        }
                      }}
                      placeholder="Ex: 15 (aperte Enter)"
                      className="w-full bg-white dark:bg-[#1C1C1E] font-bold text-lg px-6 py-4 rounded-2xl shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 border border-transparent transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm font-black uppercase tracking-widest text-slate-300 dark:text-slate-600 mb-2">Aguardando Seleção</p>
                  <p className="text-xs font-bold text-slate-400">Clique em um dos simulados acima para liberar o formulário de desempenho.</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {activeTab === "metricas" && (
        <div className="space-y-6">
          {/* Cabeçalho de Métricas com Seletor Premium */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2 relative z-30">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-indigo-500" />
                Evolução de Desempenho
              </h2>
              <p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Análise detalhada por banca e modelo de prova</p>
            </div>
            
            <div className="flex items-center gap-2 bg-white dark:bg-[#1C1C1E] p-1.5 rounded-[1.5rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm">
              <div className="px-3 hidden lg:block">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Banca Selecionada</p>
              </div>
              <div className="w-56">
                <CustomDropdown
                  value={globalModeloProva}
                  onChange={setGlobalModeloProva}
                  options={MODELOS_PROVAS.map(m => ({ value: m.id, label: m.nome }))}
                  placeholder="Selecione a Banca..."
                  className="h-11 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-indigo-500/10 hover:border-indigo-500/30 rounded-[1.2rem] px-4 text-sm font-black text-indigo-600 dark:text-indigo-400 transition-all"
                />
              </div>
            </div>
          </div>

          {simulados.length === 0 && (
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-16 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col items-center justify-center text-center">
              <PieChart className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-sm font-black uppercase tracking-widest text-slate-400">Nenhum simulado registrado ainda.</p>
            </div>
          )}

          {simulados.length > 0 && simuladosFiltrados.length === 0 && (
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-16 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col items-center justify-center text-center">
              <PieChart className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-sm font-black uppercase tracking-widest text-slate-400">Nenhum simulado registrado para o modelo {globalModeloProva}.</p>
            </div>
          )}

          {simuladosFiltrados.length > 0 && (
            <>
            <section className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-10 gap-3 md:gap-4">
                <div><h3 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3"><Activity className="w-6 h-6 md:w-7 md:h-7 text-indigo-500" /> Rendimento: {globalModeloProva}</h3><p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Evolução do Saldo de Acertos Líquidos</p></div>
              </div>
              <div className="h-[260px] md:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getGeneralAnalysisData()} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <defs><linearGradient id="gGr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity={0.8} /><stop offset="100%" stopColor="#818cf8" stopOpacity={0.1} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis dataKey="display" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                    <Tooltip cursor={{ fill: 'rgba(99,102,241,0.05)' }} content={<TooltipGeral />} />
                    <Legend verticalAlign="top" height={40} iconType="circle" />
                    <Bar dataKey="acertos" fill="url(#gGr)" radius={[12, 12, 0, 0]} barSize={60} name="Pontuação / Acertos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {globalModeloProva === 'ENEM' && (
               <>
                 <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
                   <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-10 gap-3 md:gap-4">
                     <div><h3 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3"><Book className="w-6 h-6 md:w-7 md:h-7 text-indigo-500" /> Análise: 1º Dia</h3><p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Linguagens e Ciências Humanas</p></div>
                   </div>
                   <div className="h-[260px] md:h-[400px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={getChartDataDay1()} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                         <defs><linearGradient id="lG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0.1} /></linearGradient><linearGradient id="hG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0.1} /></linearGradient></defs>
                         <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                         <YAxis yAxisId="left" domain={[0, 45]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                         <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                         <Tooltip content={<TooltipD1 />} /><Legend verticalAlign="top" height={40} iconType="circle" />
                         <Bar yAxisId="left" dataKey="linguagens" fill="url(#lG)" radius={[8, 8, 0, 0]} barSize={25} name="Linguagens" />
                         <Bar yAxisId="left" dataKey="humanas" fill="url(#hG)" radius={[8, 8, 0, 0]} barSize={25} name="Humanas" />
                         <Line yAxisId="right" type="monotone" dataKey="tempo1" stroke="#64748b" strokeWidth={4} dot={{ r: 6, fill: '#64748b', strokeWidth: 3, stroke: '#fff' }} name="Tempo D1" />
                       </ComposedChart>
                     </ResponsiveContainer>
                   </div>
                 </div>

                 <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
                   <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-10 gap-3 md:gap-4">
                     <div><h3 className="text-lg md:text-2xl font-black text-rose-600 dark:text-rose-400 flex items-center gap-3"><PenTool className="w-6 h-6 md:w-7 md:h-7" /> Correlação: Redação</h3></div>
                   </div>
                   <div className="h-[260px] md:h-[400px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={getRedacaoPerformanceData()} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                         <defs><linearGradient id="rG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8} /><stop offset="100%" stopColor="#f43f5e" stopOpacity={0.1} /></linearGradient></defs>
                         <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                         <YAxis yAxisId="left" domain={[0, 1000]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#f43f5e', fontWeight: 'bold' }} />
                         <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                         <Tooltip content={<TooltipRedacao />} /><Legend verticalAlign="top" height={40} iconType="circle" />
                         <Bar yAxisId="left" dataKey="nota" fill="url(#rG)" radius={[12, 12, 0, 0]} barSize={45} name="Redação" />
                         <Line yAxisId="right" type="stepAfter" dataKey="tempo" stroke="#64748b" strokeWidth={4} dot={{ r: 8, fill: '#64748b', strokeWidth: 4, stroke: '#fff' }} name="Tempo" />
                       </ComposedChart>
                     </ResponsiveContainer>
                   </div>
                 </div>

                 <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
                   <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-10 gap-3 md:gap-4">
                     <div><h3 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3"><Activity className="w-6 h-6 md:w-7 md:h-7 text-blue-500" /> Análise: 2º Dia</h3></div>
                   </div>
                   <div className="h-[260px] md:h-[400px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={getChartDataDay2()} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                         <defs><linearGradient id="mG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} /></linearGradient><linearGradient id="nG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.8} /><stop offset="100%" stopColor="#10b981" stopOpacity={0.1} /></linearGradient></defs>
                         <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                         <YAxis yAxisId="left" domain={[0, 45]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                         <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                         <Tooltip content={<TooltipD2 />} /><Legend verticalAlign="top" height={40} iconType="circle" />
                         <Bar yAxisId="left" dataKey="matematica" fill="url(#mG)" radius={[8, 8, 0, 0]} barSize={35} name="Matemática" />
                         <Bar yAxisId="left" dataKey="naturezas" fill="url(#nG)" radius={[8, 8, 0, 0]} barSize={35} name="Natureza" />
                         <Line yAxisId="right" type="monotone" dataKey="tempo2" stroke="#64748b" strokeWidth={4} dot={{ r: 6, fill: '#64748b', strokeWidth: 3, stroke: '#fff' }} name="Tempo D2" />
                       </ComposedChart>
                     </ResponsiveContainer>
                   </div>
                 </div>
               </>
            )}

            {globalModeloProva === 'UNB' && (
               <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
                   <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-10 gap-3 md:gap-4">
                     <div><h3 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3"><Activity className="w-6 h-6 md:w-7 md:h-7 text-indigo-500" /> Penalidade UNB</h3><p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Comparativo de Acertos, Erros e Acertos Líquidos</p></div>
                   </div>
                   <div className="h-[260px] md:h-[400px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={getUNBAnalysisData()} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                         <defs>
                           <linearGradient id="cT" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.8} /><stop offset="100%" stopColor="#10b981" stopOpacity={0.1} /></linearGradient>
                           <linearGradient id="eT" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8} /><stop offset="100%" stopColor="#f43f5e" stopOpacity={0.1} /></linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                         <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                         <Tooltip cursor={{ fill: 'rgba(99,102,241,0.05)' }} content={<TooltipGeral />} />
                         <Legend verticalAlign="top" height={40} iconType="circle" />
                         <Bar yAxisId="left" dataKey="Certo" fill="url(#cT)" radius={[8, 8, 0, 0]} barSize={25} />
                         <Bar yAxisId="left" dataKey="Errado" fill="url(#eT)" radius={[8, 8, 0, 0]} barSize={25} />
                         <Line yAxisId="left" type="monotone" dataKey="Liquido" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }} name="Nota Líquida" />
                       </ComposedChart>
                     </ResponsiveContainer>
                   </div>
               </div>
            )}

            <section className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                  <Book className="w-6 h-6 text-indigo-500" /> Histórico
                </h3>
                <span className="text-xs font-black text-slate-400 bg-slate-100 dark:bg-[#2C2C2E] px-3 py-1.5 rounded-full uppercase tracking-widest">{simuladosFiltrados.length} registros</span>
              </div>
              <div className="space-y-3">
                {simuladosFiltrados.map(sim => {
                  const dateStr = sim.realizado_em ? format(new Date(sim.realizado_em), "dd/MM/yyyy", { locale: ptBR }) : "";
                  const isAnalisado = sim.dados_modelo?.kevquest_analisado === true;

                  return (
                    <div key={sim.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-[#2C2C2E]/60 rounded-2xl px-4 py-3 md:px-5 md:py-4 border border-slate-100 dark:border-white/5 group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-slate-800 dark:text-white text-sm truncate">{sim.titulo_simulado}</p>
                          {isAnalisado && (
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-500/20">
                              <CheckCircle className="w-2.5 h-2.5" />
                              KevQuest ✓
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{dateStr}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                        <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 px-2 rounded-md">{sim.acertos} / {sim.total_questoes} Acertos</span>
                        {sim.redacao > 0 && <span className="text-rose-500">✍️ {sim.redacao} red.</span>}
                        {sim.tempo_total_min > 0 && <span className="text-slate-400">⏱ {sim.tempo_total_min} min</span>}
                      </div>
                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                        {isAnalisado && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDesconcluirAnalise(sim); }}
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all" 
                            title="Desfazer análise — volta para a fila do KevQuest"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => setEditingSimulado(sim)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all" title="Editar"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(sim.id)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all" title="Remover"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            </>
          )}
        </div>
      )}

      <AnimatePresence>
        {editingSimulado && (
          <EditSimuladoModal
            sim={editingSimulado}
            cfgProvas={cfgProvas}
            cfgAplicacoes={cfgAplicacoes}
            cfgCores={cfgCores}
            onClose={() => setEditingSimulado(null)}
            onSave={(updated) => {
              setSimulados(prev => prev.map(s => s.id === updated.id ? updated : s));
            }}
          />
        )}
      </AnimatePresence>

      {/* Modal Novo Simulado (Tarefa) */}
      {isModalNovoOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={() => setIsModalNovoOpen(false)}>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 animate-in fade-in zoom-in-95 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsModalNovoOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black mb-2 text-slate-800 dark:text-white flex items-center gap-3">
              <Activity className="w-6 h-6 text-[#1B2B5E]" />
              Novo Simulado
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">
              {formNovoTarefa.prova && formNovoTarefa.ano.trim().length === 4
                ? "Preencha os detalhes da prova"
                : "Comece selecionando a banca e o ano"}
            </p>
            <form onSubmit={handleNovoTarefaSimulado} className="space-y-4">

              {/* ── ETAPA 1: Prova + Ano ── */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Prova *</label>
                  <CustomDropdown
                    value={formNovoTarefa.prova}
                    onChange={(val) => setFormNovoTarefa({...formNovoTarefa, prova: val, aplicacao: '', dia: '', cor: ''})}
                    options={cfgProvas.length > 0 ? cfgProvas.map(p => { const m = MODELOS_PROVAS.find(model => model.id === p); return { value: p, label: m ? m.nome : p }; }) : MODELOS_PROVAS.map(m => ({ value: m.id, label: m.nome }))}
                    placeholder="Selecione a Banca..."
                    className="h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-medium outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Ano *</label>
                  <input
                    required
                    type="number"
                    value={formNovoTarefa.ano}
                    onChange={e => setFormNovoTarefa({...formNovoTarefa, ano: e.target.value, aplicacao: '', dia: '', cor: ''})}
                    className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 font-medium"
                    placeholder="Ex: 2023"
                    min="1990"
                    max="2099"
                  />
                </div>
              </div>

              {/* ── ETAPA 2: Campos extras (só aparecem quando prova + ano estão preenchidos) ── */}
              {formNovoTarefa.prova && formNovoTarefa.ano.trim().length === 4 && (() => {
                const isUNB = formNovoTarefa.prova === 'UNB';
                const isENEM = formNovoTarefa.prova === 'ENEM';
                const anoNum = parseInt(formNovoTarefa.ano) || 0;
                
                const isENEMSingleDay = isENEM && anoNum >= 1998 && anoNum <= 2008;
                const isMultiDia = isENEMSingleDay ? false : MODELOS_PROVAS.find(m => m.id === formNovoTarefa.prova)?.fases.some(f => f.dias > 1);
                
                const showAplicacaoUNB = isUNB && anoNum <= 2013;
                const showAplicacaoOutros = !isUNB;
                const showCor = !isUNB;

                return (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* Dia — para provas multi-dia (ENEM, UNB, FUVEST_2...) */}
                    {isMultiDia && (
                      <div>
                        <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Dia *</label>
                        <CustomDropdown
                          value={formNovoTarefa.dia}
                          onChange={(val) => setFormNovoTarefa({...formNovoTarefa, dia: val})}
                          options={(() => {
                            if (formNovoTarefa.prova === 'FUVEST_2') {
                              const cfg = getFUVESTFase2Config(formNovoTarefa.ano);
                              const opts = cfg.dias.map(d => ({ value: `Dia ${d.numero}`, label: d.label }));
                              opts.push({ value: "Completo", label: "Completo / Todos os Dias" });
                              return opts;
                            }
                            return [
                              { value: "Dia 1", label: "Dia 1" },
                              { value: "Dia 2", label: "Dia 2" },
                              ...((formNovoTarefa.prova === 'UNB' || formNovoTarefa.prova === 'ENEM') ? [{ value: "Completo", label: "Completo / Ambos os Dias" }] : []),
                            ];
                          })()}
                          placeholder="Selecione o Dia..."
                          className="h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-medium outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                        />
                      </div>
                    )}

                    {/* Aplicação — UNB até 2013: só semestres */}
                    {showAplicacaoUNB && (
                      <div>
                        <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Aplicação</label>
                        <CustomDropdown
                          value={formNovoTarefa.aplicacao}
                          onChange={v => setFormNovoTarefa({ ...formNovoTarefa, aplicacao: v })}
                          options={[
                            { value: "1º Semestre", label: "1º Semestre" },
                            { value: "2º Semestre", label: "2º Semestre" },
                          ]}
                          placeholder="Selecione o Semestre..."
                          className="h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-medium outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                        />
                      </div>
                    )}

                    {/* Aplicação — demais bancas: campo livre */}
                    {showAplicacaoOutros && (
                      <div>
                        <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Aplicação</label>
                        <CustomDropdown
                          value={formNovoTarefa.aplicacao}
                          onChange={v => setFormNovoTarefa({ ...formNovoTarefa, aplicacao: v })}
                          options={cfgAplicacoes.map(a => ({ value: a, label: a }))}
                          placeholder="Ex: Regular"
                          onAddNewItem={async (v) => {
                            const newAps = [...cfgAplicacoes, v];
                            setCfgAplicacoes(newAps);
                            await updatePreferences({ aplicacoes: newAps });
                            setFormNovoTarefa({ ...formNovoTarefa, aplicacao: v });
                          }}
                          className="h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-medium outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                        />
                      </div>
                    )}

                    {/* Cor da Prova — não se aplica à UNB */}
                    {showCor && (
                      <div>
                        <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Cor da Prova</label>
                        <CustomDropdown
                          value={formNovoTarefa.cor}
                          onChange={v => setFormNovoTarefa({ ...formNovoTarefa, cor: v })}
                          options={cfgCores.map(c => ({ value: c, label: c }))}
                          placeholder="Ex: Azul"
                          onAddNewItem={async (v) => {
                            const newCores = [...cfgCores, v];
                            setCfgCores(newCores);
                            await updatePreferences({ cores: newCores });
                            setFormNovoTarefa({ ...formNovoTarefa, cor: v });
                          }}
                          className="h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-medium outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                        />
                      </div>
                    )}

                    {/* Agendamento e Prioridade */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-[#2C2C2E]">
                      <div>
                        <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Agendar para</label>
                        <input type="date" value={formNovoTarefa.agendado_para} onChange={e => setFormNovoTarefa({...formNovoTarefa, agendado_para: e.target.value})} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 font-medium" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Prioridade</label>
                        <CustomDropdown
                          value={formNovoTarefa.prioridade.toString()}
                          onChange={v => setFormNovoTarefa({...formNovoTarefa, prioridade: parseInt(v)})}
                          options={[
                            { value: "0", label: "Normal" },
                            { value: "1", label: "Urgente" }
                          ]}
                          placeholder="Prioridade"
                          className="h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-medium outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button disabled={isSavingTarefa} type="submit" className="w-full py-4 bg-[#F97316] text-white text-sm font-black uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" />
                        {isSavingTarefa ? "Salvando..." : "Agendar para lançar depois"}
                      </button>
                      <button
                        type="button"
                        disabled={isSavingTarefa}
                        onClick={async () => {
                          const { data: { user } } = await createClient().auth.getUser();
                          if (!user || !formNovoTarefa.prova.trim() || !formNovoTarefa.ano.trim()) {
                            toast.error('Prova e Ano são obrigatórios!');
                            return;
                          }
                          setIsSavingTarefa(true);
                          const titulo = `Simulado: ${formNovoTarefa.prova} ${formNovoTarefa.ano} ${formNovoTarefa.aplicacao ? `- ${formNovoTarefa.aplicacao}` : ''} ${formNovoTarefa.dia ? `(${formNovoTarefa.dia})` : ''} ${formNovoTarefa.cor ? `- Cor ${formNovoTarefa.cor}` : ''}`.trim();
                          // Cria já concluído diretamente
                          const p = await criarProblemaManual({
                            userId: user.id,
                            titulo,
                            origem: 'simulado',
                            prova: formNovoTarefa.prova,
                            ano: formNovoTarefa.ano,
                            corProva: formNovoTarefa.cor,
                          });
                          if (p) {
                            // Marca como concluído imediatamente
                            const supabase = createClient();
                            await supabase.from('problemas_estudo').update({
                              status: 'concluido',
                              concluido_at: new Date().toISOString(),
                            }).eq('id', p.id);
                            toast.success('Pronto! Simulado criado e disponível para lançar os resultados 🚀');
                            setIsModalNovoOpen(false);
                            setFormNovoTarefa({ prova: '', ano: '', aplicacao: '', dia: '', cor: '', agendado_para: '', prioridade: 0 });
                            setRefreshTrigger(prev => prev + 1);
                          } else {
                            toast.error('Erro ao criar simulado.');
                          }
                          setIsSavingTarefa(false);
                        }}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        {isSavingTarefa ? 'Salvando...' : 'Lançar Resultado Direto'}
                      </button>
                    </div>
                  </div>
                );
              })()}

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function SimulatorOverlay({
  getDisplayTime, timeLeft, timerConfig, setTimerConfig, isTimerRunning, pauseTimer, startTimer, resetTimer, showExactTime, setShowExactTime, onClose, onMinimize
}: any) {
  const [h, m, s] = getDisplayTime().split(':');
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-950 flex flex-col text-white overflow-hidden font-sans"
    >
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] -mr-60 -mt-60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-800/10 rounded-full blur-[120px] -ml-40 -mb-40 pointer-events-none" />

      {/* Top progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/5 z-20">
        <motion.div
          initial={{ width: "0%" }} animate={{ width: "100%" }}
          transition={{ duration: 1, ease: "linear" }}
          className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.6)]"
        />
      </div>

      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between px-6 md:px-12 pt-8 pb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base md:text-xl font-black tracking-widest uppercase">Modo Imersivo</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isTimerRunning ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">{isTimerRunning ? 'Em andamento' : 'Pausado'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setShowExactTime(!showExactTime)}
            className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-white/10"
          >
            {showExactTime ? 'Máscara' : 'Ver exato'}
          </button>
          <button
            onClick={onMinimize}
            title="Minimizar"
            className="w-10 h-10 md:w-12 md:h-12 bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-300 text-slate-400 rounded-xl flex items-center justify-center transition-all border border-white/10 active:scale-95"
          >
            <Minimize2 className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 md:w-12 md:h-12 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-xl flex items-center justify-center transition-all border border-white/10 active:scale-95"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {/* Center: clock */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 18, stiffness: 90 }}
          className="flex items-end justify-center gap-0 leading-none select-none"
        >
          <span className="text-[4.5rem] sm:text-[7rem] md:text-[12rem] font-black font-mono tracking-tighter tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-500/30">
            {h}:{m}
          </span>
          <span className="text-[2rem] sm:text-[3rem] md:text-[5rem] font-black font-mono tracking-tighter tabular-nums text-indigo-500/50 mb-1 md:mb-3">
            :{s}
          </span>
        </motion.div>

        {/* Config inputs when paused and at 0 */}
        {!isTimerRunning && timeLeft === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 bg-white/5 backdrop-blur-xl px-8 py-5 rounded-2xl border border-white/10 mt-8 shadow-xl"
          >
            <div className="flex flex-col items-center">
              <input
                type="number" min="0"
                value={timerConfig.hours}
                onChange={e => setTimerConfig({ ...timerConfig, hours: parseInt(e.target.value) || 0 })}
                className="w-16 md:w-20 bg-transparent text-white font-black text-3xl md:text-4xl text-center focus:outline-none focus:text-indigo-400 transition-colors"
              />
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Horas</span>
            </div>
            <span className="text-slate-600 font-black text-3xl pb-4">:</span>
            <div className="flex flex-col items-center">
              <input
                type="number" min="0" max="59"
                value={timerConfig.minutes}
                onChange={e => setTimerConfig({ ...timerConfig, minutes: parseInt(e.target.value) || 0 })}
                className="w-16 md:w-20 bg-transparent text-white font-black text-3xl md:text-4xl text-center focus:outline-none focus:text-indigo-400 transition-colors"
              />
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Minutos</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom: action buttons */}
      <div className="relative z-10 flex items-center justify-center gap-4 md:gap-6 px-6 pb-10 flex-shrink-0">
        <button
          onClick={isTimerRunning ? pauseTimer : startTimer}
          className={`w-20 h-20 md:w-28 md:h-28 rounded-[1.8rem] md:rounded-[2.5rem] flex items-center justify-center transition-all active:scale-90 shadow-2xl font-black ${
            isTimerRunning
              ? 'bg-amber-500 shadow-amber-500/30'
              : 'bg-white text-slate-950 shadow-white/10 hover:bg-indigo-50'
          }`}
        >
          {isTimerRunning
            ? <Pause className="w-8 h-8 md:w-11 md:h-11 fill-current" />
            : <Play className="w-8 h-8 md:w-11 md:h-11 fill-current ml-1" />
          }
        </button>
        <button
          onClick={resetTimer}
          className="w-16 h-16 md:w-20 md:h-20 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl md:rounded-[1.8rem] flex items-center justify-center transition-all active:scale-95 border border-white/5"
        >
          <X className="w-7 h-7 md:w-9 md:h-9" />
        </button>
      </div>

      {/* Footer brand */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
        <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-xl px-8 py-2.5 rounded-full border border-white/5">
          <div className={`w-2 h-2 rounded-full ${isTimerRunning ? 'bg-indigo-500 animate-pulse' : 'bg-slate-600'}`} />
          <p className="text-slate-600 font-black uppercase tracking-[0.5em] text-[9px]">Método Autônomo • Alta Performance</p>
        </div>
      </div>
    </motion.div>
  );
}

function FloatingTimer({ getDisplayTime, isTimerRunning, pauseTimer, startTimer, pos, setPos, onExpand, onClose }: any) {
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [setPos]);

  return (
    <div
      style={{ left: pos.x, top: pos.y, position: 'fixed', zIndex: 200, userSelect: 'none' }}
      className="w-56 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-black/40 overflow-hidden"
    >
      {/* drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="flex items-center gap-2 px-4 pt-3 pb-2 cursor-grab active:cursor-grabbing"
      >
        <div className={`w-2 h-2 rounded-full ${isTimerRunning ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Cronômetro</span>
        <div className="flex-1" />
        <button onClick={onExpand} title="Expandir" className="text-slate-500 hover:text-indigo-400 transition-colors p-0.5">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onClose} title="Fechar" className="text-slate-500 hover:text-rose-400 transition-colors p-0.5">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="px-4 pb-4">
        <div className="text-4xl font-black font-mono tracking-tighter text-center text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 leading-none mb-3">
          {getDisplayTime().slice(0, 5)}<span className="text-indigo-500/60 text-2xl">{getDisplayTime().slice(5)}</span>
        </div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={isTimerRunning ? pauseTimer : startTimer}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${
              isTimerRunning ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isTimerRunning ? 'Pausar' : 'Iniciar'}
          </button>
        </div>
      </div>
    </div>
  );
}
