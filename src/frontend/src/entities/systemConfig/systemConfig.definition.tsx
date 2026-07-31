import React from 'react'
import type {EntityDefinition} from '@/engine/entity/EntityDefinition'
import type {CommandNode} from '@shared/command/types'
import {buildActionAccess} from '@/engine/policy'
import {RequireComponentRead} from '@app/router/guards/RequireComponentRead'
import {SystemConfigPage} from '@pages/SystemConfigPage/SystemConfigPage'
import {buildSystemConfigCommand} from '@entities/systemConfig/command/systemConfigCommand'
import en from '@entities/systemConfig/i18n/en.json'
import de from '@entities/systemConfig/i18n/de.json'

const baseKey = 'system-config'
const route = '/system-config'

export const systemConfigDefinition: EntityDefinition = {
    name: baseKey,
    permissionComponent: 'APP',

    routes: [
        {
            type: 'view',
            path: route,
            element: <RequireComponentRead component="APP"><SystemConfigPage /></RequireComponentRead>,
        },
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
                    // The outer "update" literal is shared/merged across every entity's
                    // update command — access must live on this APP-specific child node.
                    // Gated by READ only: the page itself now handles the update-vs-view
                    // distinction internally (see SystemConfigPage's readOnly wiring).
                    access: buildActionAccess('APP', 'READ'),
                    execute: (_, ctx) => ctx.navigate(route),
                },
            ],
        },
        buildSystemConfigCommand(),
    ],
}
