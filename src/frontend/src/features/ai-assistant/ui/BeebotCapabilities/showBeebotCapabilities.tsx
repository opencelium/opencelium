import { message } from 'antd'
import { i18n } from '@shared/i18n/config/i18n'
import { WAKE_WORD } from '../../voice/wakeWord'

const EDITOR_EXAMPLES = ['addMethod', 'addIf', 'test', 'fix', 'undo'] as const
const GENERAL_EXAMPLES = ['schedules', 'createUser', 'theme', 'help', 'check'] as const
const SHOWN_FOR_SEC = 12

/** "What can you do?": a few requests that work where the user is, shown long enough to read. Returns the spoken line. */
export function showBeebotCapabilities(isInEditor: boolean): string {
    const t = i18n.getFixedT(i18n.language, 'common')
    const examples = isInEditor
        ? EDITOR_EXAMPLES.map(key => t(`commandPalette.beebot.capabilities.editor.${key}`))
        : GENERAL_EXAMPLES.map(key => t(`commandPalette.beebot.capabilities.general.${key}`))
    const intro = t('commandPalette.beebot.capabilities.intro', { name: WAKE_WORD.name })
    message.info({
        duration: SHOWN_FOR_SEC,
        content: (
            <div className="beebotCapabilities" data-testid="beebot-capabilities">
                <div>{intro}</div>
                <ul style={{ margin: '4px 0 0', paddingLeft: 18, textAlign: 'left' }}>
                    {examples.map(example => <li key={example}>“{example}”</li>)}
                </ul>
            </div>
        ),
    })
    return intro
}
