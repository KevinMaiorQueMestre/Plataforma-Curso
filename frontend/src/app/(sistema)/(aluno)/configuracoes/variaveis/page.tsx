"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, X, Save, Trash2, Database, ListChecks, Calendar, Palette, Book, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { getDisciplinas, getConteudos, addDisciplina, deleteDisciplina, addConteudo, deleteConteudo, Disciplina, Conteudo } from "@/lib/db/disciplinas";
import { getPreferences, updatePreferences } from "@/lib/db/preferences";

export default function VariaveisKevQuestPage() {
  const router = useRouter();
  
  // Estados para as configurações (espelhando a lógica do KevQuest)
  const [cfgProvas, setCfgProvas] = useState<string[]>([]);
  const [cfgCores, setCfgCores] = useState<string[]>([]);
  const [cfgMotivos, setCfgMotivos] = useState<string[]>([]);
  const [cfgAnos, setCfgAnos] = useState<string[]>([]);

  // Estados dos inputs de adição
  const [newProva, setNewProva] = useState("");
  const [newCor, setNewCor] = useState("");
  const [newMotivo, setNewMotivo] = useState("");
  const [newAno, setNewAno] = useState("");
  
  const [dbDisciplinas, setDbDisciplinas] = useState<Disciplina[]>([]);
  const [newDisciplina, setNewDisciplina] = useState("");

  // Carrega configurações do Banco
  useEffect(() => {
    const loadSettings = async () => {
      const prefs = await getPreferences();
      setCfgProvas(prefs.provas || []);
      setCfgCores(prefs.cores || []);
      setCfgMotivos(prefs.motivos || []);
      setCfgAnos(prefs.anos || []);

      // Carregar Disciplinas Iniciais
      const dr = await getDisciplinas();
      setDbDisciplinas(dr);
    };
    
    loadSettings();
  }, []);

  const handleSave = async () => {
    const data = {
      provas: cfgProvas,
      cores: cfgCores,
      motivos: cfgMotivos,
      anos: cfgAnos
    };
    const ok = await updatePreferences(data);
    if (ok) {
      toast.success("Configurações do KevQuest salvas com sucesso!");
      router.push("/configuracoes");
    } else {
      toast.error("Erro ao salvar as configurações no banco.");
    }
  };

  const addItem = (list: string[], setList: (l: string[]) => void, value: string, setValue: (v: string) => void) => {
    if (!value.trim()) return;
    if (list.includes(value)) {
      toast.error("Este item já existe.");
      return;
    }
    setList([...list, value.trim()]);
    setValue("");
  };

  const removeItem = (list: string[], setList: (l: string[]) => void, index: number) => {
    const newList = [...list];
    newList.splice(index, 1);
    setList(newList);
  };

  const handleAddDisciplina = async () => {
    if (!newDisciplina.trim()) return;
    const added = await addDisciplina(newDisciplina.trim());
    if (added) {
      setDbDisciplinas(prev => [...prev, added]);
      setNewDisciplina("");
      toast.success("Disciplina adicionada com sucesso!");
    } else {
      toast.error("Erro ao adicionar disciplina.");
    }
  };

  const handleDeleteDisciplina = async (id: string) => {
    const ok = await deleteDisciplina(id);
    if (ok) {
      setDbDisciplinas(prev => prev.filter(d => d.id !== id));
      if (selectedDisciplinaId === id) setSelectedDisciplinaId("");
      toast.success("Disciplina excluída!");
    } else {
      toast.error("Erro ao excluir disciplina.");
    }
  };

  const handleAddConteudo = async (disciplinaId: string, nomeConteudo: string, clear: () => void) => {
    if (!nomeConteudo.trim()) return;
    const added = await addConteudo(disciplinaId, nomeConteudo.trim());
    if (added) {
      setDbDisciplinas(dbDisciplinas.map(d => {
        if (d.id === disciplinaId) {
          return { ...d, conteudos: [...(d.conteudos || []), added] };
        }
        return d;
      }));
      clear();
      toast.success("Conteúdo adicionado com sucesso!");
    } else {
      toast.error("Erro ao adicionar conteúdo.");
    }
  };

  const handleDeleteConteudo = async (disciplinaId: string, id: string) => {
    const ok = await deleteConteudo(id);
    if (ok) {
      setDbDisciplinas(dbDisciplinas.map(d => {
        if (d.id === disciplinaId) {
          return { ...d, conteudos: (d.conteudos || []).filter(c => c.id !== id) };
        }
        return d;
      }));
      toast.success("Conteúdo excluído!");
    } else {
      toast.error("Erro ao excluir conteúdo.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-5xl mx-auto pb-20">
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.push("/configuracoes")}
          className="p-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4 relative z-10">
          <div className="bg-amber-500 p-3 rounded-[1.2rem] shadow-lg shadow-amber-500/20">
            <Database className="w-8 h-8 text-white" />
          </div>
          Variáveis Padrão
        </h1>
        <div className="flex items-center gap-3 mt-3 relative z-10">
          <div className="h-1 w-12 bg-amber-500 rounded-full"></div>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em]">Personalize os motores da sua plataforma</p>
        </div>
      </header>

      <div className="mt-8 pt-4 border-t border-slate-200 dark:border-[#2C2C2E]">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-teal-600 p-2.5 rounded-[1rem] shadow-md shadow-teal-600/20">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Grade Curricular</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Sua Grade de Matérias Ativas</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col gap-4 mb-6">
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Adicionar Disciplina Particular</h3>
            <div className="flex flex-col md:flex-row gap-2">
              <input 
                type="text" 
                value={newDisciplina}
                onChange={e => setNewDisciplina(e.target.value)}
                placeholder="Ex: Física, Cálculo I..."
                onKeyDown={(e) => e.key === "Enter" && handleAddDisciplina()}
                className="flex-1 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-transparent focus:border-teal-500/50 rounded-xl py-3 px-5 text-sm font-bold transition-all outline-none"
              />
              <button onClick={handleAddDisciplina} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-sm active:scale-95">
                Adicionar
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">As matérias globais podem não aparecer aqui para deleção se ainda não foram registradas localmente.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dbDisciplinas.map((disc, idx) => (
            <DisciplinaCard 
              key={disc.id || idx}
              disciplina={disc}
              onDelete={() => handleDeleteDisciplina(disc.id)}
              onAddConteudo={handleAddConteudo}
              onDeleteConteudo={handleDeleteConteudo}
            />
          ))}

          {dbDisciplinas.length === 0 && (
            <div className="col-span-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-lg font-bold text-slate-500 mb-1">Nenhuma Disciplina Mapeada</h3>
              <p className="text-sm text-slate-400 max-w-md">Para organizar seus estudos, adicione as matérias ou aguarde as disciplinas base importadas globalmente.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-10 border-t border-slate-200 dark:border-[#2C2C2E]">
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 border border-slate-100 dark:border-[#2C2C2E] shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-5 h-5 text-indigo-500" />
            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs">Bancos & Provas</h3>
          </div>
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newProva}
              onChange={e => setNewProva(e.target.value)}
              placeholder="Ex: FUVEST 2025"
              className="flex-1 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button onClick={() => addItem(cfgProvas, setCfgProvas, newProva, setNewProva)} className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {cfgProvas.map((p, i) => (
              <span key={i} className="flex items-center gap-2 bg-slate-100 dark:bg-[#2C2C2E] text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-[#3A3A3C]">
                {p}
                <button onClick={() => removeItem(cfgProvas, setCfgProvas, i)} className="text-slate-400 hover:text-rose-500"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        </div>

        {/* MOTIVOS (DIAGNÓSTICO) */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 border border-slate-100 dark:border-[#2C2C2E] shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <ListChecks className="w-5 h-5 text-amber-500" />
            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs">Motivos de Erro (Diagnóstico)</h3>
          </div>
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newMotivo}
              onChange={e => setNewMotivo(e.target.value)}
              placeholder="Ex: Bobeira na conta"
              className="flex-1 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <button onClick={() => addItem(cfgMotivos, setCfgMotivos, newMotivo, setNewMotivo)} className="bg-amber-500 text-white p-2 rounded-xl hover:bg-amber-600 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {cfgMotivos.map((m, i) => (
              <span key={i} className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-100 dark:border-amber-500/20">
                {m}
                <button onClick={() => removeItem(cfgMotivos, setCfgMotivos, i)} className="text-amber-400 hover:text-rose-500"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        </div>

        {/* ANOS */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 border border-slate-100 dark:border-[#2C2C2E] shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-teal-500" />
            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs">Anos de Prova</h3>
          </div>
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newAno}
              onChange={e => setNewAno(e.target.value)}
              placeholder="Ex: 2026"
              className="flex-1 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <button onClick={() => addItem(cfgAnos, setCfgAnos, newAno, setNewAno)} className="bg-teal-600 text-white p-2 rounded-xl hover:bg-teal-700 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {cfgAnos.map((a, i) => (
              <span key={i} className="flex items-center gap-2 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-teal-100 dark:border-teal-500/20">
                {a}
                <button onClick={() => removeItem(cfgAnos, setCfgAnos, i)} className="text-teal-400 hover:text-rose-500"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        </div>

        {/* CORES */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 border border-slate-100 dark:border-[#2C2C2E] shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-5 h-5 text-rose-500" />
            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs">Cores de Caderno</h3>
          </div>
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newCor}
              onChange={e => setNewCor(e.target.value)}
              placeholder="Ex: Cinza"
              className="flex-1 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            <button onClick={() => addItem(cfgCores, setCfgCores, newCor, setNewCor)} className="bg-rose-500 text-white p-2 rounded-xl hover:bg-rose-600 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {cfgCores.map((c, i) => (
              <span key={i} className="flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-100 dark:border-rose-500/20">
                {c}
                <button onClick={() => removeItem(cfgCores, setCfgCores, i)} className="text-rose-400 hover:text-rose-500"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        </div>

      </div>

      <div className="pt-10 flex justify-end gap-4">
        <button 
          onClick={() => router.push("/configuracoes")}
          className="px-8 py-4 font-bold text-slate-500 dark:text-[#A1A1AA] hover:bg-slate-100 dark:hover:bg-[#2C2C2E] rounded-2xl transition-all"
        >
          Cancelar
        </button>
        <button 
          onClick={handleSave}
          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black px-12 py-4 rounded-2xl shadow-xl shadow-slate-900/10 flex items-center gap-2 active:scale-95 transition-all text-lg"
        >
          <Save className="w-5 h-5" /> Salvar Alterações
        </button>
      </div>

    </div>
  );
}

function DisciplinaCard({ disciplina, onDelete, onAddConteudo, onDeleteConteudo }: any) {
  const [newConteudo, setNewConteudo] = useState("");

  const handleAdd = () => {
    onAddConteudo(disciplina.id, newConteudo, () => setNewConteudo(""));
  };

  const conteudos = [...(disciplina.conteudos || [])].sort((a,b) => a.ordem - b.ordem);

  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-5 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col h-[400px]">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#2C2C2E] mb-4">
         <div className="flex items-center gap-3">
            <div className="w-3 h-8 rounded-full shadow-sm" style={{ backgroundColor: disciplina.cor_hex || "#6366F1" }} />
            <h3 className="text-lg font-black text-slate-800 dark:text-white truncate" title={disciplina.nome}>{disciplina.nome}</h3>
         </div>
         <button 
           onClick={onDelete}
           className="text-slate-300 hover:text-red-500 transition-colors p-2"
           title="Deletar Disciplina"
         >
           <Trash2 className="w-4 h-4" />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {conteudos.map((cont: any) => (
          <div key={cont.id} className="flex flex-col bg-slate-50 dark:bg-[#2C2C2E] rounded-xl p-3 group">
             <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex-1 leading-snug">{cont.nome}</span>
                <button 
                  onClick={() => onDeleteConteudo(disciplina.id, cont.id)} 
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1 -mt-1 -mr-1"
                >
                  <X className="w-3 h-3" />
                </button>
             </div>
          </div>
        ))}
        {conteudos.length === 0 && <span className="text-xs text-slate-400 italic">Nenhum conteúdo listado</span>}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#2C2C2E]">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newConteudo}
            onChange={(e) => setNewConteudo(e.target.value)}
            placeholder="Novo conteúdo..."
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 min-w-0 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-transparent focus:border-teal-500/50 rounded-xl py-2 px-3 text-xs font-bold transition-all outline-none"
          />
          <button onClick={handleAdd} className="bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 p-2 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors flex-shrink-0 border border-teal-100 dark:border-transparent">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
