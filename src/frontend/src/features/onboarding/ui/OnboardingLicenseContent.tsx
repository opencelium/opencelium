import { useRef, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@shared/ui/primitives/Button'
import { useGetActiveSubscriptionQuery, useGetSyncStatusQuery } from '@entities/subscription/api/subscriptionApi'
import { useLicenseActions } from '@pages/SubscriptionPage/license-actions/useLicenseActions'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import './onboardingLicense.css'

/**
 * Free-plan allowance, shown until the subscription endpoint answers. Mirrors the
 * figure in the step's own title (steps.license.title), so keep the two in step.
 */
const FREE_PLAN_OPERATIONS = 25_000
const LICENSE_FILE_ACCEPT = '.txt,text/plain'

export function OnboardingLicenseContent() {
    const navigate = useNavigate()
    const { t } = useI18n('onboarding')
    const importInputRef = useRef<HTMLInputElement>(null)
    const extraOpsInputRef = useRef<HTMLInputElement>(null)
    const { data: subscription } = useGetActiveSubscriptionQuery()
    const { data: syncStatus } = useGetSyncStatusQuery()
    const { pendingAction, generateActivationRequest, importLicense, uploadExtraOps } = useLicenseActions()
    const online = syncStatus?.active === true
    const total = subscription?.totalOperationUsage ?? FREE_PLAN_OPERATIONS
    const used = subscription?.currentOperationUsage ?? 0
    const percent = Math.min(100, Math.max(0, total > 0 ? (used / total) * 100 : 0))
    const pickFile = (handler: (file: File) => Promise<boolean>) => async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (file) await handler(file)
    }

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
                    <h3>{online ? t('content.license.more') : t('content.license.offline')}</h3>
                    <p>{online ? t('content.license.onlineBody') : t('content.license.offlineBody')}</p>
                    <div className="onboarding-license__actions-stack">
                        <input ref={importInputRef} hidden type="file" accept={LICENSE_FILE_ACCEPT} onChange={pickFile(importLicense)} />
                        <input ref={extraOpsInputRef} hidden type="file" accept={LICENSE_FILE_ACCEPT} onChange={pickFile(uploadExtraOps)} />
                        {online ? (
                            <Button type="primary" onClick={() => navigate('/license')} testId="onboarding-license-activate">{t('content.license.activate')}</Button>
                        ) : (
                            <>
                                <Button type="primary" loading={pendingAction === 'generateRequest'} onClick={generateActivationRequest} testId="onboarding-license-generate">{t('content.license.generate')}</Button>
                                <Button type="default" loading={pendingAction === 'importLicense'} onClick={() => importInputRef.current?.click()} testId="onboarding-license-import">{t('content.license.import')}</Button>
                            </>
                        )}
                        <Button type="default" loading={pendingAction === 'extraOps'} onClick={() => extraOpsInputRef.current?.click()} testId="onboarding-license-extra-ops">{t('content.license.extraOps')}</Button>
                    </div>
                    <small className={online ? 'is-online' : 'is-offline'}>
                        {online ? t('content.license.connected') : t('content.license.unreachable')}
                    </small>
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
