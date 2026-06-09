import React from 'react'
import type {CommandExecutionContext, CommandNode} from '@shared/command/types'
import {MasterPasswordDialog, useMasterPasswordStore} from '@features/master-password'
import {useModalStore} from '@app/layouts/AppLayout/GlobalModal/global-modal.store'
import {isContainerNode} from '@entities/systemConfig/model/types'
import {buildNodeByPathMap} from '@entities/systemConfig/model/helpers'
import {ConfigLeafEditDialog} from '@entities/systemConfig/ui/ConfigLeafEditDialog'
import {loadConfigFields, resolveSystemConfig} from './resolveSystemConfig'

const ROOT_INPUT = 'system config '

/** Close the modal, return to a fresh search, and refocus the palette input. */
function returnToSearch(ctx: CommandExecutionContext) {
    useModalStore.getState().close()
    ctx.setInputValue(ROOT_INPUT)
    ctx.focusInput?.()
}

async function executeSystemConfig(args: {query?: string}, ctx: CommandExecutionContext) {
    if (!useMasterPasswordStore.getState().masterPassword) {
        ctx.openModal(<MasterPasswordDialog bare onUnlock={() => returnToSearch(ctx)} />)
        return
    }

    const path = String(args.query ?? '').trim()
    if (!path) return

    const node = buildNodeByPathMap(await loadConfigFields()).get(path)
    if (!node) return

    // A container only narrows the search — drill into its children.
    if (isContainerNode(node)) {
        ctx.setInputValue(`${ROOT_INPUT}${path} `)
        ctx.focusInput?.()
        return
    }

    ctx.openModal(<ConfigLeafEditDialog path={path} onSaved={() => returnToSearch(ctx)} />, {
        width: 'fit-content',
    })
}

export function buildSystemConfigCommand(): CommandNode<unknown> {
    return {
        type: 'literal',
        value: 'system',
        group: 'manage',
        icon: 'settings',
        description: 'commandPalette.descriptions.system',
        children: [
            {
                type: 'literal',
                value: 'config',
                aliases: ['system-config', 'application-config'],
                icon: 'settings',
                children: [
                    {
                        type: 'entity',
                        name: 'query',
                        icon: 'settings',
                        group: 'manage',
                        resolve: (input) => resolveSystemConfig(typeof input === 'string' ? input : ''),
                        execute: (args, ctx) => executeSystemConfig(args as {query?: string}, ctx),
                    },
                ],
            },
        ],
    }
}
