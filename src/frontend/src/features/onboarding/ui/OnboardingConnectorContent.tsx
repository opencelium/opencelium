import { Button } from '@shared/ui/primitives/Button'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { EntityText } from '@shared/ui/primitives/Text'
import { Link } from 'react-router-dom'
import { connectorRecommendations } from '@entities/connector/connector.recommendations'
import { useRef, useState } from 'react'
import './onboardingConnector.css'

type ConnectorGeneralProps = {
    title: string
    invoker: string
    invokers: string[]
    onTitleChange: (value: string) => void
    onInvokerChange: (value: string) => void
}

export function ConnectorGeneralContent({ title, invoker, invokers, onTitleChange, onInvokerChange }: ConnectorGeneralProps) {
    const { t } = useI18n('onboarding')
    return (
        <div>
            <p>{t('content.connector.generalBody')}</p>
            <div className="onboarding-wizard-progress"><b>1</b><span><strong>{t('content.connector.general')}</strong><small>{t('content.connector.generalDetail')}</small></span><i /><b className="is-pending">2</b><span className="is-pending"><strong>{t('content.connector.credentials')}</strong><small>{t('content.connector.credentialsDetail')}</small></span></div>
            <div className="onboarding-form-grid">
                <label className="is-title">{t('content.connector.title')} *<input autoFocus required value={title} onChange={event => onTitleChange(event.target.value)} placeholder={t('content.connector.titlePlaceholder')} /></label>
                <label className="is-description">{t('content.connector.description')}<textarea placeholder={t('content.connector.optional')} /></label>
                <label className="is-invoker">{t('content.connector.invoker')} *<select required value={invoker} onChange={event => onInvokerChange(event.target.value)}><option value="">{t('content.connector.selectInvoker')}</option>{invokers.map(name => <option key={name} value={name}>{name}</option>)}</select></label>
                <label className="is-timeout">{t('content.connector.timeout')}<span className="onboarding-timeout-row"><input type="number" defaultValue={30} /><small>{t('content.connector.selectedInvoker', { name: invoker || '—' })}</small></span></label>
            </div>
        </div>
    )
}

type ConnectorCredentialsProps = {
    title: string
    invoker: string
    requestData: Record<string, string>
    testStatus: 'idle' | 'loading' | 'success' | 'error'
    saveStatus: 'idle' | 'error'
    onCredentialChange: (key: string, value: string) => void
    onTest: () => Promise<'success' | 'error'>
    onBack: () => void
    onSubmit: () => Promise<void>
    saving: boolean
}

const SENSITIVE_CREDENTIAL = /password|token|secret|key/i

export function ConnectorCredentialsContent({ title, invoker, requestData, saveStatus, onCredentialChange, onTest, onBack, onSubmit, saving }: ConnectorCredentialsProps) {
    const { t } = useI18n('onboarding')
    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const testingRef = useRef(false)
    const handleTest = async () => {
        if (testingRef.current) return
        testingRef.current = true
        try {
            setTestStatus(await onTest())
        } finally {
            testingRef.current = false
        }
    }
    return (
        <div>
            <p>{t('content.connector.credentialsBody')}</p>
            <div className="onboarding-wizard-progress"><b className="is-complete">✓</b><span><strong>{t('content.connector.general')}</strong><small>{title} · {t('content.connector.invoker')} {invoker}</small></span><i /><b>2</b><span><strong>{t('content.connector.credentials')}</strong><small>{t('content.connector.credentialsShort')}</small></span></div>
            <div className="onboarding-form-grid">
                {Object.entries(requestData).map(([key, value]) => (
                    <label key={key} className={/url/i.test(key) ? 'is-wide' : undefined}>{key} *<input className={testStatus === 'error' && !/url/i.test(key) ? 'is-validation-error' : undefined} required autoComplete="off" type={SENSITIVE_CREDENTIAL.test(key) ? 'password' : /url/i.test(key) ? 'url' : 'text'} value={value} onChange={event => { setTestStatus('idle'); onCredentialChange(key, event.target.value) }} /></label>
                ))}
            </div>
            <div className="onboarding-test-row">
                <Button type="default" onClick={onBack}>{t('actions.back')}</Button>
                <Button type="primary" onClick={() => void handleTest()}>{t('content.connector.test')}</Button>
                <Button type="primary" loading={saving} disabled={!['success', 'error'].includes(testStatus) || saveStatus === 'error'} onClick={() => void onSubmit()}>{testStatus === 'error' ? t('actions.saveAnyway') : t('actions.submit')}</Button>
            </div>
            <div className="onboarding-test-message-slot">
                {saveStatus === 'error' ? (
                    <div className="onboarding-test-message is-error">{t('content.connector.saveFailed')}</div>
                ) : testStatus === 'success' ? (
                    <div className="onboarding-test-message is-success">✓ {t('content.connector.connected')}</div>
                ) : testStatus === 'error' ? (
                    <div className="onboarding-test-message is-error">{t('content.connector.testFailed')}</div>
                ) : null}
            </div>
            <div className="onboarding-warning">{t('content.connector.warning')}</div>
        </div>
    )
}

export function ConnectorCreatedContent({ title, methodCount }: { title: string; methodCount: number }) {
    const { t } = useI18n('onboarding')
    const testedAt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date())
    return (
        <div>
            <div className="onboarding-success-card"><strong><i>✓</i>{t('content.connector.createdConnected', { name: title })}</strong><span>{t('content.connector.createdAvailable', { count: methodCount })} · {t('content.connector.testedAt', { time: testedAt })}</span></div>
            <h3>{t('content.connector.nextTitle')}</h3>
            <p>{t('content.connector.nextBody')}</p>
            <div className="onboarding-tags">
                {connectorRecommendations.map((recommendation, index) => (
                    <Link key={recommendation.link} className={index === 0 ? 'is-recommended' : undefined} to={recommendation.link}>
                        <EntityText i18nKey={recommendation.title} />
                    </Link>
                ))}
            </div>
        </div>
    )
}
