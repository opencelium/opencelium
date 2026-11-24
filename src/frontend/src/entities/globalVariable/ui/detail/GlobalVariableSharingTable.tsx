import React, { useMemo } from 'react'
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { Table } from '@shared/ui/primitives/Table'
import { Checkbox } from '@shared/ui/primitives/Checkbox'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { GRANTABLE, type GrantDraft } from '../../model/sharing'
import type { VariablePermission } from '../../model/types'

type Props = {
    drafts: GrantDraft[]
    onToggle: (userId: number, permission: VariablePermission, isOn: boolean) => void
    onRemove: (userId: number) => void
}

export const GlobalVariableSharingTable: React.FC<Props> = ({ drafts, onToggle, onRemove }) => {
    const { t } = useI18n('entities')

    const columns = useMemo<ColumnDef<GrantDraft>[]>(() => [
        { id: 'user', header: () => t('global-variable.sharing.user'), cell: ({ row }) => row.original.name },
        ...GRANTABLE.map((permission): ColumnDef<GrantDraft> => ({
            id: permission,
            header: () => t(`global-variable.permission.${permission}`),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.original.permissions.includes(permission)}
                    onChange={(isOn: boolean) => onToggle(row.original.userId, permission, isOn)}
                    testId={`global-variable-sharing-${row.original.userId}-${permission.toLowerCase()}`}
                />
            ),
        })),
        {
            id: 'remove',
            header: () => null,
            cell: ({ row }) => (
                <Tooltip content={t('global-variable.sharing.remove')} placement="top">
                    <DeleteIconButton
                        onClick={() => onRemove(row.original.userId)}
                        testId={`global-variable-sharing-remove-${row.original.userId}`}
                    />
                </Tooltip>
            ),
        },
    ], [t, onToggle, onRemove])

    const tableInstance = useReactTable({
        data: drafts,
        columns,
        getRowId: (draft) => String(draft.userId),
        enableRowSelection: false,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <Table
            data={drafts}
            columns={columns}
            tableInstance={tableInstance}
            emptyState={<span>{t('global-variable.sharing.empty')}</span>}
        />
    )
}
