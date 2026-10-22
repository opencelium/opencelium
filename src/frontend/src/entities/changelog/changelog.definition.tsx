import updateAssistantWizardImage from '@assets/images/wizard/update-assistant.svg'
import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import type { CommandNode } from '@shared/command/types'
import ChangelogPage from '@pages/ChangelogPage/ChangelogPage'
import { CHANGELOG_ROUTE } from '@features/changelog/model/changelog.route'
import en from '@entities/changelog/i18n/en.json'
import de from '@entities/changelog/i18n/de.json'

const baseKey = 'changelog'

export const changelogDefinition: EntityDefinition = {
    name: baseKey,

    routes: [
        { type: 'view', path: CHANGELOG_ROUTE, element: <ChangelogPage /> },
    ],

    i18n: { en, de },

    fields: [],
    sections: [],
    wizard: {
        image: updateAssistantWizardImage as string,
        steps: []
    },

    commands: (): CommandNode<unknown>[] => [
        {
            type: 'literal',
            value: 'changelog',
            aliases: ['whats-new', 'release-notes'],
            group: 'general',
            icon: 'journal-text',
            description: 'commandPalette.descriptions.changelog',
            execute: (_, ctx) => {
                ctx.setInputValue('')
                ctx.navigate(CHANGELOG_ROUTE)
            },
        },
    ],
}
