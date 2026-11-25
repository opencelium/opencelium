import type { Marker } from "../calendarSlots";
import { lastRunOutcome } from "../../model/lastRunOutcome";

export type Slots = Map<string, Marker[]>;
export type LoadLevel = 0 | 1 | 2 | 3;
export type HourRow = { kind: "hour"; hour: number } | { kind: "band"; from: number; to: number };

const CLASH_WINDOW_MS = 5 * 60_000;
const MIN_BAND_HOURS = 3;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

export const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

const byTime = (a: Marker, b: Marker) => a.time - b.time || a.schedule.schedulerId - b.schedule.schedulerId;

export const cellMarkers = (slots: Slots, day: number, hour: number): Marker[] =>
  [...(slots.get(day + ":" + hour) ?? [])].sort(byTime);

/** A cadence marker stands for every run of its hour. */
export const markerRuns = (marker: Marker) => (marker.cadence ? Math.ceil(60 / marker.cadence) : 1);

export const countRuns = (markers: Marker[]) => markers.reduce((sum, marker) => sum + markerRuns(marker), 0);

export const hourRunCounts = (slots: Slots, day: number) => HOURS.map((hour) => countRuns(cellMarkers(slots, day, hour)));

export function loadLevel(runs: number): LoadLevel {
  if (runs === 0) return 0;
  if (runs === 1) return 1;
  return runs < 4 ? 2 : 3;
}

/** Starts of different schedules at most five minutes apart; a minute cadence that tight collides with anything. */
export function hasClash(markers: Marker[]): boolean {
  return markers.some((a, index) =>
    markers.slice(index + 1).some((b) => {
      if (a.schedule.schedulerId === b.schedule.schedulerId) return false;
      if (a.cadence || b.cadence) return Math.min(a.cadence ?? 60, b.cadence ?? 60) <= 5;
      return Math.abs(a.time - b.time) <= CLASH_WINDOW_MS;
    }),
  );
}

/** Collapses runs of at least three hours without any marker on any shown day into one band. */
export function hourRows(isHourActive: (hour: number) => boolean): HourRow[] {
  const rows: HourRow[] = [];
  let quietFrom: number | null = null;
  const flush = (to: number) => {
    if (quietFrom === null) return;
    if (to - quietFrom >= MIN_BAND_HOURS) rows.push({ kind: "band", from: quietFrom, to });
    else for (let hour = quietFrom; hour < to; hour++) rows.push({ kind: "hour", hour });
    quietFrom = null;
  };
  for (const hour of HOURS) {
    if (isHourActive(hour)) {
      flush(hour);
      rows.push({ kind: "hour", hour });
    } else if (quietFrom === null) {
      quietFrom = hour;
    }
  }
  flush(24);
  return rows;
}

/** One marker per schedule and day, so a month cell lists schedules rather than every single run. */
export function dayMarkers(slots: Slots, day: number): Marker[] {
  const first = new Map<number, Marker>();
  for (const hour of HOURS) {
    for (const marker of cellMarkers(slots, day, hour)) {
      if (!first.has(marker.schedule.schedulerId)) first.set(marker.schedule.schedulerId, marker);
    }
  }
  return [...first.values()].sort(byTime);
}

/** Every run of a day, with a cadence schedule listed once at its first run. */
export function agendaMarkers(slots: Slots, day: number): Marker[] {
  const seenCadence = new Set<number>();
  return HOURS.flatMap((hour) => cellMarkers(slots, day, hour)).filter((marker) => {
    if (!marker.cadence) return true;
    if (seenCadence.has(marker.schedule.schedulerId)) return false;
    seenCadence.add(marker.schedule.schedulerId);
    return true;
  });
}

export const isFailedMarker = (marker: Marker) => lastRunOutcome(marker.schedule) === "failure";
