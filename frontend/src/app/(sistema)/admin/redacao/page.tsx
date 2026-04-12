"use client";

import React, { useState, useEffect } from "react";
import {
  PenTool, Plus, Trash2, Lightbulb, Star, Calendar
} from "lucide-react";
import { format as formatDate } from "date-fns";
import { createClient } from "@/utils/supabase/client";

interface TemaProposta {
  id: string;
  titulo: string;
  tema: string;
  dataCriacao: string;
}

export default function AdminRedacaoPanel() {
  const supabase = createClient();
  const [temas, setTemas] = useState<TemaProposta[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [temaForm, setTemaForm] = useState({ titulo: "", tema: "" });

  useEffect(() => {
    const fetchTemas = async () => {
      const { data } = await supabase.from('temas_redacao').select('*').order('created_at', { ascending: false });
      if(data) {
         setTemas(data.map((t: any) => ({
            id: t.id,
            titulo: t.titulo,
            tema: t.descricao_html || t.eixo_tematico || '',
            dataCriacao: t.created_at
         })));
      }
      setIsLoaded(true);
    };
    fetchTemas();
  }, []);

  const handleSaveTema = async () => {
     if(!temaForm.titulo.trim() || !temaForm.tema.trim()) return;

     const { data: { user } } = await supabase.auth.getUser();
     const newRow = {
         admin_id: user?.id || null,
         titulo: temaForm.titulo,
         descricao_html: temaForm.tema,
         is_published: true
     };

     const { data, error } = await supabase.from('temas_redacao').insert([newRow]).select().single();
     if(data && !error) {
         setTemas([{
            id: data.id, titulo: data.titulo, tema: data.descricao_html || '', dataCriacao: data.created_at
         }, ...temas]);
     }
     setTemaForm({ titulo: "", tema: "" });
  };

  const handleDeleteTema = async (id: string) => {
     await supabase.from('temas_redacao').delete().eq('id', id);
     setTemas(temas.filter(t => t.id !== id));
  };

  if(!isLoaded) return null;

  return (
    <div className="max-w-[1600px] mx-auto pb-32 animate-in fade-in duration-500 space-y-10 font-sans">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-[1.2rem] shadow-lg shadow-indigo-600/20">
              <PenTool className="w-8 h-8 text-white" />
            </div>
            Central de Redação
          </h1>
          <p className="text-slate-500 dark:text-[#A1A1AA] mt-2 font-medium text-lg">
             Crie e gerencie os temas oficiais disparados para a comunidade.
          </p>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-8 animate-in slide-in-from-bottom-4 duration-500">
         <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] h-max sticky top-8">
            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-500"/> Lançar Proposta</h2>
            
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Título da Proposta</label>
                  <input 
                     value={temaForm.titulo} onChange={e => setTemaForm({...temaForm, titulo: e.target.value})}
                     type="text" className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="Ex: Impactos da IA..." 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Texto Motivador (Descrição)</label>
                  <textarea 
                     value={temaForm.tema} onChange={e => setTemaForm({...temaForm, tema: e.target.value})}
                     rows={6} className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-indigo-100 outline-none resize-none" placeholder="Escreva o contexto da proposta..." 
                  />
               </div>
               <button onClick={handleSaveTema} className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all uppercase tracking-widest text-xs">
                  Publicar Tema Oficial
               </button>
            </div>
         </div>

         <div className="grid sm:grid-cols-2 gap-5 content-start">
            {temas.length === 0 && (
               <div className="sm:col-span-2 py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-[#2C2C2E] rounded-[3rem]">
                  <Lightbulb className="w-12 h-12 text-slate-300 dark:text-[#3A3A3C] mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Nenhum tema criado no Banco.</p>
               </div>
            )}
            {temas.map(t => (
               <div key={t.id} className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col group">
                  <div className="flex justify-between items-start mb-4">
                     <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Star className="w-3 h-3 fill-current" /> Oficial</div>
                     <button onClick={() => handleDeleteTema(t.id)} className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-100"><Trash2 className="w-4 h-4"/></button>
                  </div>
                  <h3 className="font-black text-lg text-slate-800 dark:text-white leading-tight mb-2">{t.titulo}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-4 leading-relaxed mb-6">{t.tema}</p>
                  
                  <div className="mt-auto border-t border-slate-100 dark:border-[#2C2C2E] pt-4 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                     <Calendar className="w-3.5 h-3.5" /> Criado em {formatDate(new Date(t.dataCriacao), "dd/MM/yyyy")}
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
