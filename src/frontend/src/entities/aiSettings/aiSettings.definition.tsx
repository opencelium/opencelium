import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import type { CommandNode } from '@shared/command/types'
import { AiSettingsPage } from '@pages/AiSettingsPage/AiSettingsPage'
import en from '@entities/aiSettings/i18n/en.json'
import de from '@entities/aiSettings/i18n/de.json'

const route = '/ai-settings'

/** Navigation-only: hosts the AI settings page and its palette command. */
export const aiSettingsDefinition: EntityDefinition = {
    name: 'ai-settings',

    routes: [{ type: 'view', path: route, element: <AiSettingsPage /> }],

    i18n: { en, de },

    fields: [],
    sections: [],
    wizard: { steps: [] },

    commands: (): CommandNode<unknown>[] => [
        {
            type: 'literal',
            value: 'check',
            group: 'navigate',
            icon: 'sparkles',
            description: 'commandPalette.descriptions.checkAiSettings',
            children: [
                {
                    type: 'literal',
                    value: 'ai',
                    aliases: ['ai-settings', 'beebot', 'models', 'ki'],
                    icon: 'sparkles',
                    description: 'commandPalette.descriptions.checkAiSettings',
                    execute: (_, ctx) => ctx.navigate(route),
                },
            ],
        },
    ],
}
