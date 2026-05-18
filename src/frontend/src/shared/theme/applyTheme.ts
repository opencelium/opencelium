import type {ThemeTokens} from "@shared/theme/tokens.ts";


export function applyTheme(tokens: ThemeTokens) {
    const root = document.documentElement;

    const walk = (obj: any, path: string[] = []) => {
        Object.entries(obj).forEach(([key, value]) => {
            const nextPath = [...path, key];

            if (typeof value === 'string' || typeof value === 'number') {
                root.style.setProperty(
                    `--${nextPath.join('-')}`,
                    typeof value === 'number' ? `${value}px` : value
                );
            } else {
                walk(value, nextPath);
            }
        });
    };

    walk(tokens);
}
