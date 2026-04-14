"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Calendar, 
  Clock, 
  Trophy, 
  MessageSquare, 
  ChevronRight, 
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

// --- CUSTOM DROPDOWN ---
function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = "",
  dropdownClasses = ""
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
  dropdownClasses?: string;
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
                {options.map((opt) => (
                   <button
                     key={opt.value}
                     type="button"
                     onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                     }}
                     className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${value === opt.value ? 'bg-white/20 text-white shadow-lg shadow-black/10' : 'hover:bg-white/10 text-white/90'}`}
                   >
                     {opt.label}
                   </button>
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
  const [events, setEvents] = useState<any[]>([]);
  const [adminAvisos, setAdminAvisos] = useState<any[]>([]);
  const [wallPosts, setWallPosts] = useState<any[]>([]);
  const [newPostText, setNewPostText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('home_selectedEventId') || null;
    }
    return null;
  });
  const [allEventsForSelect, setAllEventsForSelect] = useState<any[]>([]);
  
  const supabase = createClient();
  const TODAY = new Date();

  // Cálculo de dias para o ENEM (Supondo 1º domingo de Nov de 2026)
  const targetDate = new Date(2026, 10, 1); // 1 de Nov de 2026
  const daysToExam = Math.max(0, differenceInDays(targetDate, TODAY));

  // 1. Busca inicial de dados do usuário
  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase.from('profiles').select('nome, liga').eq('id', user.id).single();
        if (profile?.nome) setUserName(profile.nome);
      }
    };
    initUser();
  }, []);

  // 2. Busca de dados do Dashboard (Eventos, Mural, Avisos)
  useEffect(() => {
    fetchEvents();
    fetchAvisos();
    fetchWall();
    setIsLoaded(true);
  }, []);

  // 3. Sistema de Realtime (Presença e Mural)
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

    // Presence Channel
    const presenceChannel = supabase.channel('online-hub', {
      config: {
        presence: { key: userId },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        if (!mounted) return;
        const newState = presenceChannel.presenceState();
        const users = Object.values(newState).flat().map((p: any) => ({
          id: p.user_id,
          nome: p.nome,
          avatar_url: p.avatar_url,
          last_seen: new Date().toISOString()
        }));
        const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());
        setOnlineUsers(uniqueUsers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && mounted) {
          const { data: profile } = await supabase.from('profiles').select('nome, avatar_url').eq('id', userId).single();
          if (mounted) {
            await presenceChannel.track({
              user_id: userId,
              nome: profile?.nome || 'Estudante',
              avatar_url: profile?.avatar_url,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      mounted = false;
      supabase.removeChannel(muralChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [userId]);

  // Busca todos os eventos futuros (pessoais + avisos admin) para o seletor de contagem
  useEffect(() => {
    if (!userId) return;
    const fetchAllEvents = async () => {
      // Busca eventos do usuário OR avisos do admin
      const { data } = await supabase
        .from('calendario_eventos')
        .select('*')
        .or(`user_id.eq.${userId},tipo.eq.aviso_admin`)
        .gte('date_iso', new Date().toISOString().split('T')[0])
        .order('date_iso', { ascending: true });
      if (data) setAllEventsForSelect(data);
    };
    fetchAllEvents();
  }, [userId]);

  const selectedEvent = allEventsForSelect.find(e => e.id === selectedEventId);
  const daysToSelectedEvent = selectedEvent 
    ? Math.max(0, differenceInDays(new Date(selectedEvent.date_iso), TODAY))
    : null;

  const fetchEvents = async () => {
    const hojeStr = format(TODAY, "yyyy-MM-dd");
    const { data } = await supabase
      .from('calendario_eventos')
      .select('*')
      .eq('date_iso', hojeStr)
      .order('time_slot', { ascending: true });
    
    if (data) setEvents(data);
  };

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
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-20">
      
      {/* Header Boas-vindas */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            Olá, {userName.split(' ')[0]}! <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-slate-500 dark:text-[#A1A1AA] mt-1 font-medium text-lg">Bem-vindo de volta à sua central de evolução.</p>
        </div>
        <div className="bg-white dark:bg-[#1C1C1E] px-6 py-3 rounded-2xl border border-slate-100 dark:border-[#2C2C2E] shadow-sm flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-500" />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">
            {format(TODAY, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </span>
        </div>
      </header>

      {/* Banner de Aviso do Administrador */}
      {adminAvisos.length > 0 && (
        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-600/20 border border-indigo-500 overflow-hidden relative group animate-in slide-in-from-top-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/20 shadow-inner">
              <span className="text-3xl filter drop-shadow-md">👑</span>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-200">Comunicado Oficial</span>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded text-white italic">
                  Postado em {format(new Date(adminAvisos[0].created_at), "dd/MM 'às' HH:mm")}
                </span>
                {adminAvisos[0].expires_at && (() => {
                  const daysLeft = differenceInDays(new Date(adminAvisos[0].expires_at), new Date());
                  const hoursLeft = Math.floor((new Date(adminAvisos[0].expires_at).getTime() - Date.now()) / 3600000);
                  const label = daysLeft >= 1 ? `Expira em ${daysLeft}d` : `Expira em ${Math.max(0, hoursLeft)}h`;
                  const color = daysLeft < 1 ? "bg-rose-400/30 text-rose-100" : daysLeft <= 2 ? "bg-amber-400/30 text-amber-100" : "bg-white/15 text-indigo-100";
                  return (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${color}`}>
                      <Clock className="w-2.5 h-2.5" /> {label}
                    </span>
                  );
                })()}
              </div>
              <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                <AlertCircle className="w-6 h-6"/> {adminAvisos[0].titulo}
              </h2>
              <p className="text-indigo-100 font-medium text-sm leading-relaxed max-w-4xl">
                {adminAvisos[0].descricao}
              </p>
            </div>
          </div>
        </div>
      )}


      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Esquerdo: Mural e Eventos (Col-span 2) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Mural da Comunidade */}
          <section className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm overflow-hidden flex flex-col h-[500px]">
             <div className="px-8 py-6 border-b border-slate-50 dark:border-[#2C2C2E] flex justify-between items-center bg-slate-50/50 dark:bg-[#1C1C1E]">
                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-indigo-500" /> Mural da Comunidade
                </h2>
                <div className="flex items-center gap-2">
                  <span className="flex w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
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
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${post.tipo === 'admin' ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-900 dark:text-indigo-100 font-medium' : 'bg-white dark:bg-[#2C2C2E] border border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-300 shadow-sm'}`}>
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
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-indigo-500/10 active:scale-95 flex items-center gap-2"
                >
                  {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Postar"}
                </button>
             </div>
          </section>

          {/* Eventos do Dia (Radar) */}
          <section className="space-y-4">
             <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 px-2">
                <Clock className="w-6 h-6 text-indigo-500" /> No Radar (Hoje)
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-800/10 p-8 rounded-3xl border border-dashed border-slate-200 dark:border-white/5 text-center col-span-full">
                    <p className="text-sm font-bold text-slate-400">Nenhum evento pessoal para hoje.</p>
                  </div>
                ) : (
                  events.map(event => (
                    <div key={event.id} className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-slate-100 dark:border-[#2C2C2E] shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden active:scale-95">
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${event.color_class || 'bg-indigo-500'}`}></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        {event.time_slot || "Horário não definido"}
                      </span>
                      <h3 className="font-bold text-slate-800 dark:text-white mb-2 leading-tight truncate">{event.titulo}</h3>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          Compromisso Confirmado
                        </span>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </section>

        </div>

        {/* Lado Direito: Widgets */}
        <div className="space-y-8">
          
          {/* Widget: Contagem Regressiva Customizada */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group min-h-[220px]">
            <Calendar className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Contagem Regressiva</span>
              
              <div className="mt-4 mb-6 relative">
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
                    label: `${format(new Date(ev.date_iso), "dd/MM")} - ${ev.titulo}`
                  }))}
                  placeholder="Selecione um evento..."
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl px-3 py-3 text-xs focus:ring-2 focus:ring-white/50 outline-none transition-colors backdrop-blur-md cursor-pointer font-medium"
                  dropdownClasses="bg-indigo-950/90"
                />
              </div>

              {selectedEvent ? (
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
                <div className="mt-4 flex flex-col items-center justify-center py-6 border-2 border-dashed border-white/20 rounded-2xl">
                   <p className="text-xs font-bold opacity-70 text-center px-4">Selecione o evento para iniciar a contagem</p>
                </div>
              )}
            </div>
          </div>

          {/* Widget: Online Agora (Real) */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 border border-slate-100 dark:border-[#2C2C2E] shadow-sm relative overflow-hidden">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Users className="w-6 h-6 text-teal-500" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-500 border-2 border-white dark:border-[#1C1C1E] rounded-full animate-ping"></div>
                  </div>
                  <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs">Ativos Agora</h3>
                </div>
                <span className="text-2xl font-black text-teal-500">{onlineUsers.length}</span>
             </div>
             
             <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-[#A1A1AA] font-medium leading-relaxed">
                  {onlineUsers.length > 1 
                    ? `Você está estudando com outros ${onlineUsers.length - 1} colegas agora.`
                    : "Você é o herói solitário estudando neste momento!"}
                </p>
                <div className="flex -space-x-3 overflow-hidden">
                   {onlineUsers.slice(0, 5).map((user, idx) => (
                     <div key={user.id || idx} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#2C2C2E] border-4 border-white dark:border-[#1C1C1E] flex items-center justify-center text-xs font-black text-slate-400 overflow-hidden" title={user.nome}>
                        {user.avatar_url ? (
                          <img src={user.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          user.nome?.[0] || "?"
                        )}
                     </div>
                   ))}
                   {onlineUsers.length > 5 && (
                     <div className="w-10 h-10 rounded-full bg-teal-500 border-4 border-white dark:border-[#1C1C1E] flex items-center justify-center text-[10px] font-black text-white">
                       +{onlineUsers.length - 5}
                     </div>
                   )}
                </div>
             </div>
          </div>

          {/* Espaço para novos widgets funcionais no futuro */}
          <div className="bg-slate-50 dark:bg-[#1C1C1E]/30 rounded-[2.5rem] p-8 border border-dashed border-slate-200 dark:border-[#2C2C2E] flex flex-col items-center justify-center text-center opacity-40">
             <Trophy className="w-8 h-8 mb-3 text-slate-400" />
             <p className="text-[10px] font-black uppercase tracking-widest">Área de Conquistas</p>
             <p className="text-[10px] mt-1">Gere dados reais na liga para ver seu progresso aqui.</p>
          </div>

        </div>

      </div>

    </div>
  );
}
