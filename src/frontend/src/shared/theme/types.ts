import type {ThemeTokens} from "@shared/theme/tokens.ts";

export type ThemeMode = 'light' | 'dark';

/**
 * Sentinel theme id (not in the registry): resolves to the default family's
 * light or dark variant from the OS `prefers-color-scheme`, following live
 * changes while active.
 */
export const DEVICE_THEME_ID = 'device';

export type UISystem = 'material' | 'ant' | 'custom';

export interface SystemContextValue {
    system: UISystem;
    setSystem: (s: UISystem) => void;
}

export interface ThemeContextValue {
    theme: ThemeTokens;
    themeId: string;
    themeMode: ThemeMode;
    setTheme: (id: string) => void;
    toggleTheme: () => void;
}
