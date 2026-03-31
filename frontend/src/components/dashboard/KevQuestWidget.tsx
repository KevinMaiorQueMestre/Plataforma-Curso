"use client";

import { useState } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  MOCK_DISCIPLINAS,
  MOCK_CONTEUDOS,
  ESTAGIO_ORDER,
  calcRefacaoDates
} from "../../lib/kevquestLogic";

export default function KevQuestWidget() {
  const [disciplinaId, setDisciplinaId] = useState("");
  const [conteudoId, setConteudoId] = useState("");
  const [subConteudo, setSubConteudo] = useState("");
  const [newConteudo, setNewConteudo] = useState("");
  const [estagio, setEstagio] = useState(ESTAGIO_ORDER[0]);
  const [isPending, setIsPending] = useState(false);
  
  const handleCreateConteudo = () => {
    if (!newConteudo.trim() || !disciplinaId) return;
    setConteudoId("c-custom"); // mock id
    toast.success("Novo assunto temporariamente salvo (Visual)!");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disciplinaId || (!conteudoId && !newConteudo)) {
      toast.error("Selecione a matéria e o assunto.");
      return;
    }
    
    setIsPending(true);
    
    // Calcula as datas de expiração/Refação caso o estagio seja 'Refacao'
    const payload = {
      disciplina_id: disciplinaId,
      conteudo_id: conteudoId,
      sub_conteudo: subConteudo || null,
      estagio_funil: estagio,
      ...(estagio === "Refacao" ? calcRefacaoDates(new Date()) : {})
    };
    
    // Simulate backend call (Aqui entraria o dispatch para a store/Supabase do client final)
    setTimeout(() => {
      console.log("Mock Payload to Supabase:", payload);
      toast.success(`Questão lançada para: ${estagio}!`);
      setSubConteudo("");
      setIsPending(false);
    }, 800);
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-100 flex flex-col h-full animate-in fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">KevQuest Tracker</h2>
          <p className="text-sm text-slate-500 mt-1">Lógica Matemática Nativa Embutida</p>
        </div>
        <div className="bg-orange-50 p-3 rounded-2xl">
          <PlusCircle className="text-orange-500 w-6 h-6" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
        {/* Disciplina */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Matéria</label>
          <select
            value={disciplinaId}
            onChange={(e) => { setDisciplinaId(e.target.value); setConteudoId(""); }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-medium transition-all"
          >
            <option value="">Selecione...</option>
            {MOCK_DISCIPLINAS.map((d) => (
              <option key={d.id} value={d.id}>{d.nome}</option>
            ))}
          </select>
        </div>

        {/* Conteudo */}
        <div className={`transition-all duration-300 ${!disciplinaId ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assunto</label>
          <div className="flex gap-2">
            <select
              value={conteudoId}
              onChange={(e) => setConteudoId(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-medium transition-all"
            >
              <option value="">Selecione da lista...</option>
              {disciplinaId && MOCK_CONTEUDOS[disciplinaId]?.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Estágio do Funil (Novo Input extraído do KevQuest) */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Funil Alvo</label>
          <select
            value={estagio}
            onChange={(e) => setEstagio(e.target.value as any)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-medium transition-all"
          >
            {ESTAGIO_ORDER.map((stage) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-auto w-full bg-slate-800 text-white font-medium py-3.5 rounded-xl hover:bg-slate-700 transition-all shadow-md flex items-center justify-center gap-2"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Gerar Dados Lógicos"}
        </button>
      </form>
    </div>
  );
}
