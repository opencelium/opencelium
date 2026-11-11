import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Card } from '@shared/ui/primitives/Card'
import { Radio } from '@shared/ui/primitives/Radio'
import { Select } from '@shared/ui/primitives/Select'
import { Switch } from '@shared/ui/primitives/Switch'
import { useWakeWordToggle } from '@features/ai-assistant/voice/useWakeWordToggle'
import { VOICE_HOTKEY } from '@features/ai-assistant/voice/useVoiceHotkey'
import { BEEBOT_AUTO_STOP_MINUTES, type BeebotLanguage, useBeebotPrefsStore } from '@features/ai-assistant/voice/beebotPrefs.store'
import { AiSettingsField } from './admin/AiSettingsField'

const LANGUAGES: BeebotLanguage[] = ['auto', 'en', 'de']

/** The user's own voice settings, kept in this browser and applied at once. */
export function BeebotSettingsSection() {
    const { t } = useI18n('entities')
    const beebot = useWakeWordToggle()
    const prefs = useBeebotPrefsStore()
    return (
        <Card title={t('ai-settings.beebot.title')} testId="ai-settings-beebot">
            <Switch checked={beebot.isOn} loading={beebot.isStarting} disabled={!beebot.isAvailable}
                onChange={beebot.toggle} text={{ on: t('ai-settings.beebot.toggle'), off: t('ai-settings.beebot.toggle') }}
                testId="ai-settings-beebot-toggle" />
            {!beebot.isAvailable && <p className="aiSettingsNote">{t('ai-settings.beebot.unavailable')}</p>}
            <div className="aiSettingsFields">
                <AiSettingsField label={t('ai-settings.beebot.language')} hint={t('ai-settings.beebot.languageHint')}>
                    <span className="aiSettingsRadios" role="radiogroup">
                        {LANGUAGES.map((language) => (
                            <Radio key={language} name="beebot-language" value={language} checked={prefs.language === language}
                                onChange={() => prefs.setLanguage(language)} label={t(`ai-settings.beebot.languages.${language}`)}
                                testId={`ai-settings-beebot-language-${language}`} />
                        ))}
                    </span>
                </AiSettingsField>
                <AiSettingsField label={t('ai-settings.beebot.autoStop')}>
                    <Select<number> value={prefs.autoStopMinutes} sortOptions={false} testId="ai-settings-beebot-auto-stop"
                        onChange={(minutes) => {
                            const choice = BEEBOT_AUTO_STOP_MINUTES.find((option) => option === minutes)
                            if (choice) prefs.setAutoStopMinutes(choice)
                        }}
                        options={BEEBOT_AUTO_STOP_MINUTES.map((minutes) => ({
                            value: minutes, label: t('ai-settings.beebot.autoStopOption', { count: minutes }) }))} />
                </AiSettingsField>
            </div>
            <p className="aiSettingsNote">{t('ai-settings.beebot.howItWorks')}</p>
            <p className="aiSettingsNote">{t('ai-settings.beebot.hotkey', { key: VOICE_HOTKEY.toUpperCase() })}</p>
        </Card>
    )
}
