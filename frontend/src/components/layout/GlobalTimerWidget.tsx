"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Play, Pause, X, Clock } from "lucide-react";

const STORAGE_KEY = "metauto_timer_simulados";
const UI_KEY = "metauto_timer_ui"; // isFocusMode + isMinimized

interface TimerStorage { endTimestamp: number; wasRunning: boolean }
interface UiStorage { isFocusMode: boolean; isMinimized: boolean }

function readLS<T>(key: string): T | null {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; }
}

function fmt(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

/**
 * Widget flutuante global do countdown de simulados.
 * Aparece em todas as páginas quando o timer está minimizado.
 * Fica oculto na página /simulados (que renderiza sua própria UI).
 */
export default function GlobalTimerWidget() {
  const pathname = usePathname();
  const router   = useRouter();

  const [timeLeft,  setTimeLeft]  = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [visible,   setVisible]   = useState(false);

  const endTimestampRef = useRef<number | null>(null);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lê o localStorage e sincroniza o estado
  const syncFromStorage = useCallback(() => {
    const timer = readLS<TimerStorage>(STORAGE_KEY);
    const ui    = readLS<UiStorage>(UI_KEY);

    const isMinimized = ui?.isFocusMode === true && ui?.isMinimized === true;

    if (!timer?.endTimestamp || !isMinimized) {
      setVisible(false);
      return;
    }

    const remaining = Math.ceil((timer.endTimestamp - Date.now()) / 1000);
    if (remaining <= 0) {
      setVisible(false);
      return;
    }

    endTimestampRef.current = timer.endTimestamp;
    setTimeLeft(remaining);
    setIsRunning(timer.wasRunning);
    setVisible(true);
  }, []);

  // Tick baseado em Date.now() — resistente a throttle
  const tick = useCallback(() => {
    if (!endTimestampRef.current) return;
    const remaining = Math.ceil((endTimestampRef.current - Date.now()) / 1000);
    if (remaining <= 0) {
      setTimeLeft(0);
      setIsRunning(false);
      setVisible(false);
    } else {
      setTimeLeft(remaining);
    }
  }, []);

  // Inicia/para o interval baseado em isRunning
  useEffect(() => {
    if (isRunning && visible) {
      intervalRef.current = setInterval(tick, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, visible, tick]);

  // Sincroniza na montagem e sempre que a rota muda
  useEffect(() => {
    syncFromStorage();
  }, [pathname, syncFromStorage]);

  // Atualiza quando a aba volta ao foco
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === "visible") {
        syncFromStorage();
        tick();
      }
    };
    document.addEventListener("visibilitychange", handleVisible);
    // Também escuta alterações no storage (outra aba/página pode escrever)
    const handleStorage = () => syncFromStorage();
    window.addEventListener("storage", handleStorage);
    return () => {
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("storage", handleStorage);
    };
  }, [syncFromStorage, tick]);

  // Oculta na página de simulados (que tem sua própria UI)
  const isOnSimulados = pathname === "/simulados";
  if (!visible || isOnSimulados) return null;

  const handlePlayPause = () => {
    const newRunning = !isRunning;
    setIsRunning(newRunning);
    // Persiste no localStorage para que a página /simulados também saiba
    try {
      const end = newRunning
        ? (endTimestampRef.current ?? Date.now() + timeLeft * 1000)
        : Date.now() + timeLeft * 1000;
      endTimestampRef.current = end;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ endTimestamp: end, wasRunning: newRunning }));
    } catch { /* noop */ }
  };

  const handleClose = () => {
    setVisible(false);
    try {
      const ui = readLS<UiStorage>(UI_KEY) ?? { isFocusMode: false, isMinimized: false };
      localStorage.setItem(UI_KEY, JSON.stringify({ ...ui, isFocusMode: false, isMinimized: false }));
    } catch { /* noop */ }
  };

  const handleGoToSimulados = () => router.push("/simulados");

  return (
    <div
      className="fixed bottom-20 md:bottom-6 right-4 z-[999] flex items-center gap-3 bg-slate-900 dark:bg-[#1C1C1E] border border-white/10 rounded-2xl px-4 py-3 shadow-2xl cursor-default select-none"
      style={{ backdropFilter: "blur(16px)" }}
    >
      {/* Ícone clicável para ir a /simulados */}
      <button
        onClick={handleGoToSimulados}
        className="text-indigo-400 hover:text-indigo-300 transition-colors"
        title="Ir para Simulados"
      >
        <Clock className="w-4 h-4" />
      </button>

      {/* Tempo */}
      <span
        onClick={handleGoToSimulados}
        className="font-mono font-black text-white text-sm tabular-nums tracking-tighter cursor-pointer hover:text-indigo-300 transition-colors"
      >
        {fmt(timeLeft)}
      </span>

      {/* Play / Pause */}
      <button
        onClick={handlePlayPause}
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
          isRunning ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30" : "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30"
        }`}
      >
        {isRunning
          ? <Pause  className="w-3.5 h-3.5 fill-current" />
          : <Play   className="w-3.5 h-3.5 fill-current ml-px" />
        }
      </button>

      {/* Fechar */}
      <button
        onClick={handleClose}
        className="text-slate-500 hover:text-rose-400 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
