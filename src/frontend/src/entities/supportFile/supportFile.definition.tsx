import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import { i18n } from '@shared/i18n/config/i18n'
import en from '@entities/supportFile/i18n/en.json'
import de from '@entities/supportFile/i18n/de.json'
import { StatusCell } from '@entities/supportFile/ui/StatusCell'
import { ConnectionCell } from '@entities/supportFile/ui/ConnectionCell'
import { DownloadAction } from '@entities/supportFile/ui/DownloadAction'
import {
    extractFilename,
    extractTimestamp,
    extractTimestampValue,
} from '@entities/supportFile/model/supportFile.utils'
import type { SupportFile } from '@entities/supportFile/model/types'

const baseKey = 'support-file'

export const supportFileDefinition: EntityDefinition = {
    name: baseKey,

    routes: [
        { type: 'list' },
    ],

    api: {
        baseUrl: '/connection/support-file',
        identifierField: 'supportFile',
        resolveIdentifier: async () => [],
    },

    list: {
        titleKey: `${baseKey}.list.title`,
        subtitleKey: `${baseKey}.list.subTitle`,
        searchPlaceholderKey: `${baseKey}.list.searchPlaceholder`,
        fetchUrl: '/connection/support-file/list',
        rowKey: 'supportFile',
        defaultSort: { field: 'timestamp', direction: 'desc' },
        bulkDelete: {
            url: '/connection/support-file/delete/list',
            method: 'PUT',
            field: 'supportFile',
            buildPayload: (paths) => ({
                filenames: paths.map((p) => extractFilename(p)),
            }),
        },
        actions: [
            {
                type: 'custom',
                key: 'download',
                render: ({ row }) => <DownloadAction row={row as SupportFile} />,
            },
            {
                type: 'delete',
                field: 'supportFile',
                buildDeleteUrl: (_entity, value) =>
                    `/connection/support-file/${encodeURIComponent(extractFilename(value))}`,
                confirmMessage: (value) => {
                    const t = i18n.getFixedT(i18n.language, 'entities')
                    return t(`${baseKey}.list.confirmDelete.message`, { filePath: value })
                },
            },
        ],
    },

    i18n: { en, de },

    fields: [
        {
            name: 'connectionTitle',
            type: 'string',
            ui: { component: 'input' },
            table: {
                width: '35%',
                visible: true,
                order: 1,
                sortable: true,
                searchable: true,
                labelKey: `${baseKey}.list.columns.connection`,
                mapToValue: (_row, raw) => (raw == null ? '' : String(raw)),
                render: (row) => <ConnectionCell row={row as SupportFile} />,
            },
        },
        {
            name: 'supportFile',
            type: 'string',
            ui: { component: 'input' },
            table: {
                visible: true,
                order: 2,
                labelKey: `${baseKey}.list.columns.filePath`,
            },
        },
        {
            name: 'timestamp',
            type: 'other',
            ui: { component: 'input' },
            table: {
                width: '15%',
                visible: true,
                order: 3,
                sortable: true,
                align: 'center',
                labelKey: `${baseKey}.list.columns.timestamp`,
                mapToValue: (row) => extractTimestampValue((row as SupportFile).supportFile),
                render: (row) => extractTimestamp((row as SupportFile).supportFile) || '-',
            },
        },
        {
            name: 'status',
            type: 'other',
            ui: { component: 'input' },
            table: {
                visible: true,
                order: 4,
                width: 32,
                labelKey: `${baseKey}.list.columns.status`,
                mapToValue: () => null,
                render: (row) => <StatusCell row={row as SupportFile} />,
            },
        },
    ],

    sections: [],

    wizard: {
        steps: [],
    },
}
