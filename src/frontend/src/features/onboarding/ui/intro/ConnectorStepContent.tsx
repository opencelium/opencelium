import { useMemo } from 'react'
import { getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { Empty } from '@shared/ui/primitives/Empty'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { Table } from '@shared/ui/primitives/Table'
import { TruncatedTextCell } from '@shared/table/TruncatedTextCell'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import '../onboardingIntro.css'

export type ConnectorStepInvoker = {
    name: string
    description: string
    methodCount: number
    /** Connectors already built from this invoker. */
    connectorCount: number
}

type ConnectorStepProps = {
    invokers: ConnectorStepInvoker[]
    onCreateConnectorFor: (invokerName: string) => void
}

/**
 * Every connector is built from an invoker — the form's invoker field is required —
 * so picking one here is the only route the step needs, first connector or fifth.
 * Each row deep-links to the real wizard with its invoker already selected; the
 * wizard owns validation, the credential test and the master-password flow. The
 * tour pauses on the way out and resumes on this same step, so another connector
 * is one more click.
 */
export function ConnectorStepContent({ invokers, onCreateConnectorFor }: ConnectorStepProps) {
    const { t } = useI18n('onboarding')

    const columns = useMemo<ColumnDef<ConnectorStepInvoker>[]>(() => [
        {
            accessorKey: 'name',
            header: () => t('content.connector.tableTitle'),
            meta: { width: '28%' },
            cell: ({ row }) => <strong>{row.original.name}</strong>,
        },
        {
            accessorKey: 'description',
            header: () => t('content.connector.tableDescription'),
            enableSorting: false,
            meta: { fillTrailingSpace: true },
            cell: ({ row }) => <TruncatedTextCell value={row.original.description} />,
        },
        {
            accessorKey: 'connectorCount',
            header: () => t('content.connector.tableConnectors'),
            size: 120,
            meta: { align: 'center', resizable: false },
        },
        {
            id: 'create',
            // No header: the icon's tooltip names the action, and a wide label here
            // could not shrink inside the column (the adapter renders headers with
            // `white-space: pre`), which is what forced a horizontal scrollbar.
            header: () => null,
            enableSorting: false,
            size: 64,
            meta: { align: 'right', resizable: false },
            cell: ({ row }) => (
                <Tooltip content={t('content.connector.tableActionTooltip', { name: row.original.name })}>
                    <IconButton
                        type="text"
                        iconProps={{ name: 'plus', color: 'primary' }}
                        onClick={() => onCreateConnectorFor(row.original.name)}
                        testId={`onboarding-connector-invoker-${row.original.name.toLowerCase()}`}
                    />
                </Tooltip>
            ),
        },
    ], [onCreateConnectorFor, t])

    const tableInstance = useReactTable({
        data: invokers,
        columns,
        // Without this both adapters prepend their own selection checkbox column.
        enableRowSelection: false,
        getRowId: row => row.name,
        getCoreRowModel: getCoreRowModel(),
        // The adapter renders a sorter for any column tanstack reports as sortable,
        // so without this the title's sorter appeared but did nothing.
        getSortedRowModel: getSortedRowModel(),
    })

    return (
        <div>
            <p>{t('content.connector.body')}</p>
            <h3 className="onboarding-connector-pick">{t('content.connector.pickInvoker')}</h3>
            <div className="onboarding-connector-table">
                <Table
                    data={invokers}
                    columns={columns}
                    tableInstance={tableInstance}
                    emptyState={<Empty description={t('content.connector.noInvokers')} />}
                />
            </div>
        </div>
    )
}
