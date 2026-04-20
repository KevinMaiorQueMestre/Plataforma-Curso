import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  listarProblemas, concluirProblema, deletarProblema, criarProblemaManual,
  type ProblemaEstudo, type OrigemProblema, ORIGEM_LABELS, ORIGEM_COLORS, TIPO_ERRO_LABELS, TIPO_ERRO_COLORS
} from "@/lib/db/estudo";
import { createClient } from "@/utils/supabase/client";
import { Trash, CheckCircle2, AlertCircle, Inbox, Plus, X } from "lucide-react";
import { toast } from "sonner";

export default function ModuleTarefasRedacao({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const origem: OrigemProblema = "redacao";
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
    setProblemas(todos.filter(p => p.origem === origem));
    setIsLoaded(true);
  };

  const refresh = () => {
    if (userId) fetchProblemas(userId);
  };

  const handleDeletar = async (id: string) => {
    if (confirm("Excluir esta tarefa?")) {
      const ok = await deletarProblema(id);
      if (ok) {
        toast.success("Tarefa excluída");
        refresh();
      }
    }
  };

  const handleConcluir = async () => {
    if (!modalConcluir.id) return;
    setIsSaving(true);
    const ok = await concluirProblema(
      modalConcluir.id,
      formConcluir.tempo ? parseInt(formConcluir.tempo) : null,
      formConcluir.conforto || null
    );
    if (ok) {
      toast.success('Tarefa concluída!');
      setModalConcluir({ open: false, id: null });
      setFormConcluir({ tempo: '', conforto: 0 });
      refresh();
    } else {
      toast.error('Erro ao concluir tarefa.');
    }
    setIsSaving(false);
  };

  const hoje = new Date().toISOString().split('T')[0];
  const paraHoje = problemas.filter(p => p.status === 'pendente' && p.agendado_para === hoje);
  const fila = problemas.filter(p => p.status === 'pendente' && p.agendado_para !== hoje);

  const ProblemaCard = ({ prob, showDate = true }: { prob: ProblemaEstudo; showDate?: boolean }) => {
    const cor = ORIGEM_COLORS[prob.origem];
    return (
      <div className={`bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 border transition-all hover:shadow-md ${
        prob.prioridade === 1 ? 'border-orange-200 dark:border-orange-500/30' : 'border-slate-100 dark:border-[#2C2C2E]'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${cor.bg} ${cor.text} ${cor.darkBg} ${cor.darkText}`}>
              {ORIGEM_LABELS[prob.origem]}
            </span>
            {prob.prioridade === 1 && (
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                Urgente
              </span>
            )}
            {prob.tipo_erro && (
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                TIPO_ERRO_COLORS[prob.tipo_erro].bg
              } ${TIPO_ERRO_COLORS[prob.tipo_erro].text}`}>
                {TIPO_ERRO_LABELS[prob.tipo_erro]}
              </span>
            )}
          </div>
          <button
            onClick={() => handleDeletar(prob.id)}
            className="p-1.5 text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 flex-shrink-0 transition-colors"
          >
            <Trash className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="font-black text-slate-800 dark:text-white text-sm leading-snug mb-2">
          {prob.titulo}
        </p>
        {(prob.prova || prob.ano || prob.q_num) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400 dark:text-slate-500 mb-3">
            {prob.prova && <span>{prob.prova}</span>}
            {prob.ano && <span>· {prob.ano}</span>}
            {prob.cor_prova && <span>· Cor {prob.cor_prova}</span>}
            {prob.q_num && <span>· Q.{prob.q_num}</span>}
          </div>
        )}
        {prob.comentario && (
          <p className="text-xs text-slate-400 italic mb-3 line-clamp-2">"{prob.comentario}"</p>
        )}
        <div className="flex items-center justify-between mt-3">
          {showDate && prob.agendado_para ? (
            <span className="text-[10px] text-slate-400">
              Agendado: {new Date(prob.agendado_para + 'T12:00:00').toLocaleDateString('pt-BR')}
            </span>
          ) : <span />}
          <button
            onClick={() => { setModalConcluir({ open: true, id: prob.id }); }}
            className="flex items-center gap-1.5 bg-[#1B2B5E] hover:bg-blue-900 text-white text-xs font-black px-4 py-2 rounded-xl uppercase tracking-widest transition-all active:scale-95"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Concluir
          </button>
        </div>
      </div>
    );
  };

  if (!isLoaded) return <div className="p-8 text-center text-slate-400 animate-pulse">Carregando tarefas...</div>;

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
            Nenhuma tarefa pendente para hoje.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paraHoje.map(p => <ProblemaCard key={p.id} prob={p} showDate={false} />)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fila.map(p => <ProblemaCard key={p.id} prob={p} />)}
          </div>
        )}
      </div>

      {/* Modal Concluir */}
      {modalConcluir.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-black mb-6 text-slate-800 dark:text-white">Concluir Tarefa</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-wider">Tempo Gasto (minutos)</label>
                <input 
                  type="number" 
                  value={formConcluir.tempo} 
                  onChange={e => setFormConcluir({...formConcluir, tempo: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-800 dark:text-white placeholder-slate-400"
                  placeholder="Opcional"
                />
              </div>
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
