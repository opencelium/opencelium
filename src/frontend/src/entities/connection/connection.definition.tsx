import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import en from '@entities/connection/i18n/en.json'
import de from '@entities/connection/i18n/de.json'
import type { Connection } from '@entities/connection/model/types'
import { DownloadAsTemplateAction } from '@entities/connection/ui/DownloadAsTemplateAction'
import { DuplicateConnectionAction } from '@entities/connection/ui/DuplicateConnectionAction'
import { CreateConnectionButton } from '@entities/connection/ui/CreateConnectionButton'
import { createEntityCommands } from '@/engine/entity/command/createEntityCommands'
import { resolveConnectionTitles } from '@entities/connection/command/resolvers/resolveConnectionTitles'
import { resolveConnectionIds } from '@entities/connection/command/resolvers/resolveConnectionIds'
import { findConnectionIdByTitle } from '@entities/connection/command/connectionCache'

const baseKey = 'connection'

const resolveConnectionId = (value: string): string => {
    if (/^\d+$/.test(value)) return value
    return String(findConnectionIdByTitle(value) ?? value)
}

const buildConnectionPageUrl = (verb: 'view' | 'update', value: string): string =>
    `/workflow/${verb}/${encodeURIComponent(resolveConnectionId(value))}`

const buildConnectionFetchUrl = (value: string): string =>
    `/connection/${encodeURIComponent(resolveConnectionId(value))}`

export const connectionDefinition: EntityDefinition = {
    name: baseKey,
    permissionComponent: 'CONNECTION',

    routes: [
        // The list lives at /workflow (the create/view/update editor pages are the
        // custom Workflow component, also under /workflow — see app/router/routes.tsx).
        // The backend API path stays /connection (see api.baseUrl below).
        { type: 'list', entityRouteName: 'workflow' },
    ],

    api: {
        baseUrl: '/connection',
        identifierField: 'title',
        primaryKey: 'id',
        resolveIdentifier: resolveConnectionTitles,
    },

    list: {
        titleKey: `${baseKey}.list.title`,
        subtitleKey: `${baseKey}.list.subTitle`,
        searchPlaceholderKey: `${baseKey}.list.searchPlaceholder`,
        fetchUrl: '/connection/all/meta',
        defaultSort: { field: 'title', direction: 'asc' },
        bulkDelete: true,
        headerActions: [
            {
                key: 'create-connection',
                permissionAction: 'CREATE',
                render: () => <CreateConnectionButton />,
            },
        ],
        actions: [
            {
                type: 'custom',
                key: 'duplicate-connection',
                permissionAction: 'CREATE',
                render: ({ row }) => <DuplicateConnectionAction row={row as Connection} />,
            },
            {
                type: 'custom',
                key: 'download-as-template',
                render: ({ row }) => <DownloadAsTemplateAction row={row as Connection} />,
            },
            {
                type: 'update',
                buildNavigationUrl: (_entity, value) => `/workflow/update/${encodeURIComponent(value)}`,
            },
            { type: 'delete' },
        ],
    },

    i18n: { en, de },

    fields: [
        {
            name: 'title',
            type: 'string',
            ui: { component: 'input' },
            table: {
                visible: true,
                order: 1,
                sortable: true,
                searchable: true,
                labelKey: `${baseKey}.list.columns.title`,
            },
        },
        {
            name: 'description',
            type: 'string',
            ui: { component: 'textarea' },
            table: {
                visible: true,
                order: 2,
                sortable: true,
                searchable: true,
                labelKey: `${baseKey}.list.columns.description`,
            },
        },
    ],

    sections: [],

    wizard: {
        steps: [],
    },

    commands: (def) => [
        ...createEntityCommands({
            def,
            commandName: 'workflow',
            config: { include: ['update'] },
            dsl: {
                update: {
                    by: [
                        {
                            field: 'id',
                            resolve: resolveConnectionIds,
                            customPath: true,
                            buildFetchUrl: (_def, value) => buildConnectionFetchUrl(value),
                            buildNavigationUrl: (_def, value) => buildConnectionPageUrl('update', value),
                        },
                        {
                            field: 'title',
                            resolve: resolveConnectionTitles,
                            buildFetchUrl: (_def, value) => buildConnectionFetchUrl(value),
                            buildNavigationUrl: (_def, value) => buildConnectionPageUrl('update', value),
                        },
                    ],
                },
            },
        }),
    ],
}
