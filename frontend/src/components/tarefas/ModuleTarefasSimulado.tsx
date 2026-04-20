import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  listarProblemas, concluirProblema, deletarProblema, criarProblemaManual,
  type ProblemaEstudo, type OrigemProblema, ORIGEM_LABELS, ORIGEM_COLORS, TIPO_ERRO_LABELS, TIPO_ERRO_COLORS
} from "@/lib/db/estudo";
import { createClient } from "@/utils/supabase/client";
import { Trash, CheckCircle2, AlertCircle, Inbox, Plus, X, Activity } from "lucide-react";
import { toast } from "sonner";

export default function ModuleTarefasSimulado({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const origem: OrigemProblema = "simulado";
  const [problemas, setProblemas] = useState<ProblemaEstudo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Modals
  const [modalConcluir, setModalConcluir] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [formConcluir, setFormConcluir] = useState({ tempo: '', conforto: 0 });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await fetchProblemas(user.id);
    };
    init();
  }, [refreshTrigger]);

  const fetchProblemas = async (uid: string) => {
    const todos = await listarProblemas(uid);
    setProblemas(todos.filter(p => p.origem === 'simulado' && p.tipo_erro === null));
    setIsLoaded(true);
  };

  const refresh = () => {
    if (userId) fetchProblemas(userId);
  };

  const handleDeletar = async (id: string) => {
    if (confirm("Excluir este simulado?")) {
      const ok = await deletarProblema(id);
      if (ok) {
        toast.success("Simulado excluído");
        refresh();
      }
    }
  };

  const handleConcluir = async () => {
    if (!modalConcluir.id) return;
    setIsSaving(true);
    const ok = await concluirProblema(
      modalConcluir.id,
      {
        conforto: formConcluir.conforto || null,
      }
    );
    if (ok) {
      toast.success('Simulado concluído!');
      setModalConcluir({ open: false, id: null });
      setFormConcluir({ tempo: '', conforto: 0 });
      refresh();
    } else {
      toast.error('Erro ao concluir simulado.');
    }
    setIsSaving(false);
  };

  const hoje = new Date().toISOString().split('T')[0];
  const paraHoje = problemas.filter(p => p.status === 'pendente' && p.agendado_para === hoje);
  const fila = problemas.filter(p => p.status === 'pendente' && p.agendado_para !== hoje);

  const ProblemaListRow = ({ prob, showDate = true }: { prob: ProblemaEstudo; showDate?: boolean }) => {
    return (
      <div className={`bg-white dark:bg-[#1C1C1E] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border transition-all hover:bg-slate-50 dark:hover:bg-[#2C2C2E] ${
        prob.prioridade === 1 ? 'border-orange-200 dark:border-orange-500/30' : 'border-slate-100 dark:border-[#2C2C2E]'
      }`}>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-xl bg-[#1B2B5E]/10 flex items-center justify-center flex-shrink-0">
            <Activity className="w-6 h-6 text-[#1B2B5E] dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-black text-slate-800 dark:text-white text-base md:text-lg leading-tight mb-1">
              {prob.titulo}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              {prob.prioridade === 1 && <span className="text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-md">Urgente</span>}
              {showDate && prob.agendado_para && <span>Agendado: {new Date(prob.agendado_para + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end w-full md:w-auto">
          <button
            onClick={() => handleDeletar(prob.id)}
            className="p-3 text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
            title="Excluir"
          >
            <Trash className="w-4 h-4" />
          </button>
          <button
            onClick={() => setModalConcluir({ open: true, id: prob.id })}
            className="flex items-center gap-2 bg-[#1B2B5E] hover:bg-blue-900 text-white text-xs font-black px-5 py-3 rounded-xl uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-[#1B2B5E]/20"
          >
            <CheckCircle2 className="w-4 h-4" /> Concluir
          </button>
        </div>
      </div>
    );
  };

  if (!isLoaded) return <div className="p-8 text-center text-slate-400 animate-pulse">Carregando simulados...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header removido para evitar duplicidade com page.tsx */}

      {/* Para Hoje */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-[#F97316]/10 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-[#F97316]" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
            Para Hoje
          </h2>
          <span className="text-xs font-black text-slate-400">({paraHoje.length})</span>
        </div>
        {paraHoje.length === 0 ? (
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 border border-slate-100 dark:border-[#2C2C2E] text-center text-slate-400 text-sm">
            Nenhum simulado agendado para hoje.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {paraHoje.map(p => <ProblemaListRow key={p.id} prob={p} showDate={false} />)}
          </div>
        )}
      </div>

      {/* Fila */}
      <div>
        <div className="flex items-center gap-3 mb-4 mt-8">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Inbox className="w-4 h-4 text-slate-500" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
            Fila (Agendados Futuros ou Sem Data)
          </h2>
          <span className="text-xs font-black text-slate-400">({fila.length})</span>
        </div>
        {fila.length === 0 ? (
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 border border-slate-100 dark:border-[#2C2C2E] text-center text-slate-400 text-sm">
            Fila limpa.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {fila.map(p => <ProblemaListRow key={p.id} prob={p} />)}
          </div>
        )}
      </div>

      {/* Modal Concluir */}
      {modalConcluir.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-black mb-6 text-slate-800 dark:text-white">Concluir Simulado</h2>
            <div className="space-y-4">
            <p className="text-sm text-slate-500 font-medium text-center">Deseja marcar este simulado como concluído para lançar o desempenho?</p>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setModalConcluir({open:false, id:null})} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleConcluir} disabled={isSaving} className="flex-1 py-3 bg-[#1B2B5E] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#1B2B5E]/20 disabled:opacity-50 transition-all active:scale-95">Confirmar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
