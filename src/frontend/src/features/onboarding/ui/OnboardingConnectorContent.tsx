import { Button } from '@shared/ui/primitives/Button'
import { Input } from '@shared/ui/primitives/Input'
import { Textarea } from '@shared/ui/primitives/Textarea'
import { Select } from '@shared/ui/primitives/Select'
import { Alert } from '@shared/ui/primitives/Alert'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { EntityText } from '@shared/ui/primitives/Text'
import { Link } from 'react-router-dom'
import { connectorRecommendations } from '@entities/connector/connector.recommendations'
import { useRef, useState } from 'react'
import './onboardingConnector.css'

type ConnectorGeneralProps = {
    title: string
    description: string
    invoker: string
    timeout: number
    invokers: string[]
    onTitleChange: (value: string) => void
    onDescriptionChange: (value: string) => void
    onInvokerChange: (value: string) => void
    onTimeoutChange: (value: number) => void
}

export function ConnectorGeneralContent({ title, description, invoker, timeout, invokers, onTitleChange, onDescriptionChange, onInvokerChange, onTimeoutChange }: ConnectorGeneralProps) {
    const { t } = useI18n('onboarding')
    return (
        <div>
            <p>{t('content.connector.generalBody')}</p>
            <div className="onboarding-wizard-progress"><b>1</b><span><strong>{t('content.connector.general')}</strong><small>{t('content.connector.generalDetail')}</small></span><i /><b className="is-pending">2</b><span className="is-pending"><strong>{t('content.connector.credentials')}</strong><small>{t('content.connector.credentialsDetail')}</small></span></div>
            <div className="onboarding-form-grid">
                <label className="is-title">
                    <span>{t('content.connector.title')} *</span>
                    <Input autoFocus value={title} placeholder={t('content.connector.titlePlaceholder')} onChange={event => onTitleChange(event.target.value)} testId="onboarding-connector-title" />
                </label>
                <label className="is-description">
                    <span>{t('content.connector.description')}</span>
                    <Textarea value={description} placeholder={t('content.connector.optional')} onChange={event => onDescriptionChange(event.target.value)} testId="onboarding-connector-description" />
                </label>
                <label className="is-invoker">
                    <span>{t('content.connector.invoker')} *</span>
                    <Select
                        value={invoker}
                        options={invokers.map(name => ({ value: name, label: name }))}
                        placeholder={t('content.connector.selectInvoker')}
                        onChange={onInvokerChange}
                        testId="onboarding-connector-invoker"
                    />
                </label>
                <label className="is-timeout">
                    <span>{t('content.connector.timeout')}</span>
                    <span className="onboarding-timeout-row">
                        <span className="onboarding-timeout-field">
                            <Input type="number" value={String(timeout)} onChange={event => onTimeoutChange(Number(event.target.value))} testId="onboarding-connector-timeout" />
                        </span>
                        <small>{t('content.connector.selectedInvoker', { name: invoker || '—' })}</small>
                    </span>
                </label>
            </div>
        </div>
    )
}

type ConnectorCredentialsProps = {
    title: string
    invoker: string
    requestData: Record<string, string>
    saveStatus: 'idle' | 'error'
    onCredentialChange: (key: string, value: string) => void
    onTest: () => Promise<'success' | 'error'>
    onBack: () => void
    onSubmit: () => Promise<void>
    saving: boolean
}

const SENSITIVE_CREDENTIAL = /password|token|secret|key/i
const URL_CREDENTIAL = /url/i

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
                {Object.entries(requestData).map(([key, value]) => {
                    const isUrl = URL_CREDENTIAL.test(key)
                    return (
                        <label key={key} className={isUrl ? 'is-wide' : undefined}>
                            <span>{key} *</span>
                            <Input
                                type={SENSITIVE_CREDENTIAL.test(key) ? 'password' : 'text'}
                                value={value}
                                error={testStatus === 'error' && !isUrl}
                                onChange={event => { setTestStatus('idle'); onCredentialChange(key, event.target.value) }}
                                testId={`onboarding-connector-credential-${key.toLowerCase()}`}
                            />
                        </label>
                    )
                })}
            </div>
            <div className="onboarding-test-row">
                <Button type="default" onClick={onBack} testId="onboarding-connector-back">{t('actions.back')}</Button>
                <Button type="primary" onClick={() => void handleTest()} testId="onboarding-connector-test">{t('content.connector.test')}</Button>
                <Button type="primary" loading={saving} disabled={!['success', 'error'].includes(testStatus) || saveStatus === 'error'} onClick={() => void onSubmit()} testId="onboarding-connector-submit">{testStatus === 'error' ? t('actions.saveAnyway') : t('actions.submit')}</Button>
            </div>
            <div className="onboarding-test-message-slot">
                {saveStatus === 'error' ? (
                    <Alert type="error" showIcon message={t('content.connector.saveFailed')} />
                ) : testStatus === 'success' ? (
                    <Alert type="success" showIcon message={t('content.connector.connected')} />
                ) : testStatus === 'error' ? (
                    <Alert type="error" showIcon message={t('content.connector.testFailed')} />
                ) : null}
            </div>
            <Alert type="warning" showIcon message={t('content.connector.warning')} className="onboarding-warning" />
        </div>
    )
}

export function ConnectorCreatedContent({ title, methodCount }: { title: string; methodCount: number }) {
    const { t } = useI18n('onboarding')
    const testedAt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date())
    return (
        <div>
            <Alert
                type="success"
                showIcon
                className="onboarding-success-card"
                message={t('content.connector.createdConnected', { name: title })}
                description={`${t('content.connector.createdAvailable', { count: methodCount })} · ${t('content.connector.testedAt', { time: testedAt })}`}
            />
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
