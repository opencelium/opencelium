import React, {useCallback, useEffect, useMemo, useState} from 'react';
import ThemeContext from "@shared/theme/context/ThemeContext.tsx";
import {applyTheme} from "@shared/theme/applyTheme.ts";
import {buildTheme} from "@shared/theme/buildTheme.ts";
import {themeRegistry} from "@shared/theme/registry/themeRegistry.ts";
import {readStoredThemeId, storeThemeId} from "@shared/theme/themeStorage.ts";

function resolveInitialThemeId(initialThemeId?: string): string {
    const stored = readStoredThemeId();
    if (stored && themeRegistry.has(stored)) return stored;
    if (initialThemeId && themeRegistry.has(initialThemeId)) return initialThemeId;
    return themeRegistry.getDefault().id;
}

export const ThemeProvider: React.FC<{
    initialThemeId?: string;
    children: React.ReactNode;
}> = ({ initialThemeId, children }) => {
    const [themeId, setThemeId] = useState<string>(() => resolveInitialThemeId(initialThemeId));
    // Bumped on every setTheme so re-registering a theme under the same id
    // (custom theme edits) still triggers a render; the registry then returns
    // a fresh definition object and the memo below recomputes.
    const [, setVersion] = useState(0);

    const setTheme = useCallback((id: string) => {
        if (!themeRegistry.has(id)) return;
        storeThemeId(id);
        setThemeId(id);
        setVersion(v => v + 1);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeId(current => {
            const next = themeRegistry.getCounterpart(current)?.id ?? current;
            storeThemeId(next);
            return next;
        });
    }, []);

    const definition = themeRegistry.get(themeId) ?? themeRegistry.getDefault();
    const theme = useMemo(
        () => buildTheme(definition.palette, definition.mode),
        [definition],
    );

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    return (
        <ThemeContext.Provider
            value={{ theme, themeId: definition.id, themeMode: definition.mode, setTheme, toggleTheme }}
        >
            {children}
        </ThemeContext.Provider>
    );
};
