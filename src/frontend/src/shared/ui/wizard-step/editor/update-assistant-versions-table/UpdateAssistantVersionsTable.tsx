import { useCallback, useMemo, useState } from 'react'
import { useFormContext, useFormState } from 'react-hook-form'
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'
import { message } from 'antd'
import {
    useGetOnlineVersionsQuery,
    useGetOfflineVersionsQuery,
    useDeleteOfflineVersionMutation,
} from '@entities/updateAssistant/api/updateAssistantApi'
import { useOnlineFeature } from '@entities/subscription/model/useOnlineFeature'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { UpdateMode } from '@entities/updateAssistant/model/types'
import { OfflinePackageUploader } from './OfflinePackageUploader'
import { OnlineUpdatesUnavailable } from './OnlineUpdatesUnavailable'
import { getUpdateAssistantVersionColumns } from './getUpdateAssistantVersionColumns'
import { sortVersionsDesc } from './updateAssistantVersions.utils'
import { EntityText } from '@shared/ui/primitives/Text'
import { Table } from '@shared/ui/primitives/Table'
import { tableDefaultColumn } from '@shared/ui/primitives/Table/Table.utils'
import { Button } from '@shared/ui/primitives/Button'
import { useDialog } from '@shared/ui/dialog/useDialog'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { ChangelogDialogContent } from './ChangelogDialogContent'
import ErrorMessage from '@shared/ui/primitives/ErrorMessage/ErrorMessage'

type Props = {
    name: string
    label?: string
    mode: 'create' | 'update' | 'view'
}

export function UpdateAssistantVersionsTable({ name, label }: Props) {
    const { t } = useI18n('entities')
    const { t: tCommon } = useI18n('common')
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

    // Online versions come from the OC update server, so the step is only offered
    // while the browser has a connection and online services are switched on.
    const onlineAvailability = useOnlineFeature()
    const isOnlineReady = isOffline || onlineAvailability.state === 'available'

    const onlineResult = useGetOnlineVersionsQuery(undefined, { skip: !isOnlineReady || isOffline })
    const offlineResult = useGetOfflineVersionsQuery(undefined, { skip: !isOffline })
    const [deleteVersion] = useDeleteOfflineVersionMutation()
    const [deletingVersion, setDeletingVersion] = useState<string | null>(null)

    const result = isOffline ? offlineResult : onlineResult
    const versions = useMemo(() => sortVersionsDesc(result.data ?? []), [result.data])

    const switchToOffline = useCallback(() => {
        setSelectedVersion(null)
        setValue('updateMode', 'offline', { shouldValidate: true, shouldDirty: true })
    }, [setSelectedVersion, setValue])

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

    const openChangelog = useCallback(
        (version: string, changelogLink: string) => {
            dialog.open({
                title: t('update-assistant.changelog.title', { version }),
                content: <ChangelogDialogContent changelogLink={changelogLink} />,
                footer: (
                    <Button onClick={() => dialog.close()}>
                        {t('update-assistant.changelog.close')}
                    </Button>
                ),
                width: 700,
            })
        },
        [dialog, t],
    )

    const columns = useMemo(
        () => getUpdateAssistantVersionColumns({
            name,
            isOffline,
            selectedVersion,
            onSelect: setSelectedVersion,
            deletingVersion,
            onDelete: handleDelete,
            onOpenChangelog: openChangelog,
            deleteTooltip: tCommon('actions.delete'),
            t,
        }),
        [name, isOffline, selectedVersion, setSelectedVersion, deletingVersion,
            handleDelete, openChangelog, tCommon, t],
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

            {onlineAvailability.state === 'unavailable' && !isOffline ? (
                <OnlineUpdatesUnavailable
                    reason={onlineAvailability.reason}
                    onSwitchToOffline={switchToOffline}
                />
            ) : (
                <Table
                    data={versions}
                    columns={columns}
                    tableInstance={tableInstance}
                    isLoading={result.isLoading || !isOnlineReady}
                    emptyState={
                        <div style={{ color: 'var(--color-text-secondary)' }}>
                            {t('update-assistant.versions.empty')}
                        </div>
                    }
                />
            )}

            {!result.isLoading && isOffline && <OfflinePackageUploader />}

            {hasValidationError && (
                <ErrorMessage message={t('update-assistant.validation.versionNotSelected')} />
            )}
        </div>
    )
}
