"use client";

import { useState, useEffect } from "react";
import {
  Megaphone, Radio, Sparkles, Send, LayoutDashboard,
  AlertCircle, Loader2, RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { createClient } from "@/utils/supabase/client";

// ─── Página Principal ──────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const supabase = createClient();

  const [comunidadePosts, setComunidadePosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [avisoTitle, setAvisoTitle] = useState("");
  const [avisoDesc, setAvisoDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchCommunityPosts();
    const channel = supabase
      .channel("admin_mural_watch")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mural_comunidade" }, () => {
        if (mounted) fetchCommunityPosts();
      })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  const fetchCommunityPosts = async () => {
    setLoadingPosts(true);
    const { data } = await supabase
      .from("mural_comunidade")
      .select("*, profiles(nome, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setComunidadePosts(data);
    setLoadingPosts(false);
  };

  const handleSendAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avisoTitle.trim() || !avisoDesc.trim()) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("calendario_eventos").insert({
        user_id: user?.id,
        titulo: avisoTitle,
        descricao: avisoDesc,
        tipo: "aviso_admin",
        date_iso: new Date().toISOString().split("T")[0],
        time_slot: format(new Date(), "HH:mm", { locale: ptBR }),
        color_class: "bg-indigo-500",
        is_published: true,
      });
      await supabase.from("mural_comunidade").insert({
        aluno_id: user?.id,
        conteudo: `📢 [AVISO OFICIAL] ${avisoTitle}: ${avisoDesc}`,
        tipo: "admin",
      });
      setAvisoTitle(""); setAvisoDesc("");
      alert("✅ Aviso publicado com sucesso!");
    } catch (err: any) {
      alert(`❌ Erro ao publicar: ${err.message}`);
    } finally { setIsSubmitting(false); }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s atrás`;
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return format(new Date(dateStr), "dd/MM", { locale: ptBR });
  };

  return (
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
        <div className="space-y-8 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] p-6 border border-indigo-500 shadow-xl shadow-indigo-500/20 relative overflow-hidden">
            <Megaphone className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 pointer-events-none" />
            <div className="relative z-10">
              <h3 className="font-black text-white mb-6 flex items-center gap-2 text-lg">
                <AlertCircle className="w-6 h-6" /> Avisos Oficiais para Alunos
              </h3>
              <form onSubmit={handleSendAviso} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-indigo-200 tracking-[0.2em] mb-2 block">Título do Aviso</label>
                  <input type="text" value={avisoTitle} onChange={e => setAvisoTitle(e.target.value)} required disabled={isSubmitting} className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-white/50 outline-none transition-colors backdrop-blur-md disabled:opacity-60" placeholder="Ex: Novo Simulado Liberado! 🚨" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-indigo-200 tracking-[0.2em] mb-2 block">Conteúdo</label>
                  <textarea value={avisoDesc} onChange={e => setAvisoDesc(e.target.value)} required rows={3} disabled={isSubmitting} className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-white/50 outline-none transition-colors backdrop-blur-md resize-none disabled:opacity-60" placeholder="Detalhes para os alunos..." />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-white text-indigo-700 hover:bg-slate-100 font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center gap-2 justify-center disabled:opacity-60">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isSubmitting ? "Publicando..." : "Publicar na Home dos Alunos"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Coluna Direita - Radar da Comunidade */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm flex flex-col overflow-hidden" style={{ minHeight: 420 }}>
            <div className="px-6 py-4 border-b border-slate-50 dark:border-[#2C2C2E] flex justify-between items-center bg-slate-50/50 dark:bg-[#1C1C1E]">
              <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2"><Radio className="w-5 h-5 text-rose-500 animate-pulse" /> Radar da Comunidade</h3>
              <div className="flex items-center gap-3">
                <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 font-bold px-3 py-1 rounded-full animate-pulse capitalize tracking-widest">Live</span>
                <button onClick={fetchCommunityPosts} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/20 dark:bg-black/10">
              {loadingPosts ? <div className="flex items-center justify-center h-full py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                : comunidadePosts.length === 0 ? <div className="flex flex-col items-center justify-center h-full py-16 opacity-50"><Radio className="w-12 h-12 text-slate-300 mb-2" /><p className="text-sm font-bold text-slate-400">Nenhuma conversa recente.</p></div>
                : comunidadePosts.map((post) => (
                  <div key={post.id} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 overflow-hidden">
                      {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} className="w-full h-full object-cover" /> : (post.profiles?.nome?.[0] || "?")}
                    </div>
                    <div className="flex-1 bg-white dark:bg-[#2C2C2E] border border-slate-100 dark:border-[#3A3A3C] px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className={`text-xs font-black ${post.tipo === "admin" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-800 dark:text-white"}`}>{post.profiles?.nome || "Usuário"} {post.tipo === "admin" && "👑"}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{formatTimeAgo(post.created_at)}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{post.conteudo}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
