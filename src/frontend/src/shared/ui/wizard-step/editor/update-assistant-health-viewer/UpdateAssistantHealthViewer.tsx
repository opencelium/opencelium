import React, { useEffect, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { useReactTable, getCoreRowModel, type ColumnDef } from '@tanstack/react-table'
import { useGetSystemHealthQuery } from '@entities/updateAssistant/api/updateAssistantApi'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { HealthStatus } from '@entities/updateAssistant/model/types'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { Table } from '@shared/ui/primitives/Table'
import { tableDefaultColumn } from '@shared/ui/primitives/Table/Table.utils'
import ErrorMessage from "@shared/ui/primitives/ErrorMessage/ErrorMessage.tsx";
import HintMessage from "@shared/ui/wizard-step/editor/update-assistant-health-viewer/HintMessage.tsx";

export const REQUIRED_COMPONENTS = ['mariaDB', 'mongoDB', 'opencelium', 'os'] as const
export const OPTIONAL_COMPONENTS = ['email', 'polyglot'] as const

type ComponentKey = (typeof REQUIRED_COMPONENTS)[number] | (typeof OPTIONAL_COMPONENTS)[number]

type HealthRow = { key: ComponentKey; status: HealthStatus }

const STATUS_DOT: Record<HealthStatus, string> = {
    UP: 'var(--color-status-success-fg)',
    DOWN: 'var(--color-status-error-fg)',
    UNKNOWN: 'var(--color-status-warning-fg)',
}

type Props = { name: string; label?: string }

export function UpdateAssistantHealthViewer({ name }: Props) {
    const { t } = useI18n('entities')
    const { data, isLoading, isError } = useGetSystemHealthQuery()
    const { setValue } = useFormContext()

    useEffect(() => {
        if (data) {
            setValue(name, data, { shouldValidate: true })
        }
    }, [data, name, setValue])

    const requiredRows = useMemo<HealthRow[]>(
        () =>
            REQUIRED_COMPONENTS.map((k) => ({
                key: k,
                status: data?.components[k]?.status ?? 'UNKNOWN',

            })),
        [data],
    )

    const optionalRows = useMemo<HealthRow[]>(
        () =>
            OPTIONAL_COMPONENTS.map((k) => ({
                key: k,
                status: data?.components[k]?.status ?? 'UNKNOWN',
            })),
        [data],
    )

    const columns = useMemo<ColumnDef<HealthRow>[]>(
        () => [
            {
                accessorKey: 'key',
                enableSorting: false,
                meta: { width: '50%' },
                header: () => t('update-assistant.health.columns.component' as any),
                cell: ({ row }) =>
                    t(`update-assistant.health.components.${row.original.key}` as any, {
                        defaultValue: row.original.key,
                    }),
            },
            {
                accessorKey: 'status',
                enableSorting: false,
                meta: { width: '50%' },
                header: () => t('update-assistant.health.columns.status' as any),
                cell: ({ row }) => {
                    const status = row.original.status
                    return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: STATUS_DOT[status],
                                    display: 'inline-block',
                                    flexShrink: 0,
                                }}
                            />
                            {t(`update-assistant.health.status.${status}` as any)}
                        </span>
                    )
                },
            },
        ],
        [t],
    )

    const requiredTable = useReactTable({
        data: requiredRows,
        columns,
        defaultColumn: tableDefaultColumn,
        enableRowSelection: false,
        getCoreRowModel: getCoreRowModel(),
    })

    const optionalTable = useReactTable({
        data: optionalRows,
        columns,
        defaultColumn: tableDefaultColumn,
        enableRowSelection: false,
        getCoreRowModel: getCoreRowModel(),
    })

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 150 }}>
                <Loading />
            </div>
        )
    }

    if (isError || !data) {
        return <div style={{ color: STATUS_DOT.DOWN }}>—</div>
    }

    const allRequiredUp = REQUIRED_COMPONENTS.every(
        (k) => data.components[k]?.status === 'UP',
    )

    const renderGroup = (
        rows: HealthRow[],
        tableInstance: typeof requiredTable,
        groupLabelKey: string,
    ) => (
        <div>
            <p style={{ fontWeight: 600, marginBottom: 6, fontSize: 13, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t(groupLabelKey as any)}
            </p>
            <Table data={rows} columns={columns} tableInstance={tableInstance} />
        </div>
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {renderGroup(requiredRows, requiredTable, 'update-assistant.health.groups.required')}
            {renderGroup(optionalRows, optionalTable, 'update-assistant.health.groups.optional')}
            <HintMessage/>

            {!allRequiredUp && (
                <ErrorMessage message={t('update-assistant.validation.requiredComponentsDown' as any)}/>
            )}
        </div>
    )
}
