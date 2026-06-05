import type {ThemeTokens} from "@shared/theme/tokens.ts";

export type ThemeMode = 'light' | 'dark';

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
