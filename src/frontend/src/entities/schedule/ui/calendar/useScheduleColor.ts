import { useCallback } from "react";
import type { CSSProperties } from "react";
import { useTheme } from "@shared/theme/hooks/useTheme";
import type { Schedule } from "../../model/types";
import { scheduleSwatch } from "./scheduleCalendarPalette";

/** A schedule keeps the same hue in every view, keyed by its id. */
export function useScheduleColor() {
  const { themeMode } = useTheme();
  return useCallback((schedule: Schedule) => scheduleSwatch(themeMode, schedule.schedulerId).accent, [themeMode]);
}

/** The full swatch of a calendar entry as CSS variables. */
export function useScheduleChipStyle() {
  const { themeMode } = useTheme();
  return useCallback((schedule: Schedule): CSSProperties => {
    const swatch = scheduleSwatch(themeMode, schedule.schedulerId);
    return {
      "--schedule-color": swatch.accent,
      "--schedule-text": swatch.text,
      "--schedule-bg": swatch.background,
      "--schedule-border": swatch.border,
    } as CSSProperties;
  }, [themeMode]);
}
