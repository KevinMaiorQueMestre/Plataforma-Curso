"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { useState, useEffect, useMemo } from "react";
import { 
  calcRefacaoDates, 
  ESTAGIO_ORDER,
  ESTAGIO_COLORS,
  MOCK_DISCIPLINAS,
  MOCK_CONTEUDOS,
  MOCK_PROVAS,
  MOCK_MOTIVOS_ERRO
} from "@/lib/kevquestLogic";
import { Plus, X, AlertTriangle, CheckCircle, Flame, Filter, ChevronRight, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function KevQuestPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [questoes, setQuestoes] = useState<any[]>([]);
  const [activeStage, setActiveStage] = useState<string>("Todos");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showFunnelFilters, setShowFunnelFilters] = useState(true);

  // Form State
  const [form, setForm] = useState({
    disciplina: "",
    conteudo: "",
    sub_conteudo: "",
    q_num: "",
    prova: "",
    estagio: "",
    comentario: ""
  });

  useEffect(() => {
    const stored = localStorage.getItem('kevquest_questoes');
    if (stored) {
      setQuestoes(JSON.parse(stored));
    } else {
      const initial = [
        {
          id: "q1", data_resolucao: new Date().toISOString(),
          disciplina: "Física", conteudo: "Cinemática", sub_conteudo: "MRUV",
          prova: "ENEM 2023", estagio_funil: "Diagnostico"
        },
        {
          id: "q2", data_resolucao: new Date().toISOString(),
          disciplina: "Biologia", conteudo: "Genética", sub_conteudo: "Leis de Mendel",
          prova: "ENEM 2022", estagio_funil: "UTI"
        },
        {
          id: "q3", data_resolucao: new Date().toISOString(),
          disciplina: "Matemática", conteudo: "Geometria", sub_conteudo: "Áreas Plana",
          prova: "Simulado Hexag", estagio_funil: "Refacao",
          ...calcRefacaoDates(new Date()) 
        }
      ];
      setQuestoes(initial);
      localStorage.setItem('kevquest_questoes', JSON.stringify(initial));
    }
    setIsLoaded(true);
  }, []);

  // Sync to Storage on Save
  const saveToStorage = (newList: any[]) => {
    setQuestoes(newList);
    localStorage.setItem('kevquest_questoes', JSON.stringify(newList));
  };

  const openNewModal = () => {
    setEditingId(null);
    setForm({ disciplina: "", conteudo: "", sub_conteudo: "", q_num: "", prova: "", estagio: "", comentario: "" });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.disciplina || !form.conteudo || !form.estagio) {
      toast.error("Preencha Disciplina, Conteúdo e Estágio");
      return;
    }

    let nQ = {
      id: editingId || ("kq_" + Date.now()),
      data_resolucao: new Date().toISOString(), // Mantém agora p/ simplicidade no update
      disciplina: form.disciplina,
      conteudo: form.conteudo,
      sub_conteudo: form.sub_conteudo,
      q_num: form.q_num,
      prova: form.prova,
      estagio_funil: form.estagio,
      comentario: form.comentario,
      ...(form.estagio === "Refacao" ? calcRefacaoDates(new Date()) : {})
    };

    let novaLista = [];
    if (editingId) {
      // Se Editando, preserva a data original de resolução
      const original = questoes.find(q => q.id === editingId);
      if (original) nQ.data_resolucao = original.data_resolucao;
      novaLista = questoes.map(q => q.id === editingId ? nQ : q);
      toast.success("Questão atualizada com sucesso!");
    } else {
      novaLista = [nQ, ...questoes];
      toast.success("Questão salva com sucesso!");
    }

    saveToStorage(novaLista);
    setModalOpen(false);
  };

  // --- Operadores de Tabela ---
  const handleAdvance = (id: string, currentStage: string) => {
    const sequence = {
      "Quarentena": "Refacao",
      "Diagnostico": "UTI",
      "UTI": "Refacao",
      "Refacao": "Consolidada",
      "Consolidada": "Consolidada"
    };
    
    const nextStage = sequence[currentStage as keyof typeof sequence];
    if (currentStage === "Consolidada") return;

    const novaLista = questoes.map(q => {
      if (q.id === id) {
        return { 
          ...q, 
          estagio_funil: nextStage,
          ...(nextStage === "Refacao" ? calcRefacaoDates(new Date()) : {})
        };
      }
      return q;
    });

    saveToStorage(novaLista);
    toast.success(`Estágio avançado para: ${nextStage}`);
  };

  const handleEdit = (q: any) => {
    setEditingId(q.id);
    setForm({
      disciplina: q.disciplina,
      conteudo: q.conteudo,
      sub_conteudo: q.sub_conteudo || "",
      q_num: q.q_num || "",
      prova: q.prova || "",
      estagio: q.estagio_funil,
      comentario: q.comentario || ""
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este registro permanentemente?")) {
      const novaLista = questoes.filter(q => q.id !== id);
      saveToStorage(novaLista);
      toast.success("Registro Excluído");
    }
  };

  // --- Filtros e Dashboards Dybâmicos ---
  const filteredQuestoes = activeStage === "Todos" 
    ? questoes 
    : questoes.filter(q => q.estagio_funil === activeStage);

  const getTopFrequencies = (field: string) => {
    const counts: Record<string, number> = {};
    filteredQuestoes.forEach(q => {
      const val = q[field] || "Desconhecido";
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // Top 3
  };

  const topDisciplinas = useMemo(() => getTopFrequencies('disciplina'), [filteredQuestoes]);
  const topConteudos = useMemo(() => getTopFrequencies('conteudo'), [filteredQuestoes]);
  const topProvas = useMemo(() => getTopFrequencies('prova'), [filteredQuestoes]);

  const questoesHoje = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return questoes.filter(q => q.data_resolucao.startsWith(today)).length;
  }, [questoes]);

  const noFunil = useMemo(() => questoes.filter(q => q.estagio_funil !== "Consolidada").length, [questoes]);

  const streakDias = 12; // Valor fictício p/ UX, conectar ao DB depois

  if (!isLoaded) return <div className="p-8">Carregando KevQuest...</div>;

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-20">
      
      <header className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-600" /> KevQuest
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Motor de Análise Qualitativa de Erros</p>
        </div>
        <button 
          onClick={openNewModal}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-slate-900/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Nova Questão
        </button>
      </header>

      {/* --- WIDGETS GLOBAIS --- */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-black text-slate-800 mb-2">{questoesHoje}</span>
          <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Lançadas Hoje</span>
        </div>
        
        <button 
          onClick={() => setShowFunnelFilters(!showFunnelFilters)}
          className={`rounded-3xl p-6 border-2 transition-all flex flex-col items-center justify-center text-center ${showFunnelFilters ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'bg-white border-slate-200 shadow-lg hover:border-indigo-300 hover:shadow-indigo-500/20 hover:-translate-y-1'} active:scale-95`}
        >
          <span className={`text-4xl font-black mb-2 ${showFunnelFilters ? 'text-indigo-600' : 'text-slate-800'}`}>{noFunil}</span>
          <span className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${showFunnelFilters ? 'text-indigo-600' : 'text-slate-500'}`}>
            Passando pelo funil {showFunnelFilters ? <ChevronRight className="w-4 h-4 rotate-90 transition-transform" /> : <ChevronRight className="w-4 h-4 transition-transform" />}
          </span>
        </button>

        <div className="bg-gradient-to-br from-orange-500 to-rose-500 rounded-3xl p-6 shadow-lg shadow-orange-500/20 flex flex-col items-center justify-center text-center text-white">
          <span className="text-4xl font-black mb-2 flex items-center gap-2"><Flame className="w-8 h-8 fill-current" /> {streakDias}</span>
          <span className="text-sm font-bold text-white/80 uppercase tracking-wider">Dias Seguidos</span>
        </div>
      </section>

      {/* --- CARDS / FILTROS DO FUNIL (OCULTÁVEL) --- */}
      {showFunnelFilters && (
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {ESTAGIO_ORDER.map(estagio => {
            const count = questoes.filter(q => q.estagio_funil === estagio).length;
            const colorCode = ESTAGIO_COLORS[estagio as keyof typeof ESTAGIO_COLORS];
            const isActive = activeStage === estagio;
            
            return (
              <button 
                key={estagio}
                onClick={() => setActiveStage(isActive ? "Todos" : estagio)}
                className={`flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all ${isActive ? 'bg-slate-50 border-slate-300 shadow-inner' : 'bg-white border-slate-100 shadow-sm hover:border-slate-200'} relative active:scale-95`}
              >
                <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center`} style={{ backgroundColor: colorCode + '20', color: colorCode }}>
                  {isActive && <Filter className="w-5 h-5 absolute top-3 right-3 text-slate-300" />}
                  <span className="font-black text-xl" style={{ color: colorCode }}>{count}</span>
                </div>
                <span className="text-sm font-bold text-slate-700 capitalize text-center leading-tight">{estagio}</span>
              </button>
            )
          })}
        </section>
      )}

      {/* --- SUB-DASHBOARD (Aparece Apenas Se Há Filtro Ativo) --- */}
      {activeStage !== "Todos" && (
        <section className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: ESTAGIO_COLORS[activeStage as keyof typeof ESTAGIO_COLORS] }}></div>
          
          <h2 className="text-lg font-black mb-6 flex items-center gap-2" style={{ color: ESTAGIO_COLORS[activeStage as keyof typeof ESTAGIO_COLORS] }}>
            <span className="capitalize">{activeStage}</span> Stats
            <span className="text-sm font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 ml-2">{filteredQuestoes.length} questões</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">Top Disciplinas</h3>
              {topDisciplinas.length === 0 ? <p className="text-sm text-slate-400">Nenhum dado</p> : (
                <ul className="space-y-3">
                  {topDisciplinas.map(([name, val], i) => (
                    <li key={name} className="flex justify-between items-center text-sm font-bold text-slate-700">
                      <span>{i + 1}. {name}</span>
                      <span className="bg-slate-100 px-2 rounded-md text-slate-600">{val}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">Top Conteúdos</h3>
              {topConteudos.length === 0 ? <p className="text-sm text-slate-400">Nenhum dado</p> : (
                <ul className="space-y-3">
                  {topConteudos.map(([name, val], i) => (
                    <li key={name} className="flex justify-between items-center text-sm font-bold text-slate-700">
                      <span>{i + 1}. {name}</span>
                      <span className="bg-slate-100 px-2 rounded-md text-slate-600">{val}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">Top Provas Fontes</h3>
              {topProvas.length === 0 ? <p className="text-sm text-slate-400">Nenhum dado</p> : (
                <ul className="space-y-3">
                  {topProvas.map(([name, val], i) => (
                    <li key={name} className="flex justify-between items-center text-sm font-bold text-slate-700">
                      <span>{i + 1}. {name}</span>
                      <span className="bg-slate-100 px-2 rounded-md text-slate-600">{val}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {/* --- TABELA ATIVA --- */}
      <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6 px-2">
          <h2 className="text-lg font-bold text-slate-800">
            {activeStage === "Todos" ? "Registro Geral (Todas Etapas)" : `Filtrado: ${activeStage}`}
          </h2>
        </div>

        <div className="overflow-x-auto hidden-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b-2 border-slate-50">
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Data</th>
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Disciplina</th>
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Conteúdo</th>
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Prova</th>
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estágio Atual</th>
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredQuestoes.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400 font-medium">Nenhuma questão encontrada com este filtro.</td></tr>
              ) : (
                filteredQuestoes.map((q) => {
                  const cor = ESTAGIO_COLORS[q.estagio_funil as keyof typeof ESTAGIO_COLORS] || '#94a3b8';
                  return (
                    <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                      <td className="py-4 px-4 text-slate-400 font-medium">
                        {format(new Date(q.data_resolucao), "dd/MM/yy")}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-800 capitalize">{q.disciplina}</td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-700 block">{q.conteudo}</span>
                        {q.sub_conteudo && <span className="text-xs text-slate-400 block">{q.sub_conteudo}</span>}
                      </td>
                      <td className="py-4 px-4 text-slate-500 font-medium">{q.prova || "—"}</td>
                      <td className="py-4 px-4">
                        <span 
                          className="px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 capitalize border"
                          style={{ backgroundColor: cor + "15", color: cor, borderColor: cor + "30" }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cor }}></span>
                          {q.estagio_funil}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right opacity-50 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-end gap-2">
                          {q.estagio_funil !== "Consolidada" && (
                            <button onClick={() => handleAdvance(q.id, q.estagio_funil)} title="Avançar Estágio" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleEdit(q)} title="Editar" className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(q.id)} title="Excluir" className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- MODAL DE NOVA/EDITAR QUESTÃO --- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-slate-100">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                {editingId ? <Edit2 className="w-6 h-6 text-amber-500" /> : <Plus className="w-6 h-6 text-indigo-600" />}
                {editingId ? "Editar Registro" : "Adicionar à Ficha"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto hidden-scrollbar">
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Disciplina do Erro</label>
                  <select 
                    value={form.disciplina} onChange={e => setForm({...form, disciplina: e.target.value, conteudo: ""})}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all font-bold appearance-none"
                  >
                    <option value="" disabled>Selecionar Área...</option>
                    {MOCK_DISCIPLINAS.map(d => <option key={d.id} value={d.nome}>{d.nome}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Conteúdo Errado</label>
                  <select 
                    value={form.conteudo} onChange={e => setForm({...form, conteudo: e.target.value})}
                    disabled={!form.disciplina}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 bg-slate-50 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all font-bold appearance-none"
                  >
                    <option value="" disabled>Selecionar Assunto...</option>
                    {form.disciplina && MOCK_CONTEUDOS[MOCK_DISCIPLINAS.find(d => d.nome === form.disciplina)?.id || ""]?.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Sub-Conteúdo <span className="text-slate-300">(Opcional)</span></label>
                  <input type="text" placeholder="Ex: Análise Combinatória" value={form.sub_conteudo} onChange={e => setForm({...form, sub_conteudo: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Nº da Questão <span className="text-slate-300">(Opcional)</span></label>
                  <input type="text" placeholder="Ex: Questão 42" value={form.q_num} onChange={e => setForm({...form, q_num: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 font-medium" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Prova (Fonte)</label>
                <select value={form.prova} onChange={e => setForm({...form, prova: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 font-medium appearance-none bg-slate-50">
                  <option value="" disabled>Selecionar Prova...</option>
                  {MOCK_PROVAS.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                </select>
              </div>

              <div className={`p-6 rounded-2xl border-2 transition-all duration-300 ${form.estagio === 'Diagnostico' ? 'bg-orange-50/50 border-orange-400 shadow-[0_0_20px_rgba(251,146,60,0.15)] ring-4 ring-orange-400/10' : 'bg-slate-50 border-slate-200'}`}>
                <label className={`block text-xs font-bold mb-3 uppercase tracking-wide flex items-center gap-2 ${form.estagio === 'Diagnostico' ? 'text-orange-600' : 'text-slate-600'}`}>
                  {form.estagio === 'Diagnostico' ? <AlertTriangle className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-slate-300"></div>}
                  Estágio de Triagem da Questão
                </label>
                <select 
                  value={form.estagio} onChange={e => setForm({...form, estagio: e.target.value})}
                  className={`w-full border-2 rounded-xl px-4 py-3.5 text-sm font-bold appearance-none transition-colors focus:outline-none ${form.estagio === 'Diagnostico' ? 'bg-white border-orange-300 text-orange-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20' : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-400'}`}
                >
                  <option value="" disabled>Selecionar o Diagnóstico/Erro...</option>
                  {ESTAGIO_ORDER.map(est => <option key={est} value={est}>{est} - Etapa KevQuest</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Anotações do Erro</label>
                <textarea rows={3} placeholder="O que te fez errar essa questão? Faltou base ou só desatenção?" value={form.comentario} onChange={e => setForm({...form, comentario: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 resize-none font-medium"></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-4">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/20 active:scale-95 transition-all text-lg">
                  {editingId ? "Salvar Alterações" : "Injetar no Motor KevQuest"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
