import { useI18n } from '@shared/i18n/hooks/useI18n'
import '../onboardingIntro.css'

type ExistingInvokersProps = {
    invokers: Array<{ name: string; methodCount: number }>
}

export function ExistingInvokersContent({ invokers }: ExistingInvokersProps) {
    const { t } = useI18n('onboarding')
    const names = invokers.map(invoker => invoker.name).join(', ')
    return (
        <div>
            <p>{t('content.invoker.existingList', { names })}</p>
            <div className="onboarding-invoker-tags">
                {invokers.map(invoker => (
                    <span key={invoker.name}>{invoker.name} · {t('content.invoker.methods', { count: invoker.methodCount })}</span>
                ))}
            </div>
            <code className="onboarding-command-hint">{t('content.invoker.commandHint')}</code>
        </div>
    )
}
