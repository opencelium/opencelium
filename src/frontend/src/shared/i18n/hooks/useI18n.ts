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

    const t = ((key: string, values?: Record<string, unknown>) =>
        rawT(key, values)) as TFn<N>

    return {
        t,
        lang: i18n.language,
        setLang: (lng: string) => i18n.changeLanguage(lng),
    }
}

