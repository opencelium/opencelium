import {useI18n} from "@shared/i18n/hooks/useI18n.ts";
import type {CrashFallbackProps} from "@shared/errors/types.ts";
import {Alert} from "@shared/ui/primitives/Alert";
import {Button} from "@shared/ui/primitives/Button";

export function WidgetCrash({reset}: CrashFallbackProps) {
    const {t} = useI18n('common')

    return (
        <Alert
            type="error"
            showIcon
            message={t('errorBoundary.widget.title')}
            description={t('errorBoundary.widget.subtitle')}
            action={
                <Button variant="link" iconLeft="refresh" onClick={reset} testId="crash-widget-retry">
                    {t('errorBoundary.retry')}
                </Button>
            }
            style={{margin: 8}}
        />
    )
}
