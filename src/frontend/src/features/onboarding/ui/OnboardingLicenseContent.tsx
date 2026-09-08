import { Button } from '@shared/ui/primitives/Button'
import { useGetActiveSubscriptionQuery } from '@entities/subscription/api/subscriptionApi'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import './onboardingLicense.css'

/**
 * Free-plan allowance, shown until the subscription endpoint answers. Mirrors the
 * figure in the step's own title (steps.license.title), so keep the two in step.
 */
const FREE_PLAN_OPERATIONS = 25_000

/**
 * Read-only summary plus a single hand-off to the licence page, which owns every
 * action (activation, extra operations, offline request files) and knows which of
 * them this install actually offers. The tour does not duplicate that logic.
 */
export function OnboardingLicenseContent({ onOpenLicensePage }: { onOpenLicensePage: () => void }) {
    const { t } = useI18n('onboarding')
    const { data: subscription } = useGetActiveSubscriptionQuery()
    const total = subscription?.totalOperationUsage ?? FREE_PLAN_OPERATIONS
    const used = subscription?.currentOperationUsage ?? 0
    const percent = Math.min(100, Math.max(0, total > 0 ? (used / total) * 100 : 0))

    return (
        <div className="onboarding-license">
            <p>{t('content.license.body')}</p>
            <div className="onboarding-license__grid">
                <section>
                    <h3>{t('content.license.information')}</h3>
                    <dl>
                        <dt>{t('content.license.status')}</dt>
                        <dd>{subscription?.active ? t('content.license.valid') : t('content.license.free')}</dd>
                        <dt>{t('content.license.type')}</dt>
                        <dd>{subscription?.type ?? t('content.license.free')}</dd>
                        <dt>{t('content.license.operations')}</dt>
                        <dd>{total.toLocaleString()}</dd>
                        <dt>{t('content.license.expiration')}</dt>
                        <dd>{subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : '∞'}</dd>
                    </dl>
                </section>
                <section className="onboarding-license__actions">
                    <h3>{t('content.license.more')}</h3>
                    <p>{t('content.license.actionsBody')}</p>
                    <Button type="primary" onClick={onOpenLicensePage} testId="onboarding-license-open-page">
                        {t('content.license.openPage')}
                    </Button>
                </section>
            </div>
            <div className="onboarding-license__usage">
                <span>{t('content.license.thisMonth')}</span>
                <small>{t('content.license.usage', { used: used.toLocaleString(), total: total.toLocaleString() })}</small>
                <i><b style={{ width: `${percent}%` }} /></i>
            </div>
        </div>
    )
}
