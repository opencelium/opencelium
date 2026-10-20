import { useCallback, useMemo, useState } from 'react'
import { useFormContext, useFormState } from 'react-hook-form'
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'
import { message } from 'antd'
import {
    useGetOnlineVersionsQuery,
    useGetOfflineVersionsQuery,
    useDeleteOfflineVersionMutation,
} from '@entities/updateAssistant/api/updateAssistantApi'
import { useOnlineStatus } from '@shared/network/useOnlineStatus'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { UpdateMode } from '@entities/updateAssistant/model/types'
import { OfflinePackagePanel } from './OfflinePackagePanel'
import { VersionsCard } from './VersionsCard'
import { VersionSelectionStatus } from './VersionSelectionStatus'
import { OnlineUpdatesUnavailable } from './OnlineUpdatesUnavailable'
import { useSelectUpdateMode } from './useSelectUpdateMode'
import { getUpdateAssistantVersionColumns } from './getUpdateAssistantVersionColumns'
import { sortVersionsDesc } from './updateAssistantVersions.utils'
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

export function UpdateAssistantVersionsTable({ name }: Props) {
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

    const isOnline = useOnlineStatus()

    const onlineResult = useGetOnlineVersionsQuery(undefined, { skip: !isOnline || isOffline })
    const offlineResult = useGetOfflineVersionsQuery(undefined, { skip: !isOffline })
    const [deleteVersion] = useDeleteOfflineVersionMutation()
    const [deletingVersion, setDeletingVersion] = useState<string | null>(null)

    const result = isOffline ? offlineResult : onlineResult
    // With online services disabled the backend answers 200 with a ResultDTO, not a list.
    const versions = useMemo(
        () => sortVersionsDesc(Array.isArray(result.data) ? result.data : []),
        [result.data],
    )

    const selectMode = useSelectUpdateMode()
    const switchToOffline = useCallback(() => selectMode('offline'), [selectMode])

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

    const isOnlineBlocked = !isOnline && !isOffline

    const table = (
        <Table
            data={versions}
            columns={columns}
            tableInstance={tableInstance}
            isLoading={result.isLoading}
            emptyState={
                <div style={{ color: 'var(--color-text-secondary)' }}>
                    {t('update-assistant.versions.empty')}
                </div>
            }
        />
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isOffline && (
                <OfflinePackagePanel
                    uploadedPackages={versions.length > 0 && (
                        <VersionsCard
                            title={t('update-assistant.availableUpdates.offline.packages.title')}
                            count={versions.length}
                            testId="update-assistant-uploaded-packages"
                        >
                            {table}
                        </VersionsCard>
                    )}
                />
            )}

            {isOnlineBlocked && (
                <OnlineUpdatesUnavailable reason="offline" onSwitchToOffline={switchToOffline} />
            )}

            {!isOffline && !isOnlineBlocked && (
                <VersionsCard
                    title={t('update-assistant.availableUpdates.onlineVersionsTitle')}
                    count={result.isLoading ? undefined : versions.length}
                    testId="update-assistant-online-versions"
                >
                    {table}
                </VersionsCard>
            )}

            {!result.isLoading && (
                <VersionSelectionStatus
                    isOffline={isOffline}
                    hasVersions={versions.length > 0}
                    selectedVersion={selectedVersion}
                />
            )}

            {hasValidationError && (
                <ErrorMessage message={t('update-assistant.validation.versionNotSelected')} />
            )}
        </div>
    )
}
