import { useEffect, useState } from "react";

const TICK_MS = 60_000;

/** The current time, refreshed once a minute — enough for countdowns and the "now" line. */
export function useMinuteClock() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const handle = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(handle);
  }, []);
  return now;
}
