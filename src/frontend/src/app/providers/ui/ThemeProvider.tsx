import React, {useCallback, useEffect, useState,} from 'react';
import {ThemeName} from "@shared/theme/types.ts";
import ThemeContext from "@shared/theme/context/ThemeContext.tsx";
import {lightTheme} from "@shared/theme/light.ts";
import {darkTheme} from "@shared/theme/dark.ts";
import {applyTheme} from "@shared/theme/applyTheme.ts";

const THEME_STORAGE_KEY = 'theme';

function readStoredTheme(fallback: ThemeName): ThemeName {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === ThemeName.Light || stored === ThemeName.Dark ? stored : fallback;
}

export const ThemeProvider: React.FC<{
    initialTheme?: ThemeName;
    children: React.ReactNode;
}> = ({ initialTheme = ThemeName.Light, children }) => {
    const [themeName, setThemeName] = useState<ThemeName>(() => readStoredTheme(initialTheme));

    const setTheme = useCallback((name: ThemeName) => {
        localStorage.setItem(THEME_STORAGE_KEY, name);
        setThemeName(name);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeName(t => {
            const next = t === ThemeName.Light ? ThemeName.Dark : ThemeName.Light;
            localStorage.setItem(THEME_STORAGE_KEY, next);
            return next;
        });
    }, []);

    const theme = themeName === ThemeName.Light ? lightTheme : darkTheme;

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    return (
        <ThemeContext.Provider
            value={{ theme, themeName, setTheme, toggleTheme }}
        >
            {children}
        </ThemeContext.Provider>
    );
};
