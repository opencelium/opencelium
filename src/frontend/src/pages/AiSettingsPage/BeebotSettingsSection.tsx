import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Card } from '@shared/ui/primitives/Card'
import { Switch } from '@shared/ui/primitives/Switch'
import { useWakeWordToggle } from '@features/ai-assistant/voice/useWakeWordToggle'
import { VOICE_HOTKEY } from '@features/ai-assistant/voice/useVoiceHotkey'

export function BeebotSettingsSection() {
    const { t } = useI18n('entities')
    const beebot = useWakeWordToggle()
    return (
        <Card title={t('ai-settings.beebot.title')} testId="ai-settings-beebot">
            <Switch checked={beebot.isOn} loading={beebot.isStarting} disabled={!beebot.isAvailable}
                onChange={beebot.toggle} text={{ on: t('ai-settings.beebot.toggle'), off: t('ai-settings.beebot.toggle') }}
                testId="ai-settings-beebot-toggle" />
            {!beebot.isAvailable && <p className="aiSettingsNote">{t('ai-settings.beebot.unavailable')}</p>}
            <p className="aiSettingsNote">{t('ai-settings.beebot.howItWorks')}</p>
            <p className="aiSettingsNote">{t('ai-settings.beebot.hotkey', { key: VOICE_HOTKEY.toUpperCase() })}</p>
        </Card>
    )
}
