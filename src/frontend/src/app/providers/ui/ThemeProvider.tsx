import React, {useCallback, useEffect, useMemo, useState} from 'react';
import ThemeContext from "@shared/theme/context/ThemeContext.tsx";
import {applyTheme} from "@shared/theme/applyTheme.ts";
import {buildTheme} from "@shared/theme/buildTheme.ts";
import {themeRegistry, type ThemeDefinition} from "@shared/theme/registry/themeRegistry.ts";
import {registerThemeRefresher, registerThemeSetter} from "@shared/theme/themeController.ts";
import {readStoredThemeId, storeThemeId, THEME_STORAGE_KEY} from "@shared/theme/themeStorage.ts";
import {DEVICE_THEME_ID, type ThemeMode} from "@shared/theme/types.ts";

function systemMode(): ThemeMode {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// 'device' is the default for visitors without an explicit choice, so a fresh
// browser follows the OS color scheme out of the box.
function resolveInitialThemeId(): string {
    const stored = readStoredThemeId();
    if (stored && (stored === DEVICE_THEME_ID || themeRegistry.has(stored))) return stored;
    return DEVICE_THEME_ID;
}

function resolveDefinition(themeId: string): ThemeDefinition {
    if (themeId === DEVICE_THEME_ID) {
        const base = themeRegistry.getDefault();
        if (base.mode !== systemMode()) {
            return themeRegistry.getCounterpart(base.id) ?? base;
        }
        return base;
    }
    return themeRegistry.get(themeId) ?? themeRegistry.getDefault();
}

export const ThemeProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const [themeId, setThemeId] = useState<string>(resolveInitialThemeId);
    // Render trigger for changes the id alone doesn't capture: a theme
    // re-registered under the same id (custom theme edits) or an OS
    // color-scheme flip while in device mode.
    const [, setVersion] = useState(0);

    const setTheme = useCallback((id: string) => {
        if (id !== DEVICE_THEME_ID && !themeRegistry.has(id)) return;
        storeThemeId(id);
        setThemeId(id);
        setVersion(v => v + 1);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeId(current => {
            const next = themeRegistry.getCounterpart(resolveDefinition(current).id)?.id ?? current;
            storeThemeId(next);
            return next;
        });
    }, []);

    // Expose setTheme to non-React call sites (command palette executors).
    useEffect(() => registerThemeSetter(setTheme), [setTheme]);

    // Same bridge for a re-registered definition (org theme arriving from the server):
    // the id is unchanged, so only the version bump can pick up the new palette.
    useEffect(() => registerThemeRefresher(() => setVersion(v => v + 1)), []);

    // Sync the theme across tabs: the `storage` event fires only in *other*
    // tabs/windows, so picking up the new id here mirrors a change made
    // elsewhere without writing it back (which would loop).
    useEffect(() => {
        const onStorage = (event: StorageEvent) => {
            if (event.key !== THEME_STORAGE_KEY || event.newValue === null) return;
            const next = readStoredThemeId();
            if (!next || (next !== DEVICE_THEME_ID && !themeRegistry.has(next))) return;
            setThemeId(next);
            setVersion(v => v + 1);
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // In device mode, follow OS color-scheme switches live.
    useEffect(() => {
        if (themeId !== DEVICE_THEME_ID) return;
        const query = window.matchMedia?.('(prefers-color-scheme: dark)');
        if (!query) return;
        const onChange = () => setVersion(v => v + 1);
        query.addEventListener('change', onChange);
        return () => query.removeEventListener('change', onChange);
    }, [themeId]);

    const definition = resolveDefinition(themeId);
    const theme = useMemo(
        () => buildTheme(definition.palette, definition.mode, {
            fontFamily: definition.fontFamily,
            sidebar: definition.sidebar,
        }),
        [definition],
    );

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    return (
        <ThemeContext.Provider
            value={{ theme, themeId, themeMode: definition.mode, setTheme, toggleTheme }}
        >
            {children}
        </ThemeContext.Provider>
    );
};
