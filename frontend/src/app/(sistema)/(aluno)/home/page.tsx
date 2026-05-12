"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Calendar, 
  Clock,
  Trophy, 
  MessageSquare, 
  AlertCircle,
  Loader2,
  ChevronDown,
  CheckCircle2,
  Layers,
  Target,
  X
} from "lucide-react";
import { format, differenceInDays, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useGlobalPresence } from "@/components/GlobalPresenceProvider";

// --- CUSTOM DROPDOWN ---
function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = "",
  dropdownClasses = "",
  onDeleteItem
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
  dropdownClasses?: string;
  onDeleteItem?: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => o.value === value);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left flex justify-between items-center outline-none transition-all ${className} ${disabled ? 'opacity-50 cursor-not-allowed shadow-none' : 'cursor-pointer hover:border-white/40 focus:ring-4 focus:ring-white/10'}`}
      >
        <span className="truncate">{selectedOpt ? selectedOpt.label : <span className="opacity-70 font-medium">{placeholder}</span>}</span>
        <ChevronDown className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : 'text-white/70'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
             initial={{ opacity: 0, y: -8, scale: 0.98 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: -8, scale: 0.98 }}
             transition={{ duration: 0.2, ease: "easeOut" }}
             className={`absolute z-[100] w-full mt-2 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden ${dropdownClasses}`}
          >
             <div className="max-h-60 overflow-y-auto p-1.5 flex flex-col gap-1 custom-scrollbar">
                {[...options].sort((a, b) => {
                   if (a.value === "") return -1;
                   if (b.value === "") return 1;
                   return a.label.localeCompare(b.label);
                }).map((opt) => (
                   <div key={opt.value} className="flex items-center group">
                     <button
                       type="button"
                       onClick={() => {
                          onChange(opt.value);
                          setIsOpen(false);
                       }}
                       className={`flex-1 text-left px-3 py-2.5 rounded-l-xl text-sm font-bold transition-all ${value === opt.value ? 'bg-white/20 text-white shadow-lg shadow-black/10' : 'hover:bg-white/10 text-white/90'}`}
                     >
                       {opt.label}
                     </button>
                     {onDeleteItem && (
                       <button
                         type="button"
                         onClick={(e) => {
                           e.stopPropagation();
                           onDeleteItem(opt.value);
                         }}
                         className={`px-3 py-2.5 rounded-r-xl transition-all hover:bg-rose-500/20 text-white/50 hover:text-rose-400 ${value === opt.value ? 'bg-white/20' : ''}`}
                       >
                         <X className="w-4 h-4" />
                       </button>
                     )}
                   </div>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [userName, setUserName] = useState("Estudante");
  const [userId, setUserId] = useState<string | null>(null);
  const [adminAvisos, setAdminAvisos] = useState<any[]>([]);
  const [wallPosts, setWallPosts] = useState<any[]>([]);
  const [newPostText, setNewPostText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const { onlineUsers } = useGlobalPresence();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('home_selectedEventId') || null;
    }
    return null;
  });
  const [allEventsForSelect, setAllEventsForSelect] = useState<any[]>([]);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");

  // Meta do dia — Estudo
  const [problemasHoje, setProblemasHoje] = useState<any[]>([]);
  
  const supabase = createClient();
  const TODAY = new Date();


  // 1. Busca inicial de dados do usuário
  useEffect(() => {
    const initUser = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        
        if (user) {
          setUserId(user.id);
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('nome')
            .eq('id', user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error("Erro ao buscar perfil:", profileError);
          } else if (profile?.nome) {
            setUserName(profile.nome);
          } else {
            console.warn("Perfil não encontrado ou sem nome para o ID:", user.id);
          }
        }
      } catch (err) {
        console.error("Erro na inicialização do usuário:", err);
      }
    };
    initUser();
  }, []);

  // 2. Busca de dados do Dashboard (Eventos, Mural e Avisos)
  useEffect(() => {
    fetchAvisos();
    fetchWall();
    setIsLoaded(true);
  }, []);

  // 3. Sistema de Realtime (Mural)
  useEffect(() => {
    if (!userId) return;

    let mounted = true;
    
    // Mural Channel
    const muralChannel = supabase
      .channel('mural_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mural_comunidade' }, () => {
        if (mounted) fetchWall();
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(muralChannel);
    };
  }, [userId]);

  // Busca todos os eventos futuros (pessoais) para o seletor de contagem
  useEffect(() => {
    if (!userId) return;
    const fetchAllEvents = async () => {
      const { data } = await supabase
        .from('calendario_eventos')
        .select('*')
        .eq('user_id', userId)
        .gte('date_iso', new Date().toISOString().split('T')[0])
        .order('date_iso', { ascending: true });
      if (data) setAllEventsForSelect(data);
    };
    fetchAllEvents();
  }, [userId]);

  // Busca problemas de estudo agendados para hoje
  useEffect(() => {
    if (!userId) return;
    const fetchMetaHoje = async () => {
      const hoje = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('problemas_estudo')
        .select('id, titulo, status, prioridade, disciplina_nome, origem')
        .eq('user_id', userId)
        .eq('agendado_para', hoje);
      if (data) setProblemasHoje(data);
    };
    fetchMetaHoje();
  }, [userId]);

  const selectedEvent = allEventsForSelect.find(e => e.id === selectedEventId);
  const daysToSelectedEvent = selectedEvent 
    ? Math.max(0, differenceInCalendarDays(new Date(selectedEvent.date_iso + "T00:00:00"), new Date()))
    : null;


  const fetchAvisos = async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('calendario_eventos')
      .select('*')
      .eq('tipo', 'aviso_admin')
      .eq('is_published', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false })
      .limit(1);
    if (data) setAdminAvisos(data);
  };

  const fetchWall = async () => {
    const { data } = await supabase
      .from('mural_comunidade')
      .select(`
        *,
        profiles (nome, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) setWallPosts(data);
  };

  const handlePostComunidade = async () => {
    if (!newPostText.trim() || !userId || isPosting) return;

    setIsPosting(true);
    const { error } = await supabase
      .from('mural_comunidade')
      .insert([
        { 
          aluno_id: userId,
          conteudo: newPostText,
          tipo: 'student' 
        }
      ]);

    if (!error) {
      setNewPostText("");
      fetchWall();
    }
    setIsPosting(false);
  };

  const handleCreateEvent = async () => {
    if (!userId) {
      toast.error("Erro de autenticação.");
      return;
    }
    if (!newEventTitle.trim() || !newEventDate) {
      toast.error("Preencha o título e a data do evento.");
      return;
    }

    const { data, error } = await supabase
      .from('calendario_eventos')
      .insert({
        user_id: userId,
        titulo: newEventTitle,
        date_iso: newEventDate,
        tipo: 'pessoal',
        time_slot: '00:00',
        color_class: 'bg-indigo-500 text-white'
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar evento:", error);
      toast.error("Erro ao criar evento: " + error.message);
      return;
    }

    if (data) {
      toast.success("Evento criado com sucesso!");
      setAllEventsForSelect(prev => [...prev, data].sort((a, b) => new Date(a.date_iso).getTime() - new Date(b.date_iso).getTime()));
      setSelectedEventId(data.id);
      localStorage.setItem('home_selectedEventId', data.id);
      setIsCreatingEvent(false);
      setNewEventTitle("");
      setNewEventDate("");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Tem certeza que deseja apagar esse evento?")) return;
    
    const { error } = await supabase
      .from('calendario_eventos')
      .delete()
      .eq('id', eventId);

    if (error) {
      toast.error("Erro ao apagar evento: " + error.message);
    } else {
      toast.success("Evento apagado.");
      setAllEventsForSelect(prev => prev.filter(e => e.id !== eventId));
      if (selectedEventId === eventId) {
        setSelectedEventId(null);
        localStorage.removeItem('home_selectedEventId');
      }
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return "Agora mesmo";
    if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Há ${Math.floor(diff / 3600)}h`;
    return format(date, "dd/MM", { locale: ptBR });
  };

  if (!isLoaded) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-24">
      
      {/* Header Boas-vindas */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
            Olá, {userName.split(' ')[0]}! <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-slate-500 dark:text-[#A1A1AA] mt-1 font-medium text-sm md:text-lg">Bem-vindo de volta à sua plataforma de aprovação.</p>
        </div>
        <div className="hidden md:flex bg-white dark:bg-[#1C1C1E] px-6 py-3 rounded-2xl border border-slate-100 dark:border-[#2C2C2E] shadow-sm items-center gap-3">
          <Calendar className="w-5 h-5 text-[#1B2B5E] dark:text-blue-400" />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </span>
        </div>
      </header>

      {/* Banner de Comunicado do Sistema */}
      {adminAvisos.length > 0 && (() => {
        const aviso = adminAvisos[0];
        const daysLeft = aviso.expires_at
          ? differenceInDays(new Date(aviso.expires_at), new Date())
          : null;
        const hoursLeft = aviso.expires_at
          ? Math.floor((new Date(aviso.expires_at).getTime() - Date.now()) / 3600000)
          : null;
        const expiryLabel = daysLeft === null
          ? null
          : daysLeft >= 1
            ? `Expira em ${daysLeft}d`
            : `Expira em ${Math.max(0, hoursLeft ?? 0)}h`;
        const expiryColor =
          daysLeft === null ? "" :
          daysLeft < 1 ? "bg-rose-400/30 text-rose-100" :
          daysLeft <= 2 ? "bg-amber-400/30 text-amber-100" :
          "bg-white/15 text-indigo-100";
        return (
          <div className="bg-indigo-600 rounded-3xl p-5 text-white shadow-xl shadow-indigo-600/20 border border-indigo-500 overflow-hidden relative animate-in slide-in-from-top-4">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/20">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Comunicado do Sistema</span>
                  <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded text-white italic">
                    {format(new Date(aviso.created_at), "dd/MM 'às' HH:mm")}
                  </span>
                  {expiryLabel && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${expiryColor}`}>
                      <Clock className="w-2.5 h-2.5" /> {expiryLabel}
                    </span>
                  )}
                </div>
                <h2 className="text-base font-black mb-1">{aviso.titulo}</h2>
                <p className="text-indigo-100 font-medium text-sm leading-relaxed">{aviso.descricao}</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Seção Destaque: Meta do Dia */}
      {(() => {
        const total = problemasHoje.length;
        const concluidos = problemasHoje.filter(p => p.status === 'concluido').length;
        const pct = total === 0 ? 0 : Math.round((concluidos / total) * 100);
        const metaBatida = total > 0 && concluidos === total;

        return (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-[2.5rem] p-8 md:p-10 border relative overflow-hidden transition-all shadow-lg ${
              metaBatida
                ? 'bg-gradient-to-br from-[#1B2B5E] to-[#243870] border-[#1B2B5E] text-white shadow-[#1B2B5E]/25'
                : 'bg-white dark:bg-[#1C1C1E] border-slate-100 dark:border-[#2C2C2E]'
            }`}
          >
            {/* Ícone decorativo maior */}
            <Layers className={`absolute -right-6 -bottom-6 w-48 h-48 transition-all opacity-10 ${
              metaBatida ? 'text-white' : 'text-slate-200 dark:text-white'
            }`} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${metaBatida ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <Target className={`w-6 h-6 ${metaBatida ? 'text-[#F97316]' : 'text-[#1B2B5E] dark:text-blue-400'}`} />
                  </div>
                  <div>
                    <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${metaBatida ? 'text-white/70' : 'text-slate-400'}`}>
                      Foco de Hoje
                    </h3>
                    <h2 className="text-xl md:text-2xl font-black tracking-tight">Meta do Dia</h2>
                  </div>
                </div>
                {metaBatida && (
                  <div className="flex items-center gap-2 bg-[#F97316] text-white px-4 py-2 rounded-2xl shadow-lg shadow-[#F97316]/30 animate-bounce">
                    <Trophy className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-wider">Meta Batida!</span>
                  </div>
                )}
              </div>

              {total === 0 ? (
                <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/50 dark:bg-white/5 rounded-3xl px-8 border border-dashed border-slate-200 dark:border-white/10">
                  <div className="text-center md:text-left">
                    <p className={`text-lg font-bold ${metaBatida ? 'text-white/80' : 'text-slate-600 dark:text-slate-300'}`}>
                      Você ainda não tem problemas agendados para hoje.
                    </p>
                    <p className="text-sm font-medium text-slate-400">Agende suas revisões ou pratique novos exercícios para evoluir.</p>
                  </div>
                  <a href="/estudo" className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
                    metaBatida ? 'bg-[#F97316] text-white shadow-xl shadow-[#F97316]/20' : 'bg-[#1B2B5E] text-white shadow-xl shadow-[#1B2B5E]/20'
                  }`}>
                    Começar Estudo
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="flex items-baseline gap-3 mb-4">
                      <span className={`text-7xl font-black tabular-nums tracking-tighter ${
                        metaBatida ? 'text-white' : 'text-[#1B2B5E] dark:text-white'
                      }`}>{concluidos}</span>
                      <span className={`text-2xl font-bold ${
                        metaBatida ? 'text-white/60' : 'text-slate-400'
                      }`}>/ {total}</span>
                      <div className="ml-auto text-right">
                        <span className={`text-2xl font-black block ${
                          metaBatida ? 'text-[#F97316]' : 'text-[#1B2B5E] dark:text-blue-400'
                        }`}>{pct}%</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Concluído</span>
                      </div>
                    </div>

                    <div className={`w-full h-4 rounded-full p-1 ${
                      metaBatida ? 'bg-white/10' : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full shadow-sm"
                        style={{
                          backgroundColor: metaBatida ? '#F97316' : '#1B2B5E'
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                    {problemasHoje.map(p => (
                      <div key={p.id} className={`flex items-center gap-4 rounded-2xl p-4 transition-all ${
                        metaBatida ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-50 dark:bg-[#2C2C2E] hover:bg-slate-100 dark:hover:bg-[#3A3A3C]'
                      }`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          p.status === 'concluido' ? 'bg-[#F97316]/20' : 'bg-slate-200 dark:bg-slate-700'
                        }`}>
                          <CheckCircle2 className={`w-4 h-4 ${
                            p.status === 'concluido' ? 'text-[#F97316]' : 'text-slate-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-black block truncate ${
                            p.status === 'concluido' ? 'line-through opacity-50' : ''
                          }`}>
                            {p.titulo}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{p.disciplina_nome || 'Geral'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        );
      })()}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Lado Esquerdo: Mural e Eventos (Col-span 2) — order-2 no mobile */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8 order-2 lg:order-1">
          

          {/* Mural da Comunidade */}
          <section className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm overflow-hidden flex flex-col h-[350px] md:h-[500px]">
             <div className="px-8 py-6 border-b border-slate-50 dark:border-[#2C2C2E] flex justify-between items-center bg-slate-50/50 dark:bg-[#1C1C1E]">
                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-indigo-500" /> Mural da Comunidade
                </h2>
                <div className="flex items-center gap-2">
                  <span className="flex w-2 h-2 rounded-full bg-[#F97316] animate-pulse"></span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tempo Real</p>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8 space-y-6 hidden-scrollbar bg-slate-50/20 dark:bg-transparent">
                {wallPosts.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center opacity-40">
                      <MessageSquare className="w-12 h-12 mb-4" />
                      <p className="font-bold text-sm">Seja o primeiro a postar algo!</p>
                   </div>
                )}
                
                {wallPosts.map(post => (
                  <div key={post.id} className="flex gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-lg font-bold shadow-sm ${post.tipo === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-[#2C2C2E] text-slate-400'}`}>
                      {post.profiles?.avatar_url ? (
                        <img src={post.profiles.avatar_url} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        post.profiles?.nome?.[0] || '?'
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className={`text-sm font-black ${post.tipo === 'admin' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-white'}`}>
                           {post.tipo === 'admin' ? 'Administrador' : (post.profiles?.nome || 'Usuário')} {post.tipo === 'admin' && "👑"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{formatTimeAgo(post.created_at)}</span>
                      </div>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed break-words ${post.tipo === 'admin' ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-900 dark:text-indigo-100 font-medium' : 'bg-white dark:bg-[#2C2C2E] border border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-300 shadow-sm'}`}>
                        {post.conteudo}
                      </div>
                    </div>
                  </div>
                ))}
             </div>
             
             <div className="px-8 py-4 border-t border-slate-50 dark:border-[#2C2C2E] flex gap-4 bg-white dark:bg-[#1C1C1E]">
                <input 
                  type="text" 
                  value={newPostText}
                  onChange={e => setNewPostText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePostComunidade()}
                  placeholder="Compartilhe algo com a turma..." 
                  className="flex-1 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium"
                />
                <button 
                  onClick={handlePostComunidade}
                  disabled={isPosting || !newPostText.trim()}
                  className="bg-[#1B2B5E] hover:bg-[#243870] disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-[#1B2B5E]/20 active:scale-95 flex items-center gap-2"
                >
                  {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Postar"}
                </button>
             </div>
          </section>

        </div>

        {/* Lado Direito: Widgets — order-1 no mobile (aparece ANTES do mural) */}
        <div className="space-y-6 md:space-y-8 order-1 lg:order-2">
          
          {/* Widget: Contagem Regressiva Customizada */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group min-h-[220px]">
            <Calendar className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Contagem Regressiva</span>
              
              <div className="mt-4 mb-4 relative">
                <CustomDropdown
                  value={selectedEventId || ""}
                  onChange={(val) => {
                    setSelectedEventId(val || null);
                    if (val) {
                      localStorage.setItem('home_selectedEventId', val);
                    } else {
                      localStorage.removeItem('home_selectedEventId');
                    }
                  }}
                  options={allEventsForSelect.map(ev => ({
                    value: ev.id,
                    label: `${format(new Date(ev.date_iso + "T00:00:00"), "dd/MM")} - ${ev.titulo}`
                  }))}
                  placeholder="Selecione um evento..."
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl px-3 py-3 text-xs focus:ring-2 focus:ring-white/50 outline-none transition-colors backdrop-blur-md cursor-pointer font-medium"
                  dropdownClasses="bg-indigo-950/90"
                  onDeleteItem={handleDeleteEvent}
                />
                <button 
                  onClick={() => setIsCreatingEvent(!isCreatingEvent)}
                  className="w-full mt-2 text-xs text-white/70 hover:text-white font-bold underline text-right transition-colors"
                >
                  {isCreatingEvent ? "Cancelar" : "+ Criar Novo Evento"}
                </button>
              </div>

              {isCreatingEvent ? (
                <div className="bg-white/10 p-4 rounded-2xl flex flex-col gap-3 backdrop-blur-md border border-white/20 animate-in fade-in zoom-in duration-300">
                  <input 
                    type="text" 
                    placeholder="Nome do Evento (ex: ENEM)" 
                    value={newEventTitle} 
                    onChange={e => setNewEventTitle(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                  <input 
                    type="date" 
                    value={newEventDate} 
                    onChange={e => setNewEventDate(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                  <button 
                    onClick={handleCreateEvent}
                    disabled={!newEventTitle || !newEventDate}
                    className="w-full bg-white text-indigo-600 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-100 disabled:opacity-50 transition-all active:scale-95"
                  >
                    Salvar e Iniciar Contagem
                  </button>
                </div>
              ) : selectedEvent ? (
                <>
                  <h3 className="text-sm font-bold truncate mb-4 pr-10">{selectedEvent.titulo}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black tabular-nums tracking-tighter">{daysToSelectedEvent}</span>
                    <span className="text-xl font-bold opacity-80">dias</span>
                  </div>
                  <div className="mt-8 w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-white h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (1 - (daysToSelectedEvent || 0) / 365) * 100)}%` }}
                    ></div>
                  </div>
                </>
              ) : (
                <div className="mt-4 flex flex-col items-center justify-center py-6 border-2 border-dashed border-white/20 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setIsCreatingEvent(true)}>
                   <p className="text-xs font-bold opacity-70 text-center px-4">Selecione ou crie um evento para iniciar a contagem</p>
                </div>
              )}
            </div>
          </div>

          {/* Widget: Online Agora (Real) */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 border border-slate-100 dark:border-[#2C2C2E] shadow-sm relative overflow-hidden">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Users className="w-6 h-6 text-[#F97316]" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#F97316] border-2 border-white dark:border-[#1C1C1E] rounded-full animate-ping"></div>
                  </div>
                  <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs">Ativos Agora</h3>
                </div>
                <span className="text-2xl font-black text-[#F97316]">{onlineUsers.length}</span>
             </div>
             
             <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-[#A1A1AA] font-medium leading-relaxed">
                  {onlineUsers.length > 1 
                    ? `Você está estudando com outros ${onlineUsers.length - 1} colegas agora.`
                    : "Você é o herói solitário estudando neste momento!"}
                </p>
                <div className="flex -space-x-3 overflow-hidden">
                   {onlineUsers.slice(0, 5).map((user, idx) => (
                     <div key={user.user_id || idx} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#2C2C2E] border-4 border-white dark:border-[#1C1C1E] flex items-center justify-center text-xs font-black text-slate-400 overflow-hidden" title={user.nome}>
                        {user.avatar_url ? (
                          <img src={user.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          user.nome?.[0] || "?"
                        )}
                     </div>
                   ))}
                   {onlineUsers.length > 5 && (
                     <div className="w-10 h-10 rounded-full bg-[#1B2B5E] border-4 border-white dark:border-[#1C1C1E] flex items-center justify-center text-[10px] font-black text-white">
                       +{onlineUsers.length - 5}
                     </div>
                   )}
                </div>
             </div>
          </div>



        </div>

      </div>

    </div>
  );
}
