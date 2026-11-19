import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { Table } from '@shared/ui/primitives/Table'
import { Empty } from '@shared/ui/primitives/Empty'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useGetGlobalVariableUsageQuery } from '../../api/globalVariableApi'
import type { GlobalVariableUsage } from '../../model/types'
import { sourceLink } from '../../model/display'

export const GlobalVariableUsageTable: React.FC<{ id: number }> = ({ id }) => {
    const { t } = useI18n('entities')
    const { data = [], isLoading } = useGetGlobalVariableUsageQuery(id)

    const columns = useMemo<ColumnDef<GlobalVariableUsage>[]>(() => [
        {
            id: 'source',
            header: () => t('global-variable.usage.columns.source'),
            cell: ({ row: { original } }) => {
                const link = sourceLink(original.sourceType, original.sourceId)
                return (
                    <span>
                        {t(`global-variable.usage.sourceType.${original.sourceType}`)}:{' '}
                        {link ? <Link to={link}>{original.sourceTitle}</Link> : original.sourceTitle}
                    </span>
                )
            },
        },
        {
            id: 'element',
            header: () => t('global-variable.usage.columns.element'),
            cell: ({ row: { original } }) => [original.elementLabel, original.field].filter(Boolean).join(' · '),
        },
        {
            id: 'access',
            header: () => t('global-variable.usage.columns.access'),
            cell: ({ row: { original } }) => t(`global-variable.usage.access.${original.access}`),
        },
    ], [t])

    const tableInstance = useReactTable({ data, columns, enableRowSelection: false, getCoreRowModel: getCoreRowModel() })

    return (
        <div data-testid="global-variable-usage">
            <Table
                data={data}
                columns={columns}
                tableInstance={tableInstance}
                isLoading={isLoading}
                emptyState={<Empty description={t('global-variable.usage.empty')} />}
            />
        </div>
    )
}
