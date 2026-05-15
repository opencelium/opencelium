import React, { useMemo, useState } from 'react'
import {
    type ColumnDef,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { Table } from '@shared/ui/primitives/Table'
import { Typography } from '@shared/ui/primitives/Typography'
import { Button } from '@shared/ui/primitives/Button'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import {
    useGetActiveSubscriptionQuery,
    useGetOperationUsageDetailsQuery,
    useGetOperationUsageQuery,
} from '@entities/subscription/api/subscriptionApi'
import type { OperationUsageDetailRow } from '@entities/subscription/model/types'
import {
    formatDateTime,
    formatNumber,
} from '@pages/SubscriptionPage/formatters'
import {Loading} from "@shared/ui/primitives/Loading/Loading.tsx";
import { DailyUsageChart } from '@pages/SubscriptionPage/DailyUsageChart'

type Props = {
    operationId: number
    onBack: () => void
}

export const OperationDetailsStep: React.FC<Props> = ({
    operationId,
    onBack,
}) => {
    const { t, lang } = useI18n('entities')
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 })

    const { data: subscription } = useGetActiveSubscriptionQuery()
    const period = subscription?.monthPeriod

    const { data: usageData } = useGetOperationUsageQuery(
        period
            ? {
                  page: 0,
                  size: 100,
                  startDate: period.startDate,
                  endDate: period.endDate,
              }
            : (undefined as never),
        { skip: !period },
    )
    const operation = usageData?.content.find((r) => r.id === operationId)

    const { data, isLoading } = useGetOperationUsageDetailsQuery(
        period
            ? {
                  id: operationId,
                  page: pagination.pageIndex,
                  size: pagination.pageSize,
                  startDate: period.startDate,
                  endDate: period.endDate,
              }
            : (undefined as never),
        { skip: !period },
    )

    const { data: chartData } = useGetOperationUsageDetailsQuery(
        period
            ? {
                  id: operationId,
                  page: 0,
                  size: 1000,
                  startDate: period.startDate,
                  endDate: period.endDate,
              }
            : (undefined as never),
        { skip: !period },
    )

    const rows = data?.content ?? []

    const columns = useMemo<ColumnDef<OperationUsageDetailRow, unknown>[]>(
        () => [
            {
                accessorKey: 'startDate',
                header: () => t('subscription.columns.startDate' as never),
                cell: ({ row }) => (
                    <Typography>{formatDateTime(row.original.startDate, lang)}</Typography>
                ),
            },
            {
                accessorKey: 'operationUsage',
                header: () => t('subscription.columns.apiOperations' as never),
                meta: { align: 'right' as const },
                cell: ({ row }) => (
                    <Typography>
                        {formatNumber(row.original.operationUsage, lang)}
                    </Typography>
                ),
            },
        ],
        [t, lang],
    )

    const tableInstance = useReactTable({
        data: rows,
        columns,
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
            <div style={{ marginBottom: 12 }}>
                <Typography variant="title">
                    {operation?.connectionTitle ?? ''}
                </Typography>
            </div>

            <div style={{ marginBottom: 24 }}>
                <DailyUsageChart
                    data={chartData?.content ?? []}
                    lang={lang}
                    emptyLabel={t('subscription.empty.details' as never)}
                />
            </div>

            <Table
                data={rows}
                columns={columns}
                tableInstance={tableInstance}
                isLoading={isLoading}
                serverTotal={data?.totalItems ?? 0}
                emptyState={
                    <Typography>{t('subscription.empty.details' as never)}</Typography>
                }
            />

            <div
                style={{
                    marginTop: 48,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 12,
                }}
            >
                <Button onClick={onBack}>
                    {t('subscription.actions.back' as never)}
                </Button>
            </div>
        </div>
    )
}
