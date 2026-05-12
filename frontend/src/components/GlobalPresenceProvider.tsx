"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type PresenceUser = {
  user_id: string;
  nome: string;
  avatar_url?: string | null;
  online_at: string;
};

interface GlobalPresenceContextType {
  onlineUsers: PresenceUser[];
  currentUser: { id: string; nome: string; avatar_url?: string | null } | null;
}

const GlobalPresenceContext = createContext<GlobalPresenceContextType>({
  onlineUsers: [],
  currentUser: null,
});

export function useGlobalPresence() {
  return useContext(GlobalPresenceContext);
}

export function GlobalPresenceProvider({ children }: { children: React.ReactNode }) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; nome: string; avatar_url?: string | null } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;
    let channel: RealtimeChannel | null = null;

    async function setup() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user || !mounted) return;

        // Busca o profile para ter nome e avatar
        const { data: profile } = await supabase
          .from("profiles")
          .select("nome, avatar_url")
          .eq("id", user.id)
          .single();

        if (!mounted) return;

        const me: PresenceUser = {
          user_id: user.id,
          nome: profile?.nome ?? user.email?.split("@")[0] ?? "Aluno",
          avatar_url: profile?.avatar_url ?? null,
          online_at: new Date().toISOString(),
        };

        setCurrentUser({ id: user.id, nome: me.nome, avatar_url: me.avatar_url });

        // Cria o canal de presença (Supabase Realtime)
        channel = supabase.channel("online-hub", {
          config: { presence: { key: user.id } },
        });

        channel
          .on("presence", { event: "sync" }, () => {
            if (!mounted || !channel) return;
            const state = channel.presenceState<PresenceUser>();
            // Flatten values ensuring uniqueness
            const users = Object.values(state).flat();
            
            // Filter unique users by user_id
            const uniqueUsers = Array.from(new Map(users.map((u) => [u.user_id, u])).values());
            
            setOnlineUsers(uniqueUsers);
          })
          .subscribe(async (status) => {
            if (status === "SUBSCRIBED" && mounted && channel) {
              await channel.track(me);
            }
          });
      } catch (err) {
        console.error("GlobalPresenceProvider erro:", err);
      }
    }

    setup();

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []); // Executa apenas uma vez ao montar o provider

  return (
    <GlobalPresenceContext.Provider value={{ onlineUsers, currentUser }}>
      {children}
    </GlobalPresenceContext.Provider>
  );
}
