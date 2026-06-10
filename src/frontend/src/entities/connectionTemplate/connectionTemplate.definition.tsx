import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import en from '@entities/connectionTemplate/i18n/en.json'
import de from '@entities/connectionTemplate/i18n/de.json'
import type { ConnectionTemplate } from '@entities/connectionTemplate/model/types'
import { ConnectionTemplateUploadButton } from '@entities/connectionTemplate/components/ConnectionTemplateUploadButton'
import { ConnectionTemplateDownloadAction } from '@entities/connectionTemplate/components/ConnectionTemplateDownloadAction'

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
}

export type { ConnectionTemplate }
