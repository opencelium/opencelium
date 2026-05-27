import React from 'react'
import type {EntityDefinition} from '@/engine/entity/EntityDefinition'
import type {CommandNode} from '@shared/command/types'
import {SystemConfigPage} from '@pages/SystemConfigPage/SystemConfigPage'
import en from '@entities/systemConfig/i18n/en.json'
import de from '@entities/systemConfig/i18n/de.json'

const baseKey = 'system-config'
const route = '/system-config'

export const systemConfigDefinition: EntityDefinition = {
    name: baseKey,

    routes: [
        {type: 'view', path: route, element: <SystemConfigPage />},
    ],

    i18n: {en, de},

    fields: [],
    sections: [],
    wizard: {steps: []},

    commands: (): CommandNode<unknown>[] => [
        {
            type: 'literal',
            value: 'update',
            group: 'manage',
            icon: 'settings',
            description: 'commandPalette.descriptions.updateSystemConfig',
            children: [
                {
                    type: 'literal',
                    value: 'system-config',
                    aliases: ['config', 'application-config'],
                    icon: 'settings',
                    description: 'commandPalette.descriptions.updateSystemConfig',
                    execute: (_, ctx) => ctx.navigate(route),
                },
            ],
        },
    ],
}
