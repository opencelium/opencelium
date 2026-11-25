import { loadLevel } from "./calendarGrid";

/** 24 hourly bars; height and fill rise with the number of runs in that hour. */
export function LoadBars({ counts, className }: { counts: number[]; className: string }) {
  return (
    <div className={className} aria-hidden>
      {counts.map((count, hour) => (
        <i key={hour} data-level={loadLevel(count)} />
      ))}
    </div>
  );
}
