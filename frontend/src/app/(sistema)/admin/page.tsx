"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Megaphone, Radio, Sparkles, Send, AlertCircle,
  Loader2, RefreshCw, Pencil, Trash2, X, Check,
  ChevronDown, ChevronUp, Clock, Infinity,
} from "lucide-react";
import { format, addDays, isPast, differenceInHours, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { createClient } from "@/utils/supabase/client";

// ─── Tipos ─────────────────────────────────────────────────────────────────
interface Comunicado {
  id: string;
  titulo: string;
  descricao: string;
  created_at: string;
  is_published: boolean;
  expires_at: string | null;
}

// ─── Opções de duração ────────────────────────────────────────────────────
const DURATION_OPTIONS = [
  { value: "0",   label: "Sem prazo (fixo)",        icon: "∞" },
  { value: "1",   label: "1 dia",                   icon: "1d" },
  { value: "3",   label: "3 dias",                  icon: "3d" },
  { value: "7",   label: "7 dias (1 semana)",        icon: "7d" },
  { value: "15",  label: "15 dias",                 icon: "15d" },
  { value: "30",  label: "30 dias (1 mês)",          icon: "30d" },
] as const;

// ─── Helper: label de expiração ───────────────────────────────────────────
function expirationLabel(expires_at: string | null): { text: string; color: string } {
  if (!expires_at) return { text: "Sem prazo", color: "text-slate-400" };
  const hoursLeft = differenceInHours(new Date(expires_at), new Date());
  if (hoursLeft < 0) return { text: "Expirado", color: "text-rose-500" };
  if (hoursLeft < 24) return { text: `Expira em ${hoursLeft}h`, color: "text-amber-500" };
  const daysLeft = differenceInDays(new Date(expires_at), new Date());
  return { text: `Expira em ${daysLeft}d`, color: "text-teal-500" };
}

// ─── Modal de Confirmação de Exclusão ──────────────────────────────────────
function ConfirmDeleteModal({
  comunicado,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  comunicado: Comunicado;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-[#2C2C2E] animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-rose-100 dark:bg-rose-500/20 p-3 rounded-2xl">
            <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="font-black text-slate-800 dark:text-white text-lg">Apagar Comunicado</h3>
            <p className="text-xs text-slate-400 font-medium">Esta ação não pode ser desfeita</p>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-[#2C2C2E] rounded-2xl p-4 mb-6">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">"{comunicado.titulo}"</p>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{comunicado.descricao}</p>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          O comunicado será <strong className="text-rose-600">removido permanentemente</strong> do mural dos alunos e do calendário.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-3 bg-slate-100 dark:bg-[#2C2C2E] text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-[#3A3A3C] transition-all disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {isDeleting ? "Apagando..." : "Apagar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ──────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const supabase = createClient();

  const [comunidadePosts, setComunidadePosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loadingComunicados, setLoadingComunicados] = useState(true);
  const [showComunicados, setShowComunicados] = useState(true);

  const [avisoTitle, setAvisoTitle] = useState("");
  const [avisoDesc, setAvisoDesc] = useState("");
  const [avisoDuration, setAvisoDuration] = useState<string>("7"); // padrão 7 dias
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado de edição
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estado de exclusão
  const [deletingComunicado, setDeletingComunicado] = useState<Comunicado | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── Fetch comunidade ────────────────────────────────────────────────────
  const fetchCommunityPosts = useCallback(async () => {
    setLoadingPosts(true);
    const { data } = await supabase
      .from("mural_comunidade")
      .select("*, profiles(nome, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setComunidadePosts(data);
    setLoadingPosts(false);
  }, []);

  // ─── Fetch comunicados admin ─────────────────────────────────────────────
  const fetchComunicados = useCallback(async () => {
    setLoadingComunicados(true);
    const { data } = await supabase
      .from("calendario_eventos")
      .select("id, titulo, descricao, created_at, is_published, expires_at")
      .eq("tipo", "aviso_admin")
      .order("created_at", { ascending: false });
    if (data) setComunicados(data as Comunicado[]);
    setLoadingComunicados(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchCommunityPosts();
    fetchComunicados();
    const channel = supabase
      .channel("admin_mural_watch")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mural_comunidade" }, () => {
        if (mounted) fetchCommunityPosts();
      })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  // ─── Calcula o expires_at a partir dos dias selecionados ─────────────────
  const computeExpiresAt = (days: string): string | null => {
    if (days === "0") return null;
    return addDays(new Date(), parseInt(days)).toISOString();
  };

  // ─── Publicar OU Atualizar aviso ─────────────────────────────────────────
  const handleSendAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avisoTitle.trim() || !avisoDesc.trim()) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const expiresAt = computeExpiresAt(avisoDuration);

      if (editingId) {
        // MODO EDIÇÃO
        await supabase
          .from("calendario_eventos")
          .update({ titulo: avisoTitle, descricao: avisoDesc, expires_at: expiresAt })
          .eq("id", editingId);
        setEditingId(null);
      } else {
        // MODO CRIAÇÃO
        await supabase.from("calendario_eventos").insert({
          user_id: user?.id,
          titulo: avisoTitle,
          descricao: avisoDesc,
          tipo: "aviso_admin",
          date_iso: new Date().toISOString().split("T")[0],
          time_slot: format(new Date(), "HH:mm", { locale: ptBR }),
          color_class: "bg-indigo-500",
          is_published: true,
          expires_at: expiresAt,
        });
        await supabase.from("mural_comunidade").insert({
          aluno_id: user?.id,
          conteudo: `📢 [AVISO OFICIAL] ${avisoTitle}: ${avisoDesc}`,
          tipo: "admin",
        });
      }

      await fetchComunicados();
      await fetchCommunityPosts();
      setAvisoTitle("");
      setAvisoDesc("");
      setAvisoDuration("7");
    } catch (err: any) {
      alert(`❌ Erro ao salvar: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Iniciar edição ──────────────────────────────────────────────────────
  const handleStartEdit = (c: Comunicado) => {
    setEditingId(c.id);
    setAvisoTitle(c.titulo);
    setAvisoDesc(c.descricao ?? "");
    // Pré-seleciona a duração mais próxima do expires_at atual
    if (!c.expires_at) {
      setAvisoDuration("0");
    } else {
      const daysLeft = Math.max(1, differenceInDays(new Date(c.expires_at), new Date()));
      const closest = ["1","3","7","15","30"].reduce((prev, cur) =>
        Math.abs(parseInt(cur) - daysLeft) < Math.abs(parseInt(prev) - daysLeft) ? cur : prev
      );
      setAvisoDuration(closest);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── Cancelar edição ─────────────────────────────────────────────────────
  const handleCancelEdit = () => {
    setEditingId(null);
    setAvisoTitle("");
    setAvisoDesc("");
    setAvisoDuration("7");
  };

  // ─── Apagar comunicado ───────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deletingComunicado) return;
    setIsDeleting(true);
    try {
      await supabase.from("calendario_eventos").delete().eq("id", deletingComunicado.id);
      await supabase
        .from("mural_comunidade")
        .delete()
        .eq("tipo", "admin")
        .ilike("conteudo", `%${deletingComunicado.titulo}%`);
      await fetchComunicados();
      await fetchCommunityPosts();
      setDeletingComunicado(null);
    } catch (err: any) {
      alert(`❌ Erro ao apagar: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s atrás`;
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  const isEditing = !!editingId;

  return (
    <>
      {deletingComunicado && (
        <ConfirmDeleteModal
          comunicado={deletingComunicado}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingComunicado(null)}
          isDeleting={isDeleting}
        />
      )}

      <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 px-4 md:px-0 font-sans">

        {/* HEADER */}
        <header className="mb-6 relative">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
                <div className="bg-indigo-600 p-3 rounded-[1.2rem] shadow-lg shadow-indigo-600/20">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                Centro de Comando
              </h1>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-3 ml-2">Radar da Comunidade &amp; Avisos Oficiais</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Coluna Esquerda - Avisos */}
          <div className="space-y-6 lg:col-span-4 flex flex-col">

            {/* Formulário de criação/edição */}
            <div className={`rounded-[2rem] p-6 border shadow-xl relative overflow-hidden transition-all duration-300 ${
              isEditing
                ? "bg-gradient-to-br from-amber-500 to-orange-600 border-amber-400 shadow-amber-500/20"
                : "bg-gradient-to-br from-indigo-600 to-violet-700 border-indigo-500 shadow-indigo-500/20"
            }`}>
              <Megaphone className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 pointer-events-none" />
              <div className="relative z-10">
                <h3 className="font-black text-white mb-6 flex items-center gap-2 text-lg">
                  {isEditing
                    ? <><Pencil className="w-6 h-6" /> Editar Comunicado</>
                    : <><AlertCircle className="w-6 h-6" /> Avisos Oficiais para Alunos</>
                  }
                </h3>
                <form onSubmit={handleSendAviso} className="space-y-4">
                  {/* Título */}
                  <div>
                    <label className="text-[10px] uppercase font-black text-white/70 tracking-[0.2em] mb-2 block">Título do Aviso</label>
                    <input
                      type="text"
                      value={avisoTitle}
                      onChange={e => setAvisoTitle(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-white/50 outline-none transition-colors backdrop-blur-md disabled:opacity-60"
                      placeholder="Ex: Novo Simulado Liberado! 🚨"
                    />
                  </div>
                  {/* Conteúdo */}
                  <div>
                    <label className="text-[10px] uppercase font-black text-white/70 tracking-[0.2em] mb-2 block">Conteúdo</label>
                    <textarea
                      value={avisoDesc}
                      onChange={e => setAvisoDesc(e.target.value)}
                      required
                      rows={3}
                      disabled={isSubmitting}
                      className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-white/50 outline-none transition-colors backdrop-blur-md resize-none disabled:opacity-60"
                      placeholder="Detalhes para os alunos..."
                    />
                  </div>

                  {/* ─── SELETOR DE DURAÇÃO ─── */}
                  <div>
                    <label className="text-[10px] uppercase font-black text-white/70 tracking-[0.2em] mb-2 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Fixar na home por
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {DURATION_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setAvisoDuration(opt.value)}
                          className={`py-2 px-3 rounded-xl text-xs font-black transition-all border flex flex-col items-center gap-0.5 ${
                            avisoDuration === opt.value
                              ? "bg-white text-indigo-700 border-white shadow-lg scale-[1.03]"
                              : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                          } disabled:opacity-60`}
                        >
                          <span className="text-base leading-none">{opt.value === "0" ? <Infinity className="w-4 h-4 inline" /> : opt.icon}</span>
                          <span className="text-[9px] leading-tight text-center opacity-80">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-white/50 mt-2 text-center">
                      {avisoDuration === "0"
                        ? "O comunicado ficará visível indefinidamente"
                        : `O comunicado sumirá automaticamente em ${avisoDuration} ${parseInt(avisoDuration) === 1 ? "dia" : "dias"}`
                      }
                    </p>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-2">
                    {isEditing && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isSubmitting}
                        className="flex-shrink-0 py-3 px-4 bg-white/20 text-white hover:bg-white/30 font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-60"
                      >
                        <X className="w-4 h-4" /> Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-white text-indigo-700 hover:bg-slate-100 font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center gap-2 justify-center disabled:opacity-60"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                      {isSubmitting ? "Salvando..." : isEditing ? "Salvar Alterações" : "Publicar na Home dos Alunos"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Lista de Comunicados Publicados */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm overflow-hidden">
              <button
                onClick={() => setShowComunicados(v => !v)}
                className="w-full px-6 py-4 flex justify-between items-center bg-slate-50/50 dark:bg-[#1C1C1E] hover:bg-slate-50 dark:hover:bg-[#2C2C2E] transition-colors"
              >
                <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2 text-sm">
                  <Megaphone className="w-4 h-4 text-indigo-500" />
                  Comunicados Publicados
                  {!loadingComunicados && (
                    <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {comunicados.length}
                    </span>
                  )}
                </h3>
                {showComunicados ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {showComunicados && (
                <div className="divide-y divide-slate-50 dark:divide-[#2C2C2E] max-h-80 overflow-y-auto">
                  {loadingComunicados ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                    </div>
                  ) : comunicados.length === 0 ? (
                    <div className="py-8 text-center opacity-50">
                      <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-400">Nenhum comunicado publicado.</p>
                    </div>
                  ) : comunicados.map((c) => {
                    const expLabel = expirationLabel(c.expires_at);
                    const expired = c.expires_at ? isPast(new Date(c.expires_at)) : false;
                    return (
                      <div
                        key={c.id}
                        className={`px-5 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-[#2C2C2E] transition-colors group ${
                          editingId === c.id ? "bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400" : ""
                        } ${expired ? "opacity-60" : ""}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{c.titulo}</p>
                            {expired && (
                              <span className="flex-shrink-0 text-[9px] font-black bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-full">expirado</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{c.descricao}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] text-slate-400 font-medium">{formatTimeAgo(c.created_at)}</p>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span className={`text-[10px] font-black flex items-center gap-0.5 ${expLabel.color}`}>
                              {c.expires_at ? <Clock className="w-2.5 h-2.5" /> : <Infinity className="w-2.5 h-2.5" />}
                              {expLabel.text}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(c)}
                            title="Editar comunicado"
                            className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingComunicado(c)}
                            title="Apagar comunicado"
                            className="p-2 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-500/30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita - Radar da Comunidade */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm flex flex-col overflow-hidden" style={{ minHeight: 420 }}>
              <div className="px-6 py-4 border-b border-slate-50 dark:border-[#2C2C2E] flex justify-between items-center bg-slate-50/50 dark:bg-[#1C1C1E]">
                <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-rose-500 animate-pulse" /> Radar da Comunidade
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 font-bold px-3 py-1 rounded-full animate-pulse capitalize tracking-widest">Live</span>
                  <button onClick={fetchCommunityPosts} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/20 dark:bg-black/10">
                {loadingPosts
                  ? <div className="flex items-center justify-center h-full py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                  : comunidadePosts.length === 0
                    ? <div className="flex flex-col items-center justify-center h-full py-16 opacity-50"><Radio className="w-12 h-12 text-slate-300 mb-2" /><p className="text-sm font-bold text-slate-400">Nenhuma conversa recente.</p></div>
                    : comunidadePosts.map((post) => (
                      <div key={post.id} className="flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 overflow-hidden">
                          {post.tipo === "admin"
                            ? "A"
                            : post.profiles?.avatar_url
                              ? <img src={post.profiles.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                              : (post.profiles?.nome?.[0] || "?")}
                        </div>
                        <div className="flex-1 bg-white dark:bg-[#2C2C2E] border border-slate-100 dark:border-[#3A3A3C] px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className={`text-xs font-black ${post.tipo === "admin" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-800 dark:text-white"}`}>
                              {post.tipo === "admin" ? "Administrador" : (post.profiles?.nome || "Usuário")} {post.tipo === "admin" && "👑"}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{formatTimeAgo(post.created_at)}</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{post.conteudo}</p>
                        </div>
                      </div>
                    ))
                }
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
