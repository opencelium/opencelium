import React from 'react'
import subscribeWizardImage from '@assets/images/wizard/subscription.gif'
import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import type { CommandNode } from '@shared/command/types'
import SubscriptionPage from '@pages/SubscriptionPage/SubscriptionPage'

const baseKey = 'subscription'
const route = '/license'

export const subscriptionDefinition: EntityDefinition = {
    name: baseKey,

    routes: [
        { type: 'view', path: route, element: <SubscriptionPage /> },
    ],

    fields: [],
    sections: [],
    wizard: {
        image: subscribeWizardImage as string,
        steps: []
    },

    commands: (): CommandNode<unknown>[] => [
        {
            type: 'literal',
            value: 'check',
            group: 'navigate',
            icon: 'history',
            description: 'commandPalette.descriptions.checkLicense',
            children: [
                {
                    type: 'literal',
                    value: 'license',
                    aliases: ['subscription', 'ops', 'usage'],
                    icon: 'history',
                    description: 'commandPalette.descriptions.checkLicense',
                    execute: (_, ctx) => ctx.navigate(route),
                },
            ],
        },
    ],
}
