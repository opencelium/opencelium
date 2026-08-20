export const APP_LANGUAGES = ['en', 'de'] as const

export type AppLanguage = (typeof APP_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: AppLanguage = 'en'

// `userDetail.lang` is a free-form column on the backend (it writes 'en' as the
// fallback, but older records hold ISO-3 codes and region tags), so map the
// known spellings onto a bundled locale.
const LANGUAGE_ALIASES: Record<string, AppLanguage> = {
    en: 'en',
    eng: 'en',
    de: 'de',
    deu: 'de',
    ger: 'de',
}

/** Anything that doesn't resolve to a bundled locale is "no preference" — the UI
 * must not switch to a language it has no translations for. */
export function normalizeLanguage(value: unknown): AppLanguage | null {
    if (typeof value !== 'string') return null
    const tag = value.trim().toLowerCase().split(/[-_]/)[0]
    return LANGUAGE_ALIASES[tag] ?? null
}
