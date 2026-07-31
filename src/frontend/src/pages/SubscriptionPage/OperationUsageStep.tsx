import React, { useMemo, useState } from 'react'
import {
    type ColumnDef,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { Table } from '@shared/ui/primitives/Table'
import { tableDefaultColumn } from '@shared/ui/primitives/Table/Table.utils'
import { Typography } from '@shared/ui/primitives/Typography'
import { Hint } from '@shared/ui/primitives/Hint'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import {
    useGetActiveSubscriptionQuery,
    useGetOperationUsageQuery,
} from '@entities/subscription/api/subscriptionApi'
import type { OperationUsageRow } from '@entities/subscription/model/types'
import { formatNumber } from '@pages/SubscriptionPage/formatters'
import {Loading} from "@shared/ui/primitives/Loading/Loading.tsx";

type Props = {
    onSelectOperation: (id: number) => void
}

export const OperationUsageStep: React.FC<Props> = ({ onSelectOperation }) => {
    const { t, lang } = useI18n('entities')
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 })

    const { data: subscription } = useGetActiveSubscriptionQuery()
    const period = subscription?.monthPeriod
    const { data, isLoading } = useGetOperationUsageQuery(
        period
            ? {
                  page: pagination.pageIndex,
                  size: pagination.pageSize,
                  startDate: period.startDate,
                  endDate: period.endDate,
              }
            : (undefined as never),
        { skip: !period },
    )

    const rows = data?.content ?? []
    const totalRows = data?.totalItems ?? 0

    const columns = useMemo<ColumnDef<OperationUsageRow, unknown>[]>(
        () => [
            {
                accessorKey: 'connectionTitle',
                header: () => t('subscription.columns.connection' as never),
                cell: ({ row }) => (
                    <Typography>{row.original.connectionTitle}</Typography>
                ),
            },
            {
                accessorKey: 'totalUsage',
                header: () => t('subscription.columns.apiOperations' as never),
                meta: { align: 'right' as const },
                cell: ({ row }) => (
                    <Typography>
                        {formatNumber(row.original.totalUsage, lang)}
                    </Typography>
                ),
            },
        ],
        [t, lang],
    )

    const tableInstance = useReactTable({
        data: rows,
        columns,
        defaultColumn: tableDefaultColumn,
        enableRowSelection: false,
        manualPagination: true,
        pageCount: data?.totalPages ?? 1,
        state: { pagination },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row) => String(row.id),
    })

    if (!period)
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: 300,
                }}
            >
                <Loading />
            </div>
        )

    return (
        <div>
            <Table
                data={rows}
                columns={columns}
                tableInstance={tableInstance}
                isLoading={isLoading}
                serverTotal={totalRows}
                onRowClick={(row) => onSelectOperation(row.id)}
                emptyState={
                    <Typography>{t('subscription.empty.operations' as never)}</Typography>
                }
            />
            <div style={{ marginTop: 12 }}>
                <Hint>
                    {t('subscription.steps.operationUsage.rowHint' as never)}
                </Hint>
            </div>
        </div>
    )
}
