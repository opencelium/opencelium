import type { ThemeMode } from "@shared/theme/types";

export type ScheduleSwatch = { accent: string; text: string; background: string; border: string };

// The calendar mockup's geekblue, cyan, purple and lime (its orange and magenta are left out:
// next to the red of a failed run they would read as errors). Light values follow the mockup;
// text is one step darker where the mockup's accent is too light to read on its wash.
// The mockup has no dark variant, so the dark set uses the same hues on dark washes.
export const SCHEDULE_SWATCHES: Record<ThemeMode, readonly ScheduleSwatch[]> = {
  light: [
    { accent: "#1d39c4", text: "#1d39c4", background: "#f0f5ff", border: "#adc6ff" },
    { accent: "#08979c", text: "#006d75", background: "#e6fffb", border: "#87e8de" },
    { accent: "#531dab", text: "#531dab", background: "#f9f0ff", border: "#d3adf7" },
    { accent: "#7cb305", text: "#3f6600", background: "#fcffe6", border: "#eaff8f" },
  ],
  dark: [
    { accent: "#6b8cff", text: "#adc6ff", background: "#161d40", border: "#2b3d8a" },
    { accent: "#13c2c2", text: "#87e8de", background: "#112426", border: "#145656" },
    { accent: "#9254de", text: "#d3adf7", background: "#211633", border: "#4a2a7a" },
    { accent: "#a0d911", text: "#d3f261", background: "#1d260f", border: "#435a13" },
  ],
};

export const scheduleSwatch = (theme: ThemeMode, schedulerId: number): ScheduleSwatch =>
  SCHEDULE_SWATCHES[theme][schedulerId % SCHEDULE_SWATCHES[theme].length];
