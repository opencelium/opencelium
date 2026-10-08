import type { ColumnDef } from '@tanstack/react-table'
import type { UpdateVersion, UpdateVersionStatus } from '@entities/updateAssistant/model/types'
import { Button } from '@shared/ui/primitives/Button'
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton'
import { Radio } from '@shared/ui/primitives/Radio'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import {
    ACTION_COLUMN_WIDTH,
    SELECT_COLUMN_WIDTH,
    STATUS_COLOR,
    equalColumnWidth,
} from './updateAssistantVersions.utils'

type Args = {
    name: string
    isOffline: boolean
    selectedVersion: string | null
    onSelect: (version: string) => void
    deletingVersion: string | null
    onDelete: (version: string) => void
    onOpenChangelog: (version: string, changelogLink: string) => void
    deleteTooltip: string
    t: (key: string, values?: Record<string, unknown>) => string
}

export function getUpdateAssistantVersionColumns({
    name, isOffline, selectedVersion, onSelect, deletingVersion, onDelete,
    onOpenChangelog, deleteTooltip, t,
}: Args): ColumnDef<UpdateVersion>[] {
    const width = equalColumnWidth(isOffline)

    return [
        {
            id: 'select',
            header: () => null,
            size: SELECT_COLUMN_WIDTH,
            meta: { align: 'center' },
            cell: ({ row }) => {
                const v = row.original
                return (
                    <Radio
                        name={`${name}-select`}
                        value={v.name}
                        disabled={v.status !== 'available'}
                        checked={selectedVersion === v.name}
                        onChange={(checked) => {
                            if (checked) onSelect(v.name)
                        }}
                    />
                )
            },
        },
        {
            accessorKey: 'name',
            enableSorting: false,
            meta: { width },
            header: () => t('update-assistant.versions.columns.name'),
        },
        {
            accessorKey: 'status',
            header: () => t('update-assistant.versions.columns.status'),
            enableSorting: false,
            meta: { width },
            cell: ({ getValue }) => {
                const status = getValue<UpdateVersionStatus>()
                return (
                    <span style={{ color: STATUS_COLOR[status] }}>
                        {t(`update-assistant.versions.status.${status}`)}
                    </span>
                )
            },
        },
        {
            accessorKey: 'changelogLink',
            header: () => t('update-assistant.versions.columns.changelog'),
            enableSorting: false,
            meta: { width },
            cell: ({ row }) => {
                const link = row.original.changelogLink
                return link ? (
                    <Button type="link" onClick={() => onOpenChangelog(row.original.name, link)}>
                        {t('update-assistant.versions.columns.changelog')}
                    </Button>
                ) : '—'
            },
        },
        ...(isOffline
            ? [{
                id: 'action',
                header: () => null,
                size: ACTION_COLUMN_WIDTH,
                meta: { align: 'center', resizable: false },
                cell: ({ row }) => {
                    const isRowDeleting = deletingVersion === row.original.name
                    return (
                        <Tooltip content={deleteTooltip}>
                            <DeleteIconButton
                                iconSize={15}
                                onClick={() => onDelete(row.original.name)}
                                loading={isRowDeleting}
                                disabled={deletingVersion !== null && !isRowDeleting}
                            />
                        </Tooltip>
                    )
                },
            } as ColumnDef<UpdateVersion>]
            : []),
    ]
}
