import { useTranslation } from 'react-i18next'
import type {I18nNamespace} from "@shared/i18n/types/namespaces.ts";
import type {I18nSchema} from "@shared/i18n/types/schemes/schemes.ts";
import type {DeepKeys} from "@shared/i18n/types/types.ts";

export function useI18n<N extends I18nNamespace>(ns: N) {
    const { t: rawT, i18n } = useTranslation(ns)

    const t = <K extends DeepKeys<I18nSchema[N]>>(
        key: K,
        values?: Record<string, unknown>
    ): string => {
        return rawT(key as string, values)
    }

    return {
        t,
        lang: i18n.language,
        setLang: (lng: string) => i18n.changeLanguage(lng),
    }
}

