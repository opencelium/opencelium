import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Alert } from '@shared/ui/primitives/Alert'
import { Button } from '@shared/ui/primitives/Button'
import { Card } from '@shared/ui/primitives/Card'
import type { AiHealth } from '@features/ai-assistant/model/aiGateway.types'
import { AiSettingsState } from './AiSettingsState'

type Props = {
    isConfigured: boolean
    health: AiHealth | undefined
    isUnreachable: boolean
    isChecking: boolean
    onCheckAgain: () => void
}

export function AiStatusSection({ isConfigured, health, isUnreachable, isChecking, onCheckAgain }: Props) {
    const { t } = useI18n('entities')
    const state = (isOk: boolean) => <AiSettingsState isOk={isOk} label={t(isOk ? 'ai-settings.status.ok' : 'ai-settings.status.missing')} />
    const extra = isConfigured && (
        <Button iconLeft="refresh" onClick={onCheckAgain} loading={isChecking} testId="ai-settings-check-again">
            {t('ai-settings.status.checkAgain')}
        </Button>
    )
    return (
        <Card title={t('ai-settings.status.title')} extra={extra} testId="ai-settings-status">
            {!isConfigured && <Alert type="info" showIcon message={t('ai-settings.status.notConfigured')} />}
            {isConfigured && isUnreachable && <Alert type="warning" showIcon message={t('ai-settings.status.unreachable')} />}
            {isConfigured && (
                <table className="aiSettingsRows">
                    <tbody>
                        <tr><th>{t('ai-settings.status.gateway')}</th><td>{state(Boolean(health) && !isUnreachable)}</td></tr>
                        <tr><th>{t('ai-settings.status.ollama')}</th><td>{state(Boolean(health?.ollama.reachable))}</td></tr>
                        <tr><th>{t('ai-settings.status.speech')}</th><td>{state(Boolean(health?.speech?.available))}</td></tr>
                    </tbody>
                </table>
            )}
        </Card>
    )
}
