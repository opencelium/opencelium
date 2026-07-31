import type {ThemeTokens} from "@shared/theme/tokens.ts";

// 'primaryHover' → 'primary-hover', so token paths map to kebab-case CSS variables
const toKebab = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

export function applyTheme(tokens: ThemeTokens) {
    const root = document.documentElement;

    const walk = (obj: object, path: string[] = []) => {
        Object.entries(obj).forEach(([key, value]) => {
            const nextPath = [...path, toKebab(key)];

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
