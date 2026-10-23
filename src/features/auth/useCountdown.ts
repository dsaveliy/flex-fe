import { useEffect, useState } from 'react';

/** текущее время, обновляемое раз в `intervalMs`, пока `enabled` */
export function useNow(intervalMs = 1000, enabled = true): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!enabled) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
  return now;
}

/** сколько секунд осталось до `untilMs`; 0 — время вышло или его нет */
export function useCountdown(untilMs: number | null): number {
  const active = untilMs !== null && untilMs > Date.now();
  const now = useNow(1000, active);
  return active && untilMs !== null
    ? Math.max(0, Math.ceil((untilMs - Math.max(now, Date.now())) / 1000))
    : 0;
}
