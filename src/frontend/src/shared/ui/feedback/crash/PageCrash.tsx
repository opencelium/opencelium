import {useI18n} from "@shared/i18n/hooks/useI18n.ts";
import type {CrashFallbackProps} from "@shared/errors/types.ts";
import {CrashScreen} from "./CrashScreen.tsx";

export function PageCrash({reset}: CrashFallbackProps) {
    const {t} = useI18n('common')

    return (
        <CrashScreen
            title={t('errorBoundary.page.title')}
            subtitle={t('errorBoundary.page.subtitle')}
            retryLabel={t('errorBoundary.retry')}
            onRetry={reset}
            reloadLabel={t('errorBoundary.reload')}
            onReload={() => window.location.reload()}
            testId="crash-page"
        />
    )
}
