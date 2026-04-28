import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Cronômetro crescente (stopwatch) ancorado em timestamp real (Date.now).
 * Resistente a throttling de aba em background e tela apagada.
 *
 * Uso:
 *   const { elapsedSeconds, isRunning, start, pause, reset } = useStopwatch();
 */
export function useStopwatch() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Momento exato em que o trecho atual de contagem começou
  const startTimestampRef = useRef<number | null>(null);
  // Segundos acumulados de sessões anteriores (antes de pausas)
  const accumulatedRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    if (startTimestampRef.current === null) return;
    const sinceStart = Math.floor((Date.now() - startTimestampRef.current) / 1000);
    setElapsedSeconds(accumulatedRef.current + sinceStart);
  }, []);

  useEffect(() => {
    if (isRunning) {
      startTimestampRef.current = Date.now();
      // Atualiza a cada 500ms para UI responsiva; o valor real vem do Date.now()
      intervalRef.current = setInterval(tick, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Salva os segundos acumulados no momento da pausa
      if (startTimestampRef.current !== null) {
        accumulatedRef.current = elapsedSeconds;
        startTimestampRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // Força recálculo quando a aba volta ao foco (tela desbloqueada)
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === 'visible' && isRunning) {
        tick();
      }
    };
    document.addEventListener('visibilitychange', handleVisible);
    return () => document.removeEventListener('visibilitychange', handleVisible);
  }, [isRunning, tick]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    accumulatedRef.current = 0;
    startTimestampRef.current = null;
    setElapsedSeconds(0);
  }, []);

  return { elapsedSeconds, isRunning, start, pause, reset };
}

/**
 * Contagem regressiva (countdown) ancorada em timestamp real (Date.now).
 * Resistente a throttling de aba em background e tela apagada.
 *
 * Uso:
 *   const { timeLeft, isRunning, start, pause, resume, reset } = useCountdown(() => toast.success("Fim!"));
 *
 *   start(totalSeconds)  → inicia do zero
 *   pause()              → pausa mantendo o timestamp de término
 *   resume()             → retoma da pausa (endTimestamp já calculado)
 *   reset()              → zera tudo
 */
export function useCountdown(onExpire?: () => void) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Timestamp Unix (ms) em que o timer deve chegar a zero
  const endTimestampRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const tick = useCallback(() => {
    if (endTimestampRef.current === null) return;
    const remaining = Math.ceil((endTimestampRef.current - Date.now()) / 1000);
    if (remaining <= 0) {
      setTimeLeft(0);
      setIsRunning(false);
      endTimestampRef.current = null;
      onExpireRef.current?.();
    } else {
      setTimeLeft(remaining);
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      // Atualiza a cada 500ms para UI responsiva; o valor real vem do Date.now()
      intervalRef.current = setInterval(tick, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, tick]);

  // Força recálculo quando a aba volta ao foco (tela desbloqueada)
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === 'visible' && isRunning) {
        tick();
      }
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

  /** Retoma após uma pausa — endTimestampRef ajustado em pause() */
  const resume = useCallback(() => {
    if (endTimestampRef.current === null) return;
    setIsRunning(true);
  }, []);

  /**
   * Pausa o timer.
   * Ao pausar, ajustamos endTimestampRef para daqui a `timeLeft` segundos,
   * de modo que ao retomar (resume) o cálculo seja imediatamente correto.
   */
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
  }, []);

  return { timeLeft, isRunning, start, pause, resume, reset };
}
