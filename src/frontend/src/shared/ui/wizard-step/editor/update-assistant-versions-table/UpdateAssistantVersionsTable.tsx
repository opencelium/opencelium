import React, { useCallback, useMemo, useState } from 'react'
import { useFormContext, useFormState } from 'react-hook-form'
import { useReactTable, getCoreRowModel, type ColumnDef } from '@tanstack/react-table'
import { message } from 'antd'
import {
    useGetOnlineVersionsQuery,
    useGetOfflineVersionsQuery,
    useDeleteOfflineVersionMutation,
} from '@entities/updateAssistant/api/updateAssistantApi'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { UpdateMode, UpdateVersion, UpdateVersionStatus } from '@entities/updateAssistant/model/types'
import { OfflinePackageUploader } from './OfflinePackageUploader'
import { EntityText } from '@shared/ui/primitives/Text'
import { Table } from '@shared/ui/primitives/Table'
import { tableDefaultColumn } from '@shared/ui/primitives/Table/Table.utils'
import { Button } from '@shared/ui/primitives/Button'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Radio } from '@shared/ui/primitives/Radio'
import { useDialog } from '@shared/ui/dialog/useDialog'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { ChangelogDialogContent } from './ChangelogDialogContent'
import ErrorMessage from '@shared/ui/primitives/ErrorMessage/ErrorMessage'

const STATUS_COLOR: Record<UpdateVersionStatus, string> = {
    old: 'var(--color-text-secondary)',
    current: 'var(--color-text-primary)',
    available: 'var(--color-status-success-fg)',
}

function parseSemver(v: string): number[] {
    return v.split('.').map((p) => parseInt(p, 10) || 0)
}

function sortVersionsDesc(versions: UpdateVersion[]): UpdateVersion[] {
    return [...versions].sort((a, b) => {
        const av = parseSemver(a.name)
        const bv = parseSemver(b.name)
        for (let i = 0; i < Math.max(av.length, bv.length); i++) {
            const diff = (bv[i] ?? 0) - (av[i] ?? 0)
            if (diff !== 0) return diff
        }
        return 0
    })
}

type Props = {
    name: string
    label?: string
    mode: 'create' | 'update' | 'view'
}

