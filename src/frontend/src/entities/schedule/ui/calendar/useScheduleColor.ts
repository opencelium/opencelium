import { useCallback } from "react";
import { useTheme } from "@shared/theme/hooks/useTheme";
import { CATEGORICAL_HUES, CATEGORICAL_SLOT_COUNT } from "@shared/theme/categoricalPalette";
import type { Schedule } from "../../model/types";

/** A schedule keeps the same hue in every view, keyed by its id. */
export function useScheduleColor() {
  const { themeMode } = useTheme();
  return useCallback(
    (schedule: Schedule) => CATEGORICAL_HUES[themeMode][schedule.schedulerId % CATEGORICAL_SLOT_COUNT],
    [themeMode],
  );
}
