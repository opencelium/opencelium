import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type {I18nNamespace} from "@shared/i18n/types/namespaces.ts";
import type {I18nSchema} from "@shared/i18n/types/schemes/schemes.ts";
import type {DeepKeys} from "@shared/i18n/types/types.ts";

type KeysFor<N extends I18nNamespace> = N extends keyof I18nSchema
    ? DeepKeys<I18nSchema[N]>
    : string

type TFn<N extends I18nNamespace> = (
    key: KeysFor<N>,
    values?: Record<string, unknown>
) => string

export function useI18n<N extends I18nNamespace>(ns: N): {
    t: TFn<N>
    lang: string
    setLang: (lng: string) => Promise<unknown>
} {
    const { t: rawT, i18n } = useTranslation(ns)

    // Stable until react-i18next swaps `rawT` (language / namespace load), so
    // consumers' useMemo/useEffect/useCallback deps on `t` don't re-run every
    // render. rawT is itself referentially stable across renders.
    const t = useCallback(
        (key: string, values?: Record<string, unknown>) => rawT(key, values),
        [rawT],
    ) as TFn<N>

    const setLang = useCallback((lng: string) => i18n.changeLanguage(lng), [i18n])

    return {
        t,
        lang: i18n.language,
        setLang,
    }
}