export function UpdateAssistantVersionsTable({ name, label }: Props) {
    const { t } = useI18n('entities')
    const dialog = useDialog()
    const confirm = useConfirm()
    const { watch, setValue, control } = useFormContext()
    const { errors } = useFormState({ control, name })

    const watchedValue = watch(name)
    const selectedVersion = typeof watchedValue === 'string' ? watchedValue : null
    const setSelectedVersion = useCallback(
        (version: string | null) => {
            setValue(name, version, { shouldValidate: true, shouldDirty: true })
        },
        [name, setValue],
    )

    const updateMode: UpdateMode = watch('updateMode') ?? 'online'
    const isOffline = updateMode === 'offline'

    const onlineResult = useGetOnlineVersionsQuery(undefined, { skip: isOffline })
    const offlineResult = useGetOfflineVersionsQuery(undefined, { skip: !isOffline })
    const [deleteVersion] = useDeleteOfflineVersionMutation()
    const [deletingVersion, setDeletingVersion] = useState<string | null>(null)

    const result = isOffline ? offlineResult : onlineResult
    const versions = useMemo(
        () => sortVersionsDesc(result.data ?? []),
        [result.data],
    )

    const handleDelete = useCallback(
        async (version: string) => {
            const ok = await confirm({
                title: t('update-assistant.versions.actions.deleteConfirm.title', { version }),
                message: t('update-assistant.versions.actions.deleteConfirm.message', { version }),
                confirmText: t('update-assistant.versions.actions.deleteConfirm.confirm'),
                cancelText: t('update-assistant.versions.actions.deleteConfirm.cancel'),
            })
            if (!ok) return
            if (selectedVersion === version) setSelectedVersion(null)
            setDeletingVersion(version)
            try {
                await deleteVersion(version).unwrap()
                message.success(t('update-assistant.versions.actions.deleteSuccess', { version }))
            } catch {
                // error surfaced via the global error bus
            } finally {
                setDeletingVersion(null)
            }
        },
        [confirm, t, selectedVersion, setSelectedVersion, deleteVersion],
    )

    // "select" and "action" only ever hold a single control (a radio / an icon
    // button), so they're pinned to a minimal fixed width, leaving the rest of
    // the table's width to split evenly across name/status/changelog.
    const SELECT_COLUMN_WIDTH = 48
    const ACTION_COLUMN_WIDTH = 48
    const equalColumnWidth = `calc((100% - ${SELECT_COLUMN_WIDTH + (isOffline ? ACTION_COLUMN_WIDTH : 0)}px) / 3)`

    const columns = useMemo<ColumnDef<UpdateVersion>[]>(
        () => [
            {
                id: 'select',
                header: () => null,
                size: SELECT_COLUMN_WIDTH,
                meta: { align: 'center' },
                cell: ({ row }) => {
                    const v = row.original
                    const selectable = v.status === 'available'
                    return (
                        <Radio
                            name={`${name}-select`}
                            value={v.name}
                            disabled={!selectable}
                            checked={selectedVersion === v.name}
                            onChange={(checked) => {
                                if (checked) setSelectedVersion(v.name)
                            }}
                        />
                    )
                },
            },
            {
                accessorKey: 'name',
                enableSorting: false,
                meta: { width: equalColumnWidth },
                header: () => t('update-assistant.versions.columns.name'),
            },
            {
                accessorKey: 'status',
                header: () => t('update-assistant.versions.columns.status'),
                enableSorting: false,
                meta: { width: equalColumnWidth },
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
                meta: { width: equalColumnWidth },
                cell: ({ row }) => {
                    const link = row.original.changelogLink
                    const version = row.original.name
                    return link ? (
                        <Button
                            type="link"
                            onClick={() =>
                                dialog.open({
                                    title: t('update-assistant.changelog.title', { version }),
                                    content: <ChangelogDialogContent changelogLink={link} />,
                                    footer: (
                                        <Button onClick={() => dialog.close()}>
                                            {t('update-assistant.changelog.close')}
                                        </Button>
                                    ),
                                    width: 700,
                                })
                            }
                        >
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
                    meta: { align: 'center' },
                    cell: ({ row }) => {
                        const isRowDeleting = deletingVersion === row.original.name
                        return (
                            <IconButton
                                type="text"
                                size={'sm'}
                                iconProps={{ name: 'delete' }}
                                onClick={() => handleDelete(row.original.name)}
                                loading={isRowDeleting}
                                disabled={deletingVersion !== null && !isRowDeleting}
                            />
                        )
                    },
                } as ColumnDef<UpdateVersion>]
                : []),
        ],
        [t, name, selectedVersion, dialog, isOffline, handleDelete, deletingVersion, equalColumnWidth],
    )

    const tableInstance = useReactTable({
        data: versions,
        columns,
        defaultColumn: tableDefaultColumn,
        enableRowSelection: false,
        getCoreRowModel: getCoreRowModel(),
    })

    const hasValidationError = Boolean(errors[name])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {label && (
                <label className="form-control__label">
                    <span style={{ position: 'relative' }}>
                        <EntityText typoProps={{ isBold: true }} i18nKey={label} />
                    </span>
                </label>
            )}

            <Table
                data={versions}
                columns={columns}
                tableInstance={tableInstance}
                isLoading={result.isLoading}
                emptyState={
                    <div style={{ color: 'var(--color-text-secondary)' }}>{t('update-assistant.versions.empty')}</div>
                }
            />

            {!result.isLoading && isOffline && <OfflinePackageUploader />}

            {hasValidationError && (
                <ErrorMessage
                    message={t('update-assistant.validation.versionNotSelected' as any)}
                />
            )}
        </div>
    )
}
