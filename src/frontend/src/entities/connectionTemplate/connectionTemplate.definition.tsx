import { message } from 'antd'
import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import type { CommandNode } from '@shared/command/types'
import { i18n } from '@shared/i18n/config/i18n'
import en from '@entities/connectionTemplate/i18n/en.json'
import de from '@entities/connectionTemplate/i18n/de.json'
import type { ConnectionTemplate } from '@entities/connectionTemplate/model/types'
import { ConnectionTemplateUploadButton } from '@entities/connectionTemplate/components/ConnectionTemplateUploadButton'
import { ConnectionTemplateDownloadAction } from '@entities/connectionTemplate/components/ConnectionTemplateDownloadAction'
import {
    pickConnectionTemplateFile,
    uploadConnectionTemplate,
} from '@entities/connectionTemplate/lib/uploadConnectionTemplate'
import { downloadConnectionTemplate } from '@entities/connectionTemplate/lib/downloadConnectionTemplate'
import { resolveConnectionTemplateIds } from '@entities/connectionTemplate/command/resolvers/resolveConnectionTemplateIds'
import { resolveConnectionTemplateNames } from '@entities/connectionTemplate/command/resolvers/resolveConnectionTemplateNames'
import { extractTemplateIdFromSuggestion } from '@entities/connectionTemplate/command/connectionTemplateCache'

const baseKey = 'connection-template'

export const connectionTemplateDefinition: EntityDefinition = {
    name: baseKey,
    plural: 'connectionTemplates',

    routes: [
        // List lives at /workflow-template; the entity name stays connection-template
        // (i18n keys, registry lookup) and the API baseUrl stays /template.
        { type: 'list', entityRouteName: 'workflow-template' },
    ],

    list: {
        titleKey: `${baseKey}.list.title`,
        subtitleKey: `${baseKey}.list.subTitle`,
        defaultSort: { field: 'name', direction: 'asc' },
        bulkDelete: true,
        actions: [
            {
                type: 'custom',
                key: 'download',
                render: ({ row, rowId }) => <ConnectionTemplateDownloadAction row={row} rowId={rowId} />,
            },
            { type: 'delete' },
        ],
        headerActions: [
            { key: 'upload', render: () => <ConnectionTemplateUploadButton /> },
        ],
    },

    i18n: { en, de },

    api: {
        baseUrl: '/template',
        identifierField: 'name',
        primaryKey: 'templateId',
        resolveIdentifier: async () => [],
    },

    fields: [
        {
            name: 'name',
            type: 'string',
            ui: {
                component: 'input',
                props: { labelKey: `${baseKey}.fields.name.label` },
            },
            table: {
                visible: true,
                order: 1,
                sortable: true,
                searchable: true,
                labelKey: `${baseKey}.fields.name.label`,
            },
        },
        {
            name: 'description',
            type: 'string',
            ui: {
                component: 'textarea',
                props: { labelKey: `${baseKey}.fields.description.label` },
            },
            table: {
                visible: true,
                order: 2,
                searchable: true,
                labelKey: `${baseKey}.fields.description.label`,
            },
        },
        {
            name: 'connection.fromConnector.invoker.name',
            type: 'string',
            ui: {
                component: 'input',
                props: { labelKey: `${baseKey}.fields.fromInvoker.label` },
            },
            table: {
                visible: true,
                order: 3,
                searchable: true,
                labelKey: `${baseKey}.fields.fromInvoker.label`,
            },
        },
        {
            name: 'connection.toConnector.invoker.name',
            type: 'string',
            ui: {
                component: 'input',
                props: { labelKey: `${baseKey}.fields.toInvoker.label` },
            },
            table: {
                visible: true,
                order: 4,
                searchable: true,
                labelKey: `${baseKey}.fields.toInvoker.label`,
            },
        },
    ],

    sections: [],

    wizard: {
        steps: [],
    },

    commands: (): CommandNode<unknown>[] => [
        {
            type: 'literal',
            value: 'upload',
            group: 'create',
            icon: 'upload',
            description: 'commandPalette.descriptions.uploadTemplate',
            children: [
                {
                    type: 'literal',
                    value: 'workflow-template',
                    icon: 'upload',
                    description: 'commandPalette.descriptions.uploadTemplate',
                    execute: async (_, ctx) => {
                        const tEntities = i18n.getFixedT(i18n.language, 'entities')
                        const file = await pickConnectionTemplateFile()
                        if (!file) return

                        ctx.setLoading(true)
                        try {
                            const uploaded = await uploadConnectionTemplate(file, () =>
                                ctx.confirm({
                                    title: tEntities(
                                        'connection-template.list.upload.confirmReplace.title',
                                    ),
                                    message: tEntities(
                                        'connection-template.list.upload.confirmReplace.message',
                                    ),
                                }),
                            )
                            if (uploaded) {
                                message.success(
                                    tEntities('connection-template.list.upload.success', {
                                        name: file.name,
                                    }),
                                )
                                ctx.setInputValue('')
                            }
                        } catch (err) {
                            console.error(err)
                            message.error(tEntities('connection-template.list.upload.error'))
                        } finally {
                            ctx.setLoading(false)
                        }
                    },
                },
            ],
        },
        {
            type: 'literal',
            value: 'download',
            aliases: ['export'],
            group: 'manage',
            icon: 'download',
            description: 'commandPalette.descriptions.downloadTemplate',
            children: [
                {
                    type: 'literal',
                    value: 'workflow-template',
                    icon: 'download',
                    description: 'commandPalette.descriptions.downloadTemplate',
                    children: [
                        {
                            type: 'literal',
                            value: 'by',
                            children: [
                                {
                                    type: 'literal',
                                    value: 'templateId',
                                    children: [
                                        {
                                            type: 'entity',
                                            name: 'identifier',
                                            resolve: resolveConnectionTemplateIds,
                                            execute: async (args, ctx) => {
                                                const tEntities = i18n.getFixedT(i18n.language, 'entities')
                                                const templateId = args.identifier as string
                                                ctx.setLoading(true)
                                                try {
                                                    const downloaded = await downloadConnectionTemplate(templateId)
                                                    message.success(
                                                        tEntities('connection-template.list.download.success', {
                                                            name: downloaded,
                                                        }),
                                                    )
                                                } catch (err) {
                                                    console.error(err)
                                                    message.error(
                                                        tEntities('connection-template.list.download.error'),
                                                    )
                                                } finally {
                                                    ctx.setLoading(false)
                                                }
                                            },
                                        },
                                    ],
                                },
                                {
                                    type: 'literal',
                                    value: 'name',
                                    children: [
                                        {
                                            type: 'entity',
                                            name: 'identifier',
                                            resolve: resolveConnectionTemplateNames,
                                            execute: async (args, ctx) => {
                                                const tEntities = i18n.getFixedT(i18n.language, 'entities')
                                                const suggestion = args.identifier as string
                                                ctx.setLoading(true)
                                                try {
                                                    const templateId = extractTemplateIdFromSuggestion(suggestion)
                                                    if (templateId === undefined) {
                                                        throw new Error(`Template not found: ${suggestion}`)
                                                    }
                                                    const downloaded = await downloadConnectionTemplate(templateId)
                                                    message.success(
                                                        tEntities('connection-template.list.download.success', {
                                                            name: downloaded,
                                                        }),
                                                    )
                                                } catch (err) {
                                                    console.error(err)
                                                    message.error(
                                                        tEntities('connection-template.list.download.error'),
                                                    )
                                                } finally {
                                                    ctx.setLoading(false)
                                                }
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
}

export type { ConnectionTemplate }
