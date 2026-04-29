"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useState } from "react";

const STORAGE_KEY = "metauto_timer_simulados";

interface TimerStorage { endTimestamp: number; wasRunning: boolean }

function readLS<T>(key: string): T | null {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; }
  catch { return null; }
}

const MIN15 = 15 * 60;
const MIN5  =  5 * 60;

type Stage = "15" | "5" | null;

export default function GlobalTimerWidget() {
  const pathname = usePathname();
  const [stage, setStage] = useState<Stage>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = () => {
    const timer = readLS<TimerStorage>(STORAGE_KEY);
    if (!timer?.endTimestamp || !timer.wasRunning) { setStage(null); return; }

    const remaining = Math.ceil((timer.endTimestamp - Date.now()) / 1000);

    if (remaining <= 0 || remaining > MIN15) { setStage(null); return; }
    if (remaining <= MIN5)  { setStage("5");  return; }
    /* remaining <= MIN15 */  setStage("15");
  };

  useEffect(() => {
    tick();
    intervalRef.current = setInterval(tick, 500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // pathname garante re-sync ao navegar entre páginas
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Oculto na página de simulados (já tem o overlay)
  if (!stage || pathname === "/simulados") return null;

  const is5 = stage === "5";

  return (
    <div
      className={`
        fixed bottom-20 md:bottom-6 right-4 z-[999]
        flex items-center justify-center
        w-14 h-14 rounded-2xl
        font-black text-2xl tabular-nums
        shadow-2xl select-none
        transition-all duration-500
        ${is5
          ? "bg-rose-600 text-white shadow-rose-500/40 animate-pulse"
          : "bg-amber-500 text-white shadow-amber-500/30"
        }
      `}
      title={`Últimos ${stage} minutos de simulado`}
    >
      {stage}
    </div>
  );
}
