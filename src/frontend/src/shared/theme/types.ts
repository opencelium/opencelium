import type {ThemeTokens} from "@shared/theme/tokens.ts";

export type ThemeMode = 'light' | 'dark';

/**
 * Sentinel theme id (not in the registry): resolves to the default family's
 * light or dark variant from the OS `prefers-color-scheme`, following live
 * changes while active.
 */
export const DEVICE_THEME_ID = 'device';

/**
 * Display name of that sentinel, shared by every theme picker so the wizard select and
 * the command palette name it identically. Left untranslated like the registry's own
 * theme labels, which are the strings it sits beside.
 */
export const DEVICE_THEME_LABEL = 'Device';

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
