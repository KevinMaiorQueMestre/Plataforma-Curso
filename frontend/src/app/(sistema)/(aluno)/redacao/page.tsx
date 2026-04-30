/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  PenTool, Plus, Trash2, ArrowRight,
  Lightbulb, CheckCircle2, Award, Activity,
  X, Star, Calendar, ChevronRight, ChevronDown,
  BarChart2, PieChart, BookOpen, CheckCircle, BarChart3
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
  CartesianGrid, ComposedChart, Line, Legend, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { format as formatDate } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { createClient } from "@/utils/supabase/client";

// ─── Tipos ─────────────────────────────────────────────────────────────────────
type StudentKanbanStatus = "proposta" | "fazendo" | "concluida" | "analisada";
type TipoProva = "enem" | "fuvest" | "unicamp" | "vunesp" | "outras";

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
  tipo_prova?: TipoProva;
  competencia_1?: number | null;
  competencia_2?: number | null;
  competencia_3?: number | null;
  competencia_4?: number | null;
  competencia_5?: number | null;
}

// ─── Config Provas ─────────────────────────────────────────────────────────────
const TIPOS_PROVA: { value: TipoProva; label: string; cor: string }[] = [
  { value: "enem",    label: "ENEM",    cor: "text-indigo-500" },
  { value: "fuvest",  label: "FUVEST",  cor: "text-amber-500"  },
  { value: "unicamp", label: "UNICAMP", cor: "text-emerald-500" },
  { value: "vunesp",  label: "VUNESP",  cor: "text-blue-500"   },
  { value: "outras",  label: "Outras",  cor: "text-slate-500"  },
];

const COMP_COLORS = ["#6366f1","#f59e0b","#10b981","#f43f5e","#8b5cf6"];
const COMP_LABELS = ["C1 • Domínio da Língua Culta","C2 • Compreensão da Proposta","C3 • Seleção e Organização","C4 • Mecanismos Linguísticos","C5 • Proposta de Intervenção"];
const COMP_SHORT  = ["C1","C2","C3","C4","C5"];
const COMP_KEYS: (keyof RedacaoGlobal)[] = ["competencia_1","competencia_2","competencia_3","competencia_4","competencia_5"];

const STEPS_NOTA = Array.from({length:11},(_,i)=>i*20); // 0,20,40...200

// ─── Colunas Kanban ────────────────────────────────────────────────────────────
const COLUMNS: {
  id: StudentKanbanStatus; label: string;
  icon: React.ComponentType<any>; accent: string; dot: string;
  card: string; badge: string; emptyText: string;
}[] = [
  { id:"proposta",  label:"Proposta",  icon:Lightbulb,    accent:"text-slate-500 dark:text-[#A1A1AA]",  dot:"bg-slate-400",  card:"hover:border-slate-300 dark:hover:border-slate-700",       badge:"bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#2C2C2E] dark:text-[#A1A1AA] dark:border-[#3A3A3C]",               emptyText:"Nenhuma proposta ainda." },
  { id:"fazendo",   label:"Fazendo",   icon:PenTool,      accent:"text-indigo-500",                     dot:"bg-indigo-500", card:"hover:border-indigo-200 dark:hover:border-indigo-900/60",  badge:"bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900/30",   emptyText:"Nenhuma redação em andamento." },
  { id:"concluida", label:"Corrigida", icon:CheckCircle2, accent:"text-teal-500",                       dot:"bg-teal-500",   card:"hover:border-teal-200 dark:hover:border-teal-900/60",      badge:"bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-900/30",               emptyText:"Arraste as finalizadas para cá." },
  { id:"analisada", label:"Analisada", icon:BarChart3,    accent:"text-fuchsia-500",                    dot:"bg-fuchsia-500",card:"hover:border-fuchsia-200 dark:hover:border-fuchsia-900/60",badge:"bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100 dark:bg-fuchsia-900/20 dark:text-fuchsia-400 dark:border-fuchsia-900/30", emptyText:"Nenhuma redação analisada." },
];

