import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import en from '@entities/connection/i18n/en.json'
import de from '@entities/connection/i18n/de.json'
import type { Connection } from '@entities/connection/model/types'
import { DownloadAsTemplateAction } from '@entities/connection/ui/DownloadAsTemplateAction'
import { CreateConnectionButton } from '@entities/connection/ui/CreateConnectionButton'

const baseKey = 'connection'

export const connectionDefinition: EntityDefinition = {
    name: baseKey,

    routes: [
        { type: 'list' },
    ],

    api: {
        baseUrl: '/connection',
        identifierField: 'title',
        primaryKey: 'id',
        resolveIdentifier: async () => [],
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
                render: () => <CreateConnectionButton />,
            },
        ],
        actions: [
            { type: 'view' },
            { type: 'update' },
            { type: 'delete' },
            {
                type: 'custom',
                key: 'download-as-template',
                render: ({ row }) => <DownloadAsTemplateAction row={row as Connection} />,
            },
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
}
