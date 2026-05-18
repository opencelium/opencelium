import type {ThemeTokens} from "@shared/theme/tokens.ts";

export const ThemeName = {
    Light: 'light',
    Dark: 'dark',
} as const;

export type ThemeName = typeof ThemeName[keyof typeof ThemeName];

export type UISystem = 'material' | 'ant' | 'custom';

export interface SystemContextValue {
    system: UISystem;
    setSystem: (s: UISystem) => void;
}

export interface ThemeContextValue {
    theme: ThemeTokens;
    themeName: ThemeName;
    setTheme: (name: ThemeName) => void;
    toggleTheme: () => void;
}
