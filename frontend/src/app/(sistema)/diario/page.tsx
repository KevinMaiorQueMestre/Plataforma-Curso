"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import {
  MOCK_ESTUDOS,
  MOCK_DISCIPLINAS,
  MOCK_CONTEUDOS
} from "@/lib/kevquestLogic";
import { BookOpen, Target, Plus, X, BarChart2 } from "lucide-react";
import { toast } from "sonner";

export default function HomeEstudosPage() {
  const [estudos, setEstudos] = useState(MOCK_ESTUDOS);
  const [modalOpen, setModalOpen] = useState(false);

  // Modal State
  const [form, setForm] = useState({
    data: format(new Date(), 'yyyy-MM-dd'),
    disciplinaId: "",
    conteudoId: "",
    questoesFeitas: "",
    acertos: "",
    horasEstudo: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.data || !form.disciplinaId || !form.conteudoId || !form.questoesFeitas || !form.acertos || !form.horasEstudo) {
      toast.error("Preencha todos os campos para registrar o estudo.");
      return;
    }

    const qF = parseInt(form.questoesFeitas);
    const qA = parseInt(form.acertos);
    const hE = parseFloat(form.horasEstudo);

    if (qA > qF) {
      toast.error("O número de acertos não pode ser maior que o de questões feitas!");
      return;
    }

    const discName = MOCK_DISCIPLINAS.find(d => d.id === form.disciplinaId)?.nome || "";
    const contName = MOCK_CONTEUDOS[form.disciplinaId]?.find(c => c.id === form.conteudoId)?.nome || "";

    const novoEstudo = {
      id: "estudo_x_" + Math.random(),
      dataIso: form.data, // Pega a data escolhida no input
      disciplinaId: form.disciplinaId,
      disciplinaNome: discName,
      conteudoId: form.conteudoId,
      conteudoNome: contName,
      questoesFeitas: qF,
      acertos: qA,
      horasEstudo: hE
    };

    setEstudos([novoEstudo, ...estudos]);
    toast.success("Sessão de estudo registrada com sucesso!");
    setModalOpen(false);
    setForm({ data: format(new Date(), 'yyyy-MM-dd'), disciplinaId: "", conteudoId: "", questoesFeitas: "", acertos: "", horasEstudo: "" });
  };

  const totalQuestoesFeitas = estudos.reduce((acc, curr) => acc + curr.questoesFeitas, 0);
  const totalAcertos = estudos.reduce((acc, curr) => acc + curr.acertos, 0);
  const porcentagemGeral = totalQuestoesFeitas > 0 ? Math.round((totalAcertos / totalQuestoesFeitas) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl relative">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-600" />
            Diário de Estudos
          </h1>
          <p className="text-slate-500 mt-1 font-medium text-sm md:text-base">Registre diariamente seu volume de questões para nutrir as estatísticas e o calendário.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-indigo-200"
        >
          <Plus className="w-5 h-5" />
          Registrar Sessão
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Lado Esquerdo - Tabela e Métricas (Maior Destaque) */}
        <div className="lg:col-span-3 flex flex-col gap-6">

          {/* Mini-Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xl:gap-6">
            <div className="bg-white p-5 xl:p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Questões Resolvidas</span>
                <span className="block text-2xl font-black text-slate-800">{totalQuestoesFeitas}</span>
              </div>
            </div>
            <div className="bg-white p-5 xl:p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Acertos</span>
                <span className="block text-2xl font-black text-teal-700">{totalAcertos}</span>
              </div>
            </div>
            <div className="bg-white p-5 xl:p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
                <BarChart2 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Média Global</span>
                <span className="block text-2xl font-black text-orange-700">{porcentagemGeral}%</span>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-6 px-2">Histórico de Engajamento</h2>
            <div className="overflow-x-auto pb-2 hidden-scrollbar">
              <table className="w-full min-w-[500px] text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-50">
                    <th className="pb-4 pt-2 px-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Data</th>
                    <th className="pb-4 pt-2 px-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Disciplina / Assunto</th>
                    <th className="pb-4 pt-2 px-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Volume</th>
                    <th className="pb-4 pt-2 px-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Performance</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium text-slate-600">
                  {estudos.map((e) => {
                    const perc = e.questoesFeitas > 0 ? Math.round((e.acertos / e.questoesFeitas) * 100) : 0;
                    return (
                      <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 text-slate-400 capitalize whitespace-nowrap">
                          {format(new Date(e.dataIso), "EEEE, dd/MM", { locale: ptBR })}
                          <span className="block mt-0.5 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded w-max">{e.horasEstudo}h estudadas</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-bold text-slate-800">{e.disciplinaNome}</span>
                          <span className="block text-xs text-slate-400 mt-0.5">{e.conteudoNome}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-slate-700 font-bold">{e.questoesFeitas}</span> <span className="text-slate-400 text-xs">feitas</span>
                        </td>
                        <td className="py-4 px-4 flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${perc >= 80 ? 'bg-teal-100 text-teal-700' : perc >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-rose-100 text-rose-700'}`}>
                            {perc}% acc
                          </span>
                          <span className="text-xs text-slate-400">({e.acertos} corretas)</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Lado Direito - Antigo Mural de Avisos (Reduzido) */}
        <aside className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2rem] p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mx-10 -my-10 z-0"></div>
            <h3 className="text-lg font-black relative z-10">Mural de Avisos</h3>
            <p className="text-indigo-100 text-sm mt-2 relative z-10 mb-6">Informações importantes do seu curso.</p>

            <ul className="space-y-4 relative z-10">
              <li className="bg-white/10 p-3 rounded-xl border border-white/20">
                <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest block mb-1">Amanhã (19h)</span>
                <p className="text-sm font-medium">Plantão de dúvidas AO VIVO de Exatas.</p>
              </li>
              <li className="bg-white/10 p-3 rounded-xl border border-white/20">
                <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest block mb-1">Domingo</span>
                <p className="text-sm font-medium">Simulado Geral será liberado 08:00.</p>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                Registrar Sessão
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto hidden-scrollbar">

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Data do Estudo</label>
                <input
                  type="date"
                  value={form.data}
                  onChange={e => setForm({ ...form, data: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Disciplina Estudada</label>
                <select
                  value={form.disciplinaId}
                  onChange={e => setForm({ ...form, disciplinaId: e.target.value, conteudoId: "" })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium"
                >
                  <option value="" disabled className="text-slate-400">Selecionar...</option>
                  {MOCK_DISCIPLINAS.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Conteúdo do Dia</label>
                <select
                  value={form.conteudoId}
                  onChange={e => setForm({ ...form, conteudoId: e.target.value })}
                  disabled={!form.disciplinaId}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-slate-50 focus:bg-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium"
                >
                  <option value="" disabled className="text-slate-400">Selecionar Assunto...</option>
                  {form.disciplinaId && MOCK_CONTEUDOS[form.disciplinaId]?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide truncate">Horas</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="0.0"
                    value={form.horasEstudo}
                    onChange={e => setForm({ ...form, horasEstudo: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide truncate">Feitas</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={form.questoesFeitas}
                    onChange={e => setForm({ ...form, questoesFeitas: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide truncate">Acertos</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.acertos}
                    onChange={e => setForm({ ...form, acertos: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-teal-700 bg-teal-50/50 focus:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all font-bold text-center"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md shadow-indigo-200"
                >
                  Computar no Calendário
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Pequeno ícone SVG para checksquare (já que esqueci de importar do lucide acima mas usei lá)
function CheckSquare(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"></polyline>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
    </svg>
  );
}
