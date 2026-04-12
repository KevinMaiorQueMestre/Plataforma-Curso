"use client";

import { useState, useEffect } from "react";
import { Settings, Plus, X, Loader2, Save, BookOpen, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function GlobalConfigPage() {
  const supabase = createClient();
  
  // Variables State
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [newProva, setNewProva] = useState("");
  const [newAno, setNewAno] = useState("");
  const [newCor, setNewCor] = useState("");
  const [newMotivo, setNewMotivo] = useState("");

  // Disciplinas State
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [newDisciplina, setNewDisciplina] = useState("");

  const loadAll = async () => {
    setIsLoading(true);
    // Fetch Configs
    const { data: cfgData } = await supabase
      .from("plataforma_config")
      .select("*")
      .eq("id", "11111111-1111-1111-1111-111111111111")
      .single();
    
    if (cfgData) setConfig(cfgData);

    // Fetch Disciplinas Globais
    const { data: discData, error: discError } = await supabase
      .from("disciplinas")
      .select("*, conteudos(*)")
      .is("user_id", null)
      .order("ordem", { ascending: true });

    if (discData) setDisciplinas(discData);
    if (discError) toast.error("Erro carregrando disciplinas: " + discError.message);

    setIsLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Handlers for Global Configs
  const handleAddItem = (field: "provas" | "anos" | "cores" | "motivos", value: string, setter: any) => {
    if (!value.trim() || !config) return;
    const currentArray = config[field] || [];
    if (!currentArray.includes(value.trim())) {
      setConfig({ ...config, [field]: [...currentArray, value.trim()] });
    }
    setter("");
  };

  const handleRemoveItem = (field: "provas" | "anos" | "cores" | "motivos", valueToRemove: string) => {
    if (!config) return;
    const currentArray = config[field] || [];
    setConfig({ ...config, [field]: currentArray.filter((v: string) => v !== valueToRemove) });
  };

  const saveConfig = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("plataforma_config")
      .update({
        provas: config.provas,
        anos: config.anos,
        cores: config.cores,
        motivos: config.motivos
      })
      .eq("id", "11111111-1111-1111-1111-111111111111");

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Variáveis globais atualizadas com sucesso!");
    }
    setIsSaving(false);
  };

  // Handlers for Disciplinas Globais
  const handleAddDisciplina = async () => {
    if (!newDisciplina.trim()) return;
    const { data, error } = await supabase
      .from("disciplinas")
      .insert({
        nome: newDisciplina.trim(),
        cor_hex: "#6366F1",
        ordem: disciplinas.length,
        user_id: null // Configura como padrão global
      })
      .select("*, conteudos(*)")
      .single();

    if (error) {
      toast.error("Erro ao adicionar disciplina.");
    } else if (data) {
      setDisciplinas([...disciplinas, data]);
      setNewDisciplina("");
      toast.success("Disciplina adicionada!");
    }
  };

  const handleDeleteDisciplina = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja apagar a disciplina padrão ${nome}? Os dados com essa ID não serão revogados dos alunos que já os copiaram, mas ficará indisponível para novos alunos.`)) return;

    const { error } = await supabase
      .from("disciplinas")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir: A disciplina já pode ter relacionamentos registrados por alunos.");
    } else {
      setDisciplinas(disciplinas.filter(d => d.id !== id));
      toast.success("Disciplina removida com sucesso!");
    }
  };

  const handleAddConteudo = async (disciplinaId: string, nomeConteudo: string, clearInput: () => void) => {
    if (!nomeConteudo.trim()) return;
    
    // Obter ordem
    const disc = disciplinas.find(d => d.id === disciplinaId);
    const ordem = disc?.conteudos?.length || 0;

    const { data, error } = await supabase
      .from("conteudos")
      .insert({
        disciplina_id: disciplinaId,
        nome: nomeConteudo.trim(),
        ordem: ordem
      })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao adicionar conteúdo.");
    } else if (data) {
      setDisciplinas(disciplinas.map(d => {
        if (d.id === disciplinaId) {
          return { ...d, conteudos: [...(d.conteudos || []), data] };
        }
        return d;
      }));
      clearInput();
      toast.success("Conteúdo adicionado!");
    }
  };

  const handleDeleteConteudo = async (disciplinaId: string, conteudoId: string) => {
    const { error } = await supabase
      .from("conteudos")
      .delete()
      .eq("id", conteudoId);

    if (error) {
      toast.error("Erro ao excluir conteúdo. Ele pode já estar associado no KevQuest de alunos.");
    } else {
      setDisciplinas(disciplinas.map(d => {
        if (d.id === disciplinaId) {
          return { ...d, conteudos: d.conteudos.filter((c: any) => c.id !== conteudoId) };
        }
        return d;
      }));
      toast.success("Conteúdo removido!");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in max-w-5xl mx-auto pb-20 px-4">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-[1.2rem] shadow-lg shadow-indigo-600/20">
              <Settings className="w-8 h-8 text-white" />
            </div>
            Variáveis Padrão
          </h1>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-3 ml-2">Configuração Global da Plataforma</p>
        </div>
        <button
          onClick={saveConfig}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Salvar Alterações
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Disciplinas Globais */}
        <ConfigCard 
          title="Disciplinas Globais" 
          desc="Eixos oficiais da plataforma" 
          items={disciplinas.map(d => d.nome)}
          inputValue={newDisciplina}
          setInputValue={setNewDisciplina}
          onAdd={handleAddDisciplina}
          onRemove={(nome: string) => {
            const d = disciplinas.find(disc => disc.nome === nome);
            if (d) handleDeleteDisciplina(d.id, d.nome);
          }}
        />

        {/* Conteúdos por Disciplina (com Select) */}
        <ConfigConteudoCard 
          disciplinas={disciplinas}
          onAddConteudo={handleAddConteudo}
          onDeleteConteudo={handleDeleteConteudo}
        />

        <ConfigCard 
          title="Provas / Vestibulares" 
          desc="Opções de bancas para Diário e Simulados" 
          items={config?.provas || []}
          inputValue={newProva}
          setInputValue={setNewProva}
          onAdd={() => handleAddItem("provas", newProva, setNewProva)}
          onRemove={(v: string) => handleRemoveItem("provas", v)}
        />
        <ConfigCard 
          title="Anos Letivos" 
          desc="Opções de anos de provas" 
          items={config?.anos || []}
          inputValue={newAno}
          setInputValue={setNewAno}
          onAdd={() => handleAddItem("anos", newAno, setNewAno)}
          onRemove={(v: string) => handleRemoveItem("anos", v)}
        />
        <ConfigCard 
          title="Sistema de Cores" 
          desc="Cores dos cadernos/provas" 
          items={config?.cores || []}
          inputValue={newCor}
          setInputValue={setNewCor}
          onAdd={() => handleAddItem("cores", newCor, setNewCor)}
          onRemove={(v: string) => handleRemoveItem("cores", v)}
        />
        <ConfigCard 
          title="Motivos de Erro" 
          desc="Opções padrão de justificativa gráfica" 
          items={config?.motivos || []}
          inputValue={newMotivo}
          setInputValue={setNewMotivo}
          onAdd={() => handleAddItem("motivos", newMotivo, setNewMotivo)}
          onRemove={(v: string) => handleRemoveItem("motivos", v)}
        />
      </div>

      <div className="pt-10 flex justify-end gap-4 mt-8 border-t border-slate-200 dark:border-[#2C2C2E]">
        <button 
          onClick={saveConfig}
          disabled={isSaving}
          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black px-12 py-4 rounded-2xl shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 active:scale-95 transition-all text-lg disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Salvar Alterações
        </button>
      </div>

    </div>
  );
}

function ConfigConteudoCard({ disciplinas, onAddConteudo, onDeleteConteudo }: any) {
  const [selectedDiscId, setSelectedDiscId] = useState("");
  const [newConteudo, setNewConteudo] = useState("");

  const disc = disciplinas.find((d: any) => d.id === selectedDiscId);
  const items = disc ? (disc.conteudos || []).map((c: any) => c.nome) : [];

  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col gap-4 h-full">
      <div>
         <h3 className="text-xl font-black text-slate-800 dark:text-white truncate">Mapeamento de Conteúdos</h3>
         <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Tópicos vinculados à matéria</p>
      </div>

      <select 
         value={selectedDiscId}
         onChange={(e) => setSelectedDiscId(e.target.value)}
         className="w-full bg-slate-50 dark:bg-[#2C2C2E] border-2 border-transparent focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none appearance-none cursor-pointer"
      >
         <option value="" disabled>Selecionar Disciplina...</option>
         {disciplinas.map((d: any) => (
           <option key={d.id} value={d.id}>{d.nome}</option>
         ))}
      </select>

      <div className="flex gap-2">
        <input 
          type="text" 
          value={newConteudo}
          onChange={(e) => setNewConteudo(e.target.value)}
          placeholder="Adicionar novo conteúdo..."
          onKeyDown={(e) => e.key === "Enter" && disc && onAddConteudo(selectedDiscId, newConteudo, () => setNewConteudo(""))}
          disabled={!disc}
          className="flex-1 min-w-0 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-transparent focus:border-indigo-500/50 rounded-xl py-2 px-4 text-sm font-bold transition-all outline-none disabled:opacity-50"
        />
        <button onClick={() => disc && onAddConteudo(selectedDiscId, newConteudo, () => setNewConteudo(""))} disabled={!disc} className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 p-2.5 rounded-xl hover:bg-indigo-200 transition-colors flex-shrink-0 disabled:opacity-50">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {items.map((item: string, idx: number) => (
          <div key={idx} className="flex items-center gap-2 bg-slate-100 dark:bg-[#2C2C2E] text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-sm font-bold group">
            {item}
            <button onClick={() => {
              const c = disc.conteudos?.find((cont: any) => cont.nome === item);
              if (c) onDeleteConteudo(disc.id, c.id);
            }} className="text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-500 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && <span className="text-sm text-slate-400 italic">Nenhum item adicionado</span>}
      </div>
    </div>
  );
}

function ConfigCard({ title, desc, items, inputValue, setInputValue, onAdd, onRemove }: any) {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col gap-4 h-full">
      <div>
         <h3 className="text-xl font-black text-slate-800 dark:text-white truncate" title={title}>{title}</h3>
         <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">{desc}</p>
      </div>

      <div className="flex gap-2">
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Adicionar novo item..."
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          className="flex-1 min-w-0 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-transparent focus:border-indigo-500/50 rounded-xl py-2 px-4 text-sm font-bold transition-all outline-none"
        />
        <button onClick={onAdd} className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 p-2.5 rounded-xl hover:bg-indigo-200 transition-colors flex-shrink-0">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {items.map((item: string, idx: number) => (
          <div key={idx} className="flex items-center gap-2 bg-slate-100 dark:bg-[#2C2C2E] text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-sm font-bold group">
            {item}
            <button onClick={() => onRemove(item)} className="text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-500 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && <span className="text-sm text-slate-400 italic">Nenhum item adicionado</span>}
      </div>
    </div>
  );
}