// ─── Custom Dropdown ───────────────────────────────────────────────────────────
function CustomDropdown({ value, onChange, options, placeholder, disabled=false, className="", dropdownClasses="" }: {
  value:string; onChange:(v:string)=>void; options:{value:string;label:string}[];
  placeholder:string; disabled?:boolean; className?:string; dropdownClasses?:string;
}) {
  const [isOpen,setIsOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const h=(e:MouseEvent)=>{ if(ref.current&&!ref.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[]);
  const sel=options.find(o=>o.value===value);
  return (
    <div className="relative w-full" ref={ref}>
      <button type="button" disabled={disabled} onClick={()=>setIsOpen(!isOpen)}
        className={`w-full text-left flex justify-between items-center outline-none transition-all ${className} ${disabled?'opacity-50 cursor-not-allowed':'cursor-pointer hover:border-indigo-400'}`}>
        <span className="truncate">{sel?sel.label:<span className="opacity-50 font-medium">{placeholder}</span>}</span>
        <ChevronDown className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-300 ${isOpen?'rotate-180 text-indigo-500':'text-slate-400'}`}/>
      </button>
      <AnimatePresence>
        {isOpen&&(
          <motion.div initial={{opacity:0,y:-8,scale:0.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:0.98}} transition={{duration:0.2}}
            className={`absolute z-[200] w-full mt-2 bg-white dark:bg-[#1C1C1EE6] backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden ${dropdownClasses}`}>
            <div className="max-h-60 overflow-y-auto p-1.5 flex flex-col gap-1 custom-scrollbar">
              {[...options].sort((a, b) => {
                if (a.value === "") return -1;
                if (b.value === "") return 1;
                return a.label.localeCompare(b.label);
              }).map(opt=>(
                <button key={opt.value} type="button" onClick={()=>{onChange(opt.value);setIsOpen(false);}}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${value===opt.value?'bg-indigo-600 text-white':'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'}`}>
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
function TooltipEvolucao({active,payload,label}:any) {
  if(!active||!payload?.length) return null;
  return (
    <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md min-w-[160px]">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p:any,i:number)=>(
        <p key={i} className="text-sm font-bold" style={{color:p.color}}>✍️ {p.name}: {p.value}</p>
      ))}
    </div>
  );
}

function TooltipCompetencias({active,payload,label}:any) {
  if(!active||!payload?.length) return null;
  return (
    <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md min-w-[180px]">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p:any,i:number)=>(
        <p key={i} className="text-sm font-bold" style={{color:p.fill||p.stroke}}>
          {p.name}: <span className="font-black">{p.value}</span><span className="text-xs opacity-60">/200</span>
        </p>
      ))}
    </div>
  );
}

// ─── Modal de Detalhes da Proposta ─────────────────────────────────────────────
function DetalheModal({redacao,col,onClose,onDelete,onLancarNota}:{
  redacao:RedacaoGlobal; col:typeof COLUMNS[number];
  onClose:()=>void; onDelete:(id:string,e:any)=>void; onLancarNota:(r:RedacaoGlobal)=>void;
}) {
  const tipoInfo=TIPOS_PROVA.find(t=>t.value===(redacao.tipo_prova||"enem"));
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}>
      <motion.div initial={{scale:0.95,y:20,opacity:0}} animate={{scale:1,y:0,opacity:1}} exit={{scale:0.95,y:20,opacity:0}}
        className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative border border-slate-100 dark:border-[#2C2C2E] max-h-[90vh] overflow-y-auto"
        onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400">
          <X className="w-5 h-5" />
        </button>
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border mb-5 ${col.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`}/>{col.label}
        </span>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{redacao.titulo}</h2>
        <div className="flex items-center gap-3 text-xs text-slate-400 font-bold uppercase mb-6">
          <Calendar className="w-3.5 h-3.5"/>
          {new Date(redacao.dataCriacao).toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})}
          {tipoInfo&&<span className={`px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#2C2C2E] ${tipoInfo.cor} font-black`}>{tipoInfo.label}</span>}
        </div>
        {redacao.tema&&(
          <div className="bg-slate-50 dark:bg-[#2C2C2E] rounded-2xl p-5 mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tema Base</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{redacao.tema}</p>
          </div>
        )}
        {(redacao.status==="concluida"||redacao.status==="analisada")&&(
          <div className="mb-6">
            {redacao.nota!=null?(
              <div>
                <div className={`flex items-center gap-3 p-4 rounded-2xl border mb-3 ${col.badge}`}>
                  <Star className="w-5 h-5 fill-current"/>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Nota Total</p>
                    <p className="text-2xl font-black">{redacao.nota}<span className="text-sm font-bold opacity-60"> / 1000</span></p>
                  </div>
                </div>
                {/* Competências ENEM */}
                {(redacao.tipo_prova==="enem"||!redacao.tipo_prova)&&redacao.competencia_1!=null&&(
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Competências ENEM</p>
                    {COMP_KEYS.map((k,i)=>(
                      <div key={k} className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{backgroundColor:COMP_COLORS[i]}}/>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs font-black mb-1">
                            <span className="text-slate-600 dark:text-slate-400">{COMP_SHORT[i]}</span>
                            <span style={{color:COMP_COLORS[i]}}>{(redacao[k] as number)||0}/200</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{width:`${(((redacao[k] as number)||0)/200)*100}%`,backgroundColor:COMP_COLORS[i]}}/>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ):(
              <button onClick={()=>{onLancarNota(redacao);onClose();}}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed text-sm font-black uppercase tracking-widest transition-all hover:brightness-95 ${col.badge}`}>
                <Star className="w-4 h-4"/> Lançar Nota da Redação
              </button>
            )}
          </div>
        )}
        <button onClick={e=>{onDelete(redacao.id,e);onClose();}}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
          <Trash2 className="w-4 h-4"/> Excluir proposta
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Card do Kanban ────────────────────────────────────────────────────────────
function RedacaoCard({redacao,col,onDelete,onLancarNota,onOpenDetalhe,onAdvance}:{
  redacao:RedacaoGlobal; col:typeof COLUMNS[number];
  onDelete:(id:string,e:any)=>void; onLancarNota:(r:RedacaoGlobal)=>void;
  onOpenDetalhe:(r:RedacaoGlobal)=>void; onAdvance?:(r:RedacaoGlobal)=>void;
}) {
  const {attributes,listeners,setNodeRef,transform,transition,isDragging}=useSortable({id:redacao.id,data:{status:redacao.status}});
  const style={transform:CSS.Transform.toString(transform),transition,opacity:isDragging?0.3:1};
  const dragStartPos=useRef<{x:number;y:number}|null>(null);
  const tipoInfo=TIPOS_PROVA.find(t=>t.value===(redacao.tipo_prova||"enem"));
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      onPointerDown={e=>{if(listeners?.onPointerDown)listeners.onPointerDown(e as any);dragStartPos.current={x:e.clientX,y:e.clientY};}}
      onPointerUp={e=>{
        if(!dragStartPos.current)return;
        const dx=Math.abs(e.clientX-dragStartPos.current.x),dy=Math.abs(e.clientY-dragStartPos.current.y);
        if(dx<5&&dy<5&&!isDragging)onOpenDetalhe(redacao);
        dragStartPos.current=null;
      }}>
      <div className={`group cursor-pointer bg-white dark:bg-[#1C1C1E] p-5 rounded-[1.5rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm transition-all ${col.card} ${isDragging?"shadow-xl ring-2 ring-indigo-400/40":""}`}>
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {redacao.imagens&&redacao.imagens.length>0&&(
              <div className="flex gap-2 py-2 overflow-x-auto no-scrollbar mb-4">
                {redacao.imagens.slice(0,3).map((img,idx)=>(
                  <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden border border-slate-100 dark:border-[#2C2C2E] flex-shrink-0">
                    <img src={img} alt="Preview" className="w-full h-full object-cover"/>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-snug">{redacao.titulo}</h3>
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onPointerDown={e=>{e.stopPropagation();onDelete(redacao.id,e);}}
                  className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>
            {tipoInfo&&<span className={`text-[9px] font-black uppercase tracking-widest ${tipoInfo.cor} bg-slate-50 dark:bg-[#2C2C2E] px-2 py-0.5 rounded-md inline-block mb-2`}>{tipoInfo.label}</span>}
            {redacao.tema&&<p className="text-[11px] text-slate-400 dark:text-[#71717A] leading-relaxed line-clamp-2 mb-4">{redacao.tema}</p>}
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-300 dark:text-[#52525B] font-bold uppercase">
                <Calendar className="w-3 h-3"/>
                {new Date(redacao.dataCriacao).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}
              </div>
              <div className="flex items-center gap-2">
                {(col.id==="concluida"||col.id==="analisada")&&(
                  <>
                    {redacao.nota!=null?(
                      <span className={`flex items-center gap-1 font-black text-xs px-2 py-0.5 rounded-lg ${col.badge}`}>
                        <Star className="w-3 h-3 fill-current"/> {redacao.nota}
                      </span>
                    ):(
                      <button onPointerDown={e=>{e.stopPropagation();onLancarNota(redacao);}}
                        className={`opacity-0 group-hover:opacity-100 transition-all text-[10px] font-black uppercase px-2 py-1 rounded-lg ${col.badge} hover:brightness-95 border-dashed border-2`}>
                        Lançar Nota
                      </button>
                    )}
                  </>
                )}
                {col.id!=="analisada"&&onAdvance?(
                  <button onPointerDown={e=>{e.stopPropagation();onAdvance(redacao);}}
                    className="p-1.5 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                    <ChevronRight className="w-4 h-4"/>
                  </button>
                ):(
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-[#3A3A3C] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"/>
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
function KanbanColumn({col,items,onDelete,onLancarNota,onOpenDetalhe,onAdvance}:{
  col:typeof COLUMNS[number]; items:RedacaoGlobal[];
  onDelete:(id:string,e:any)=>void; onLancarNota:(r:RedacaoGlobal)=>void;
  onOpenDetalhe:(r:RedacaoGlobal)=>void; onAdvance:(r:RedacaoGlobal)=>void;
}) {
  const {setNodeRef,isOver}=useDroppable({id:col.id});
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`}/>
          <h2 className={`text-xs font-black uppercase tracking-[0.15em] ${col.accent}`}>{col.label}</h2>
        </div>
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${col.badge}`}>{items.length}</span>
      </div>
      <div ref={setNodeRef} className={`flex-1 min-h-[60vh] rounded-[2.5rem] p-4 space-y-3 border-2 transition-all duration-200 ${isOver?"border-indigo-400 dark:border-indigo-600 bg-indigo-50/60 dark:bg-indigo-900/10 scale-[1.01]":"border-transparent bg-slate-50/80 dark:bg-[#1C1C1E]/60 border-slate-100 dark:border-[#2C2C2E]"}`}>
        <SortableContext items={items.map(i=>i.id)} strategy={verticalListSortingStrategy}>
          {items.length===0&&(
            <div className={`h-32 flex items-center justify-center rounded-[2rem] border-2 border-dashed transition-all ${isOver?"border-indigo-300 dark:border-indigo-700":"border-slate-200 dark:border-[#2C2C2E]"}`}>
              <p className="text-[11px] text-slate-400 dark:text-[#52525B] font-medium">{col.emptyText}</p>
            </div>
          )}
          {items.map(r=>(
            <RedacaoCard key={r.id} redacao={r} col={col} onDelete={onDelete} onLancarNota={onLancarNota} onOpenDetalhe={onOpenDetalhe} onAdvance={onAdvance}/>
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

// ─── Aba de Evolução ──────────────────────────────────────────────────────────
function EvolucaoRedacao({redacoes}: {redacoes: RedacaoGlobal[]}) {
  const [tipoFiltro, setTipoFiltro] = useState<TipoProva>("enem");

  const concluidas = redacoes.filter(r => (r.status === "concluida" || r.status === "analisada") && r.nota != null && (r.tipo_prova || "enem") === tipoFiltro);
  const concluidasEnem = concluidas.filter(r => (r.tipo_prova || "enem") === "enem");

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
        <PieChart className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4"/>
        <p className="text-sm font-black uppercase tracking-widest text-slate-400">Nenhuma redação finalizada ainda.</p>
        <p className="text-xs text-slate-400 mt-2">Mova suas redações para &ldquo;Corrigida&rdquo; ou &ldquo;Analisada&rdquo; e lance as notas para ver a evolução.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Seletor de prova */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-4 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex items-center gap-3 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Tipo de Prova:</span>
        <div className="flex gap-2 flex-1 min-w-0">
          {TIPOS_PROVA.map(t => {
            const cnt = redacoes.filter(r => (r.status === "concluida" || r.status === "analisada") && r.nota != null && (r.tipo_prova || "enem") === t.value).length;
            return (
              <button key={t.value} onClick={() => setTipoFiltro(t.value)}
                className={`px-4 py-2 rounded-[1.2rem] text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${tipoFiltro === t.value ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-slate-50 dark:bg-[#2C2C2E] text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}>
                {t.label} {cnt > 0 && <span className={`ml-1 opacity-70`}>({cnt})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Concluídas", value: totalConcluidas, accent: "text-slate-700 dark:text-white", suffix: "" },
          { label: "Nota Média", value: mediaNota ?? "—", accent: "text-indigo-600 dark:text-indigo-400", suffix: mediaNota ? "/1000" : "" },
          { label: "Melhor Nota", value: maiorNota ?? "—", accent: "text-teal-600 dark:text-teal-400", suffix: maiorNota ? "/1000" : "" },
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
          <BarChart2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3"/>
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">Nenhuma redação para {TIPOS_PROVA.find(t=>t.value===tipoFiltro)?.label} com nota.</p>
        </div>
      ) : (
        <>
          {/* Gráfico: Evolução da nota total */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none"/>
            <div className="relative z-10 mb-8">
              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <Activity className="w-6 h-6 text-indigo-500"/> Evolução da Nota
              </h3>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                {TIPOS_PROVA.find(t=>t.value===tipoFiltro)?.label} • {concluidas.length} redaç{concluidas.length===1?"ão":"ões"}
              </p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={evolucaoData} margin={{top:20,right:30,left:0,bottom:20}}>
                  <defs>
                    <linearGradient id="gNota" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5}/>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:12,fill:"#94a3b8",fontWeight:"bold"}} dy={10}/>
                  <YAxis domain={[0,1000]} axisLine={false} tickLine={false} tick={{fontSize:11,fill:"#94a3b8",fontWeight:"bold"}} dx={-10}/>
                  <Tooltip content={<TooltipEvolucao/>}/>
                  <Bar dataKey="nota" fill="url(#gNota)" radius={[10,10,0,0]} barSize={50} name="Nota Total" stroke="#6366f1" strokeWidth={1}/>
                  <Line type="monotone" dataKey="nota" stroke="#6366f1" strokeWidth={3} dot={{r:6,fill:"#6366f1",strokeWidth:3,stroke:"#fff"}} activeDot={{r:8}} name="Nota Total"/>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico: 5 Competências ENEM */}
          {tipoFiltro === "enem" && competenciasData.length > 0 && (
            <>
              {/* Barras agrupadas por competência ao longo do tempo */}
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
                <div className="absolute top-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full blur-[120px] -ml-32 -mt-32 pointer-events-none"/>
                <div className="relative z-10 mb-8">
                  <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-rose-500"/> Evolução por Competência
                  </h3>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">ENEM • Escala 0–200</p>
                </div>
                {/* Legenda das competências */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {COMP_SHORT.map((c,i) => (
                    <div key={c} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{backgroundColor:COMP_COLORS[i]}}/>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{c}</span>
                    </div>
                  ))}
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={competenciasData} margin={{top:20,right:30,left:0,bottom:20}}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5}/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:11,fill:"#94a3b8",fontWeight:"bold"}} dy={10}/>
                      <YAxis domain={[0,200]} axisLine={false} tickLine={false} tick={{fontSize:11,fill:"#94a3b8",fontWeight:"bold"}} dx={-10} ticks={STEPS_NOTA}/>
                      <Tooltip content={<TooltipCompetencias/>}/>
                      <Legend verticalAlign="top" height={40} iconType="circle"/>
                      {COMP_SHORT.map((c,i)=>(
                        <Bar key={c} dataKey={c} name={COMP_LABELS[i]} fill={COMP_COLORS[i]} radius={[6,6,0,0]} barSize={18} opacity={0.85}/>
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Radar: Perfil médio das competências */}
              {concluidasEnem.some(r => r.competencia_1 != null) && (
                <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
                  <div className="mb-8">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                      <PieChart className="w-6 h-6 text-amber-500"/> Perfil das Competências
                    </h3>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Média acumulada por competência</p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {/* Radar chart */}
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={mediaCompetencias}>
                          <PolarGrid stroke="#e2e8f0" strokeOpacity={0.5}/>
                          <PolarAngleAxis dataKey="subject" tick={{fontSize:12,fontWeight:"bold",fill:"#64748b"}}/>
                          <PolarRadiusAxis domain={[0,200]} tick={{fontSize:9,fill:"#94a3b8"}} tickCount={6}/>
                          <Radar name="Média" dataKey="media" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2}/>
                          <Tooltip formatter={(v:any)=>[`${v}/200`,"Média"]}/>
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Barras de média por competência */}
                    <div className="space-y-4">
                      {mediaCompetencias.map((c,i) => (
                        <div key={c.subject}>
                          <div className="flex justify-between items-center mb-1.5">
                            <div>
                              <span className="text-xs font-black text-slate-700 dark:text-white">{c.subject}</span>
                              <span className="text-[10px] text-slate-400 font-medium ml-2 hidden sm:inline">{COMP_LABELS[i].split("•")[1]?.trim()}</span>
                            </div>
                            <span className="text-sm font-black" style={{color:COMP_COLORS[i]}}>{c.media}/200</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div initial={{width:0}} animate={{width:`${(c.media/200)*100}%`}} transition={{duration:0.8,delay:i*0.1}}
                              className="h-full rounded-full" style={{backgroundColor:COMP_COLORS[i]}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Histórico */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-indigo-500"/> Histórico
              </h3>
              <span className="text-xs font-black text-slate-400 bg-slate-100 dark:bg-[#2C2C2E] px-3 py-1.5 rounded-full uppercase tracking-widest">{concluidas.length} registros</span>
            </div>
            <div className="space-y-3">
              {concluidas.map(r => (
                <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-[#2C2C2E]/60 rounded-2xl px-5 py-4 border border-slate-100 dark:border-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 dark:text-white text-sm truncate">{r.titulo}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(new Date(r.dataCriacao),"dd/MM/yyyy",{locale:ptBR})}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg">✍️ {r.nota}/1000</span>
                    {(r.tipo_prova||"enem")==="enem"&&r.competencia_1!=null&&(
                      <div className="flex gap-1">
                        {COMP_KEYS.map((k,i)=>(
                          <span key={k} className="px-1.5 py-0.5 rounded text-[10px] font-black" style={{backgroundColor:`${COMP_COLORS[i]}20`,color:COMP_COLORS[i]}}>
                            {COMP_SHORT[i]}: {(r[k] as number)||0}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
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
  const [form, setForm] = useState({ temaId:"", titulo:"", tema:"", imagens:[] as string[] });

  // Modal Lançar Nota
  const [notaForm, setNotaForm] = useState<{
    id:string; nota:string; tipo_prova:TipoProva;
    c1:string; c2:string; c3:string; c4:string; c5:string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  const mapStatusFront = (dbStatus: string): StudentKanbanStatus => {
    if (["PROPOSTA","A_FAZER","planejamento"].includes(dbStatus)) return "proposta";
    if (["FAZENDO","EM_AVALIACAO","andamento"].includes(dbStatus)) return "fazendo";
    if (["CONCLUIDA","concluida","DEVOLVIDA"].includes(dbStatus)) return "concluida";
    if (["ANALISADA","analisada"].includes(dbStatus)) return "analisada";
    return "proposta";
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const me = user?.id;
      if (me) {
        const { data: dtR } = await supabase
          .from("redacoes_aluno")
          .select(`id,status,tema_id,pdf_url,nota,created_at,tipo_prova,competencia_1,competencia_2,competencia_3,competencia_4,competencia_5,temas_redacao(titulo,descricao_html)`)
          .eq("aluno_id", me)
          .order("created_at", { ascending: false });
        if (dtR) {
          setRedacoes(dtR.map(r => ({
            id:r.id, studentId:me,
            titulo:(r.temas_redacao as any)?.titulo||"Minha Redação",
            temaId:r.tema_id,
            tema:(r.temas_redacao as any)?.descricao_html||"",
            dataCriacao:r.created_at,
            status:mapStatusFront(r.status),
            imagens:r.pdf_url?[r.pdf_url]:[],
            nota:r.nota,
            tipo_prova:(r.tipo_prova||"enem") as TipoProva,
            competencia_1:r.competencia_1,
            competencia_2:r.competencia_2,
            competencia_3:r.competencia_3,
            competencia_4:r.competencia_4,
            competencia_5:r.competencia_5,
          })));
        }
      }
      setIsLoaded(true);
    };
    fetchData();
    const ch = supabase.channel("redacoes_c_changes")
      .on("postgres_changes", { event:"*", schema:"public", table:"redacoes_aluno" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNew = () => { setForm({ temaId:"", titulo:"", tema:"", imagens:[] }); setIsModalOpen(true); };

  const saveRedacao = async () => {
    if (!form.titulo.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    let finalTemaId = form.temaId;
    if (!finalTemaId) {
      const { data: newTema } = await supabase.from("temas_redacao").insert([{ admin_id:user?.id, titulo:form.titulo, descricao_html:form.tema, is_published:false }]).select().single();
      if (newTema) finalTemaId = newTema.id;
    }
    const { data: rAl } = await supabase.from("redacoes_aluno").insert([{ aluno_id:user?.id, tema_id:finalTemaId, pdf_url:form.imagens[0]||null, status:"PROPOSTA", tipo_prova:"enem" }]).select().single();
    if (rAl) setRedacoes([{ id:rAl.id, studentId:user?.id||"", titulo:form.titulo, tema:form.tema, dataCriacao:rAl.created_at, status:"proposta", imagens:form.imagens, tipo_prova:"enem" }, ...redacoes]);
    setForm({ temaId:"", titulo:"", tema:"", imagens:[] });
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
      setRedacoes(prev => prev.map(r => r.id === activeId ? { ...r, status: targetStatus } : r));
      await supabase.from("redacoes_aluno").update({ status: targetStatus.toUpperCase() }).eq("id", activeId);
      // Abre automaticamente o modal de nota ao mover para "Corrigida" sem nota
      if (targetStatus === "concluida" && cur.nota == null) {
        setNotaForm({
          id: cur.id,
          nota: "",
          tipo_prova: (cur.tipo_prova || "enem") as TipoProva,
          c1: "", c2: "", c3: "", c4: "", c5: ""
        });
      }
    }
  };

  const handleAdvance = async (r: RedacaoGlobal) => {
    const next: StudentKanbanStatus =
        r.status === "proposta" ? "fazendo" :
        r.status === "fazendo" ? "concluida" :
        "analisada";
    if (r.status === "analisada") return;
    setRedacoes(prev => prev.map(x => x.id === r.id ? { ...x, status: next } : x));
    await supabase.from("redacoes_aluno").update({ status: next.toUpperCase() }).eq("id", r.id);
    // Abre automaticamente o modal de nota ao avançar para "Corrigida" sem nota
    if (next === "concluida" && r.nota == null) {
      setNotaForm({
        id: r.id,
        nota: "",
        tipo_prova: (r.tipo_prova || "enem") as TipoProva,
        c1: "", c2: "", c3: "", c4: "", c5: ""
      });
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
    const c1=parseInt(notaForm.c1)||0, c2=parseInt(notaForm.c2)||0, c3=parseInt(notaForm.c3)||0;
    const c4=parseInt(notaForm.c4)||0, c5=parseInt(notaForm.c5)||0;
    if (isEnem) {
      totalNota = c1+c2+c3+c4+c5;
    } else {
      totalNota = parseInt(notaForm.nota)||0;
    }
    const payload: any = {
      nota: totalNota,
      tipo_prova: notaForm.tipo_prova,
    };
    if (isEnem) {
      payload.competencia_1 = c1;
      payload.competencia_2 = c2;
      payload.competencia_3 = c3;
      payload.competencia_4 = c4;
      payload.competencia_5 = c5;
    }
    await supabase.from("redacoes_aluno").update(payload).eq("id", notaForm.id);
    setRedacoes(prev => prev.map(r => r.id === notaForm.id ? { ...r, nota:totalNota, tipo_prova:notaForm.tipo_prova, competencia_1:isEnem?c1:null, competencia_2:isEnem?c2:null, competencia_3:isEnem?c3:null, competencia_4:isEnem?c4:null, competencia_5:isEnem?c5:null } : r));
    setNotaForm(null);
  };

  if (!isLoaded) return null;

  const selectedCol = selectedRedacao ? COLUMNS.find(c => c.id === selectedRedacao.status)! : COLUMNS[0];

  return (
    <div className="max-w-[1600px] mx-auto pb-20 animate-in fade-in duration-500 space-y-8 px-4 md:px-0">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
        <div className="relative">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#1B2B5E]/10 rounded-full blur-[100px] pointer-events-none"/>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4 relative z-10">
            <div className="bg-[#1B2B5E] p-3 rounded-[1.2rem] shadow-lg shadow-[#1B2B5E]/20"><PenTool className="w-8 h-8 text-white"/></div>
            Minha Bancada
          </h1>
          <div className="flex items-center gap-3 mt-3 relative z-10">
            <div className="h-1 w-12 bg-[#F97316] rounded-full"/>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em]">Asas para o Enem! Acompanhe suas notas.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={openNew}
            className="flex items-center gap-2 bg-[#F97316] hover:bg-orange-600 active:scale-95 transition-all text-white font-black px-7 py-4 rounded-2xl shadow-xl shadow-orange-500/20 text-sm uppercase tracking-widest">
            <Plus className="w-5 h-5"/> <span className="hidden sm:inline">Nova Proposta</span>
          </button>
        </div>
      </header>

      {/* Toggle Bancada / Evolução */}
      <div className="bg-white dark:bg-[#1C1C1E] p-2 rounded-[2rem] flex items-center w-full border border-slate-100 dark:border-[#2C2C2E] shadow-sm relative z-10">
        <button onClick={()=>{setActiveTab("bancada");localStorage.setItem("redacao_activeTab","bancada");}}
          className={`flex-1 py-4 text-sm font-black rounded-[1.8rem] transition-all duration-200 uppercase tracking-[0.18em] ${activeTab==="bancada"?"bg-[#1B2B5E] text-white shadow-lg shadow-[#1B2B5E]/20":"text-slate-400 dark:text-[#A1A1AA] hover:text-slate-600 dark:hover:text-white"}`}>
          Minha Bancada
        </button>
        <button onClick={()=>{setActiveTab("evolucao");localStorage.setItem("redacao_activeTab","evolucao");}}
          className={`flex-1 py-4 text-sm font-black rounded-[1.8rem] transition-all duration-200 uppercase tracking-[0.18em] ${activeTab==="evolucao"?"bg-[#1B2B5E] text-white shadow-lg shadow-[#1B2B5E]/20":"text-slate-400 dark:text-[#A1A1AA] hover:text-slate-600 dark:hover:text-white"}`}>
          Evolução
        </button>
      </div>

      {/* Conteúdo por Tab */}
      {activeTab === "evolucao" && (
        <div className="animate-in fade-in duration-500">
          <EvolucaoRedacao redacoes={redacoes}/>
        </div>
      )}
      
      {activeTab === "bancada" && (
        <div className="animate-in fade-in duration-500 space-y-8">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="w-full">
              {/* Kanban */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {COLUMNS.map(col=>(
                  <KanbanColumn key={col.id} col={col} items={redacoes.filter(r=>r.status===col.id)}
                    onDelete={deleteRedacao}
                    onLancarNota={r=>setNotaForm({id:r.id,nota:String(r.nota||""),tipo_prova:(r.tipo_prova||"enem") as TipoProva,c1:String(r.competencia_1||""),c2:String(r.competencia_2||""),c3:String(r.competencia_3||""),c4:String(r.competencia_4||""),c5:String(r.competencia_5||"")})}
                    onOpenDetalhe={setSelectedRedacao}
                    onAdvance={handleAdvance}
                  />
                ))}
              </div>
            </div>

            <DragOverlay>
              {activeDragId?(
                <div className="opacity-80 rotate-2 scale-105 pointer-events-none">
                  <RedacaoCard
                    redacao={redacoes.find(r=>r.id===activeDragId)!}
                    col={COLUMNS.find(c=>c.id===redacoes.find(r=>r.id===activeDragId)?.status)!}
                    onDelete={()=>{}} onLancarNota={()=>{}} onOpenDetalhe={()=>{}}
                  />
                </div>
              ):null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* Modal Detalhes da Proposta */}
      <AnimatePresence>
        {selectedRedacao&&(
          <DetalheModal redacao={selectedRedacao} col={selectedCol} onClose={()=>setSelectedRedacao(null)}
            onDelete={deleteRedacao} onLancarNota={r=>setNotaForm({id:r.id,nota:String(r.nota||""),tipo_prova:(r.tipo_prova||"enem") as TipoProva,c1:String(r.competencia_1||""),c2:String(r.competencia_2||""),c3:String(r.competencia_3||""),c4:String(r.competencia_4||""),c5:String(r.competencia_5||"")})}
          />
        )}
      </AnimatePresence>

      {/* Modal Lançar Nota (REFATORADO) */}
      <AnimatePresence>
        {notaForm&&(
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setNotaForm(null)}>
            <motion.div initial={{scale:0.95,y:20,opacity:0}} animate={{scale:1,y:0,opacity:1}} exit={{scale:0.95,y:20,opacity:0}}
              className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative border border-slate-100 dark:border-[#2C2C2E] max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={e=>e.stopPropagation()}>
              <button onClick={()=>setNotaForm(null)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400">
                <X className="w-5 h-5" />
              </button>
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6"><Award className="w-7 h-7"/></div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Lançar Nota</h2>
              <p className="text-sm text-slate-500 mb-6">Selecione a prova e registre o desempenho.</p>

              {/* Seletor de Tipo de Prova */}
              <div className="mb-6">
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-3">Tipo de Prova</label>
                <div className="grid grid-cols-5 gap-2">
                  {TIPOS_PROVA.map(t=>(
                    <button key={t.value} type="button" onClick={()=>setNotaForm({...notaForm,tipo_prova:t.value})}
                      className={`py-3 px-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-center ${notaForm.tipo_prova===t.value?"bg-indigo-600 text-white shadow-lg shadow-indigo-600/20":"bg-slate-50 dark:bg-[#2C2C2E] text-slate-500 hover:text-slate-700"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campos ENEM */}
              {notaForm.tipo_prova==="enem"&&(
                <div className="space-y-4 mb-6">
                  <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Nota Automática</p>
                    <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                      {([notaForm.c1,notaForm.c2,notaForm.c3,notaForm.c4,notaForm.c5].reduce((a,v)=>a+(parseInt(v)||0),0))}
                      <span className="text-base font-bold opacity-50">/1000</span>
                    </p>
                    <p className="text-[10px] text-indigo-400 mt-1">Soma automática das 5 competências</p>
                  </div>
                  {["c1","c2","c3","c4","c5"].map((k,i)=>(
                    <div key={k} className="space-y-2">
                      <label className="text-[10px] font-black tracking-widest uppercase flex items-center gap-2" style={{color:COMP_COLORS[i]}}>
                        <span className="w-3 h-3 rounded-full" style={{backgroundColor:COMP_COLORS[i]}}></span>
                        {COMP_LABELS[i]}
                      </label>
                      <div className="flex gap-2 items-center">
                        <input type="range" min="0" max="200" step="20"
                          value={parseInt((notaForm as any)[k])||0}
                          onChange={e=>setNotaForm({...notaForm,[k]:e.target.value})}
                          className="flex-1 accent-indigo-600"/>
                        <span className="w-16 text-center text-lg font-black text-slate-800 dark:text-white bg-slate-50 dark:bg-[#2C2C2E] rounded-xl py-2" style={{color:COMP_COLORS[i]}}>
                          {parseInt((notaForm as any)[k])||0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Campo para outras provas */}
              {notaForm.tipo_prova!=="enem"&&(
                <div className="space-y-2 mb-6">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Nota Alcançada</label>
                  <input type="number" min="0" max="10000"
                    value={notaForm.nota}
                    onChange={e=>setNotaForm({...notaForm,nota:e.target.value})}
                    className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-transparent rounded-2xl px-5 py-4 text-2xl font-black text-center focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="Ex: 840"/>
                </div>
              )}

              <button onClick={confirmarNota}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all uppercase tracking-widest text-sm">
                Confirmar e Salvar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Nova Proposta (Livre) */}
      <AnimatePresence>
        {isModalOpen&&(
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setIsModalOpen(false)}>
            <motion.div initial={{scale:0.95,y:20,opacity:0}} animate={{scale:1,y:0,opacity:1}} exit={{scale:0.95,y:20,opacity:0}}
              className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative border border-slate-100 dark:border-[#2C2C2E] max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={e=>e.stopPropagation()}>
              <button onClick={()=>setIsModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400">
                <X className="w-5 h-5" />
              </button>
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6"><Lightbulb className="w-7 h-7"/></div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Nova Proposta</h2>
              <p className="text-sm text-slate-500 mb-8">Crie uma proposta de tema livre.</p>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Título</label>
                  <input type="text" value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})}
                    className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-transparent rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="Título da proposta"/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Tema Base</label>
                  <textarea rows={4} value={form.tema} onChange={e=>setForm({...form,tema:e.target.value})}
                    className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-transparent rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-indigo-100 outline-none resize-none transition-all"
                    placeholder="Descreva brevemente o tema proposto…"/>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Imagens Manuscritas</label>
                  <div className="grid grid-cols-4 gap-4">
                    <label className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-[#3A3A3C] rounded-2xl cursor-pointer hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-[#2C2C2E] transition-all group">
                      <Plus className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 mb-1"/>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload}/>
                    </label>
                    {form.imagens.map((img,i)=>(
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group">
                        <img src={img} alt={`Anexo ${i}`} className="w-full h-full object-cover"/>
                        <button onClick={()=>setForm(f=>({...f,imagens:f.imagens.filter((_,idx)=>idx!==i)}))}
                          className="absolute inset-0 m-auto w-8 h-8 flex items-center justify-center bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={saveRedacao}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all uppercase tracking-widest text-sm flex justify-center items-center gap-2 mt-4">
                  Criar Proposta <ArrowRight className="w-4 h-4"/>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
