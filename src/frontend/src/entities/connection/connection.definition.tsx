import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import en from '@entities/connection/i18n/en.json'
import de from '@entities/connection/i18n/de.json'
import type { Connection } from '@entities/connection/model/types'
import { DownloadAsTemplateAction } from '@entities/connection/ui/DownloadAsTemplateAction'
import { DuplicateConnectionAction } from '@entities/connection/ui/DuplicateConnectionAction'
import { CreateConnectionButton } from '@entities/connection/ui/CreateConnectionButton'
import { CategoryNameCell } from '@entities/connection/ui/CategoryNameCell'
import { CurrentVersionCell } from '@entities/connection/ui/CurrentVersionCell'
import { UserNameCell } from '@entities/user/ui/UserNameCell'
import { userApi } from '@entities/user/api/userApi'
import { getCategoriesFromCache } from '@entities/category/command/categoryCache'
import { store } from '@app/store/store'
import { createEntityCommands } from '@/engine/entity/command/createEntityCommands'
import { resolveConnectionTitles } from '@entities/connection/command/resolvers/resolveConnectionTitles'
import { resolveConnectionIds } from '@entities/connection/command/resolvers/resolveConnectionIds'
import { findConnectionIdByTitle } from '@entities/connection/command/connectionCache'
import type { CommandNode } from '@shared/command/types'
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { resolveWorkflowSearch } from '@features/workflow/command/workflowCommandResolvers'
import { i18n } from '@shared/i18n/config/i18n'
import type { ConnectionVersionResource } from '@features/workflow/types/history.types'
import { TruncatedTextCell } from '@shared/table/TruncatedTextCell'

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
            {
                type: 'delete',
                confirmMessage: (_value, _entity, row) => {
                    const t = i18n.getFixedT(i18n.language, 'entities')
                    return t(`${baseKey}.list.confirmDelete.message`, { title: (row as Connection).title })
                },
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
                width: '35%',
                visible: true,
                order: 1,
                sortable: true,
                searchable: true,
                labelKey: `${baseKey}.list.columns.title`,
                // Override the list's default single-line/ellipsis cell behavior —
                // title wraps across multiple lines instead of truncating.
                render: (_row, value) => (
                    <div style={{ whiteSpace: 'normal' }}>{typeof value === 'string' ? value : ''}</div>
                ),
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
                render: (_row, value) => <TruncatedTextCell value={value} />,
            },
        },
        {
            name: 'categoryId',
            type: 'number',
            ui: { component: 'input' },
            table: {
                width: 140,
                visible: true,
                order: 4,
                searchable: true,
                labelKey: `${baseKey}.list.columns.category`,
                // Search matches the rendered category name, not the raw id — resolve it
                // from the categories cache while leaving the cell's own value (the id)
                // untouched for CategoryNameCell to render.
                mapToValue: (_row, raw) => {
                    const categoryId = typeof raw === 'number' ? raw : null
                    if (categoryId == null) return ''
                    return getCategoriesFromCache().find((c) => c.id === categoryId)?.name ?? ''
                },
                render: (row) => <CategoryNameCell categoryId={(row as Connection).categoryId ?? null} />,
            },
        },
        {
            // Read-only audit columns set by the backend on save — not part of any
            // section/wizard step, only surfaced as list columns.
            name: 'modifiedAt',
            type: 'number',
            ui: { component: 'input' },
            table: {
                width: 160,
                visible: true,
                order: 5,
                sortable: true,
                searchable: true,
                labelKey: `${baseKey}.list.columns.modifiedAt`,
                mapToValue: (_row, raw) =>
                    typeof raw === 'number' ? new Date(raw).toLocaleString(i18n.language) : '',
                render: (row) => {
                    const modifiedAt = (row as Connection).modifiedAt
                    return typeof modifiedAt === 'number'
                        ? <span>{new Date(modifiedAt).toLocaleString(i18n.language)}</span>
                        : null
                },
            },
        },
        {
            name: 'modifiedBy',
            type: 'number',
            ui: { component: 'input' },
            table: {
                width: 160,
                visible: true,
                order: 6,
                searchable: true,
                labelKey: `${baseKey}.list.columns.modifiedBy`,
                // Search matches the rendered "name surname", not the raw user id.
                mapToValue: (_row, raw) => {
                    const userId = typeof raw === 'number' ? raw : null
                    if (userId == null) return ''
                    const users = userApi.endpoints.getUsers.select({ page: 1, limit: 1000 })(store.getState()).data ?? []
                    const user = users.find((u) => u.userId === userId)
                    return user ? `${user.userDetail.name} ${user.userDetail.surname}` : ''
                },
                render: (row) => <UserNameCell userId={(row as Connection).modifiedBy ?? null} />,
            },
        },
        {
            name: 'lastVersion',
            type: 'other',
            ui: { component: 'input' },
            table: {
                width: 260,
                visible: true,
                order: 3,
                searchable: true,
                labelKey: `${baseKey}.list.columns.currentVersion`,
                mapToValue: (_row, raw) => (raw as ConnectionVersionResource | null)?.comment ?? '',
                render: (row) => (
                    <CurrentVersionCell lastVersion={(row as Connection).lastVersion ?? null} />
                ),
            },
        },
    ],

    sections: [],

    wizard: {
        steps: [],
    },

    commands: (def) => [
        // A new, standalone top-level "workflow" command — distinct from the
        // "update workflow by id/title" command generated below (that one
        // nests "workflow" as a child of the shared "update" literal). Only
        // present while a workflow editor instance is mounted (see
        // workflowCommandBridgeStore) — it never appears in the app-wide
        // palette, since /workflow/* routes never render that instance.
        ...(workflowCommandBridgeStore.getState().isActive ? [{
            type: 'literal',
            value: 'workflow',
            icon: 'workflow',
            group: 'workflow',
            lockAsChip: true,
            description: 'commandPalette.descriptions.workflow',
            children: [
                {
                    type: 'literal',
                    value: 'search',
                    children: [
                        { type: 'entity', name: 'term', resolve: resolveWorkflowSearch },
                    ],
                },
            ],
        } as CommandNode<any>] : []),
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
