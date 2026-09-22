import { useState } from 'react'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Button } from '@shared/ui/primitives/Button'
import { visibleCount } from './existingInvokers.utils'
import '../onboardingIntro.css'

type ExistingInvokersProps = {
    invokers: Array<{ name: string; methodCount: number }>
}

export function ExistingInvokersContent({ invokers }: ExistingInvokersProps) {
    const { t } = useI18n('onboarding')
    const [reveals, setReveals] = useState(0)
    const limit = visibleCount(reveals)
    const visible = invokers.slice(0, limit)
    const hidden = invokers.length - visible.length

    return (
        <div>
            <p>{t('content.invoker.existingList')}</p>
            <div className="onboarding-invoker-tags">
                {visible.map(invoker => (
                    <span key={invoker.name}>{invoker.name} · {t('content.invoker.methods', { count: invoker.methodCount })}</span>
                ))}
                {hidden > 0 && (
                    <Button
                        type="text"
                        className="onboarding-invoker-tags__more"
                        onClick={() => setReveals(current => current + 1)}
                        testId="onboarding-invoker-show-more"
                    >
                        {t('content.invoker.showMore')}
                    </Button>
                )}
            </div>
        </div>
    )
}
