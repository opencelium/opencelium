import { normalizeLanguage, type AppLanguage } from '@shared/i18n/config/languages'

export const LANGUAGE_STORAGE_KEY = 'oc_lang'

/** Device-level copy of the preference: it seeds i18next before any session
 * exists (login screen, first paint after a reload) and is overwritten as soon
 * as the account's own `userDetail.lang` arrives — see UserLanguageSync. */
export function readStoredLanguage(): AppLanguage | null {
    try {
        return normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY))
    } catch {
        // Storage access throws in private-mode webviews; fall back to the default.
        return null
    }
}

export function storeLanguage(lang: AppLanguage) {
    try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
    } catch {
        // Best effort — the language is already applied in memory.
    }
}
