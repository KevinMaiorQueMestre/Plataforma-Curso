import { useState, useEffect, useRef, useCallback } from 'react';

const isBrowser = typeof window !== 'undefined';

function readStorage<T>(key: string): T | null {
  if (!isBrowser) return null;
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}

function writeStorage(key: string, data: object) {
  if (!isBrowser) return;
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* noop */ }
}

function clearStorage(key: string) {
  if (!isBrowser) return;
  try { localStorage.removeItem(key); } catch { /* noop */ }
}

// ─── STOPWATCH (crescente) ────────────────────────────────────────────────────
// storageKey: chave opcional de localStorage para sobreviver a navegação entre abas

interface StopwatchStorage { accumulated: number; startedAt: number | null }

export function useStopwatch(storageKey?: string) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const startTimestampRef = useRef<number | null>(null);
  const accumulatedRef    = useRef(0);
  const intervalRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const restoredRef       = useRef(false);

  // Restaura estado ao montar o componente
  useEffect(() => {
    if (!storageKey || restoredRef.current) return;
    restoredRef.current = true;

    const saved = readStorage<StopwatchStorage>(storageKey);
    if (!saved) return;

    if (saved.startedAt) {
      // Estava rodando quando navegou — recalcula tempo decorrido
      accumulatedRef.current     = saved.accumulated || 0;
      startTimestampRef.current  = saved.startedAt;
      const sinceStart = Math.floor((Date.now() - saved.startedAt) / 1000);
      setElapsedSeconds(accumulatedRef.current + sinceStart);
      setIsRunning(true);
    } else if ((saved.accumulated || 0) > 0) {
      // Estava pausado
      accumulatedRef.current = saved.accumulated;
      setElapsedSeconds(saved.accumulated);
    }
  }, [storageKey]);

  const tick = useCallback(() => {
    if (startTimestampRef.current === null) return;
    const sinceStart = Math.floor((Date.now() - startTimestampRef.current) / 1000);
    setElapsedSeconds(accumulatedRef.current + sinceStart);
  }, []);

  useEffect(() => {
    if (isRunning) {
      // Garante que startTimestampRef está definido (pode vir da restauração)
      if (startTimestampRef.current === null) {
        startTimestampRef.current = Date.now();
      }
      if (storageKey) {
        writeStorage(storageKey, { accumulated: accumulatedRef.current, startedAt: startTimestampRef.current });
      }
      intervalRef.current = setInterval(tick, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (startTimestampRef.current !== null) {
        // Congela valor acumulado
        accumulatedRef.current    = elapsedSeconds;
        startTimestampRef.current = null;
        if (storageKey) {
          writeStorage(storageKey, { accumulated: accumulatedRef.current, startedAt: null });
        }
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // Atualiza imediatamente quando a aba volta ao foco
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === 'visible' && isRunning) tick();
    };
    document.addEventListener('visibilitychange', handleVisible);
    return () => document.removeEventListener('visibilitychange', handleVisible);
  }, [isRunning, tick]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    accumulatedRef.current    = 0;
    startTimestampRef.current = null;
    setElapsedSeconds(0);
    if (storageKey) clearStorage(storageKey);
  }, [storageKey]);

  return { elapsedSeconds, isRunning, start, pause, reset };
}

// ─── COUNTDOWN (regressivo) ───────────────────────────────────────────────────
// storageKey: chave opcional de localStorage para sobreviver a navegação entre abas

interface CountdownStorage { endTimestamp: number; wasRunning: boolean }

export function useCountdown(onExpire?: () => void, storageKey?: string) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const endTimestampRef = useRef<number | null>(null);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef     = useRef(onExpire);
  onExpireRef.current   = onExpire;
  const restoredRef     = useRef(false);

  // Restaura estado ao montar o componente
  useEffect(() => {
    if (!storageKey || restoredRef.current) return;
    restoredRef.current = true;

    const saved = readStorage<CountdownStorage>(storageKey);
    if (!saved?.endTimestamp) return;

    const remaining = Math.ceil((saved.endTimestamp - Date.now()) / 1000);
    if (remaining <= 0) {
      // Expirou enquanto estava fora
      clearStorage(storageKey);
      onExpireRef.current?.();
    } else {
      endTimestampRef.current = saved.endTimestamp;
      setTimeLeft(remaining);
      if (saved.wasRunning) setIsRunning(true);
    }
  }, [storageKey]);

  const tick = useCallback(() => {
    if (endTimestampRef.current === null) return;
    const remaining = Math.ceil((endTimestampRef.current - Date.now()) / 1000);
    if (remaining <= 0) {
      setTimeLeft(0);
      setIsRunning(false);
      endTimestampRef.current = null;
      if (storageKey) clearStorage(storageKey);
      onExpireRef.current?.();
    } else {
      setTimeLeft(remaining);
    }
  }, [storageKey]);

  useEffect(() => {
    if (isRunning) {
      if (storageKey && endTimestampRef.current) {
        writeStorage(storageKey, { endTimestamp: endTimestampRef.current, wasRunning: true });
      }
      intervalRef.current = setInterval(tick, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (storageKey && endTimestampRef.current) {
        writeStorage(storageKey, { endTimestamp: endTimestampRef.current, wasRunning: false });
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, tick]);

  // Atualiza imediatamente quando a aba volta ao foco
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === 'visible' && isRunning) tick();
    };
    document.addEventListener('visibilitychange', handleVisible);
    return () => document.removeEventListener('visibilitychange', handleVisible);
  }, [isRunning, tick]);

  /** Inicia um novo countdown com `totalSeconds` segundos */
  const start = useCallback((totalSeconds: number) => {
    endTimestampRef.current = Date.now() + totalSeconds * 1000;
    setTimeLeft(totalSeconds);
    setIsRunning(true);
  }, []);

  /** Retoma após pausa */
  const resume = useCallback(() => {
    if (endTimestampRef.current === null) return;
    setIsRunning(true);
  }, []);

  /** Pausa ajustando endTimestamp para o tempo restante atual */
  const pause = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(prev => {
      endTimestampRef.current = Date.now() + prev * 1000;
      return prev;
    });
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(0);
    endTimestampRef.current = null;
    if (storageKey) clearStorage(storageKey);
  }, [storageKey]);

  return { timeLeft, isRunning, start, pause, resume, reset };
}
