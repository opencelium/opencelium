import {useI18n} from "@shared/i18n/hooks/useI18n.ts";
import type {CrashFallbackProps} from "@shared/errors/types.ts";
import {CrashScreen} from "./CrashScreen.tsx";

export function AppCrash({reset}: CrashFallbackProps) {
    const {t} = useI18n('common')

    return (
        <div style={{display: 'flex', minHeight: '100vh', width: '100%'}}>
            <CrashScreen
                title={t('errorBoundary.app.title')}
                subtitle={t('errorBoundary.app.subtitle')}
                retryLabel={t('errorBoundary.retry')}
                onRetry={reset}
                reloadLabel={t('errorBoundary.reload')}
                onReload={() => window.location.reload()}
                testId="crash-app"
            />
        </div>
    )
}
