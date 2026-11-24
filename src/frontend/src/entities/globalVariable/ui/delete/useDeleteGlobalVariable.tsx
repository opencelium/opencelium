import { useCallback } from 'react'
import { message } from 'antd'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useDeleteGlobalVariableMutation, usePreviewGlobalVariableImpactMutation } from '../../api/globalVariableApi'
import { readConflict, readErrorMessage } from '../../model/errors'
import type { ImpactEntry } from '../../model/types'
import { ImpactList } from '../impact/ImpactList'

type Target = { id: number; name: string }

export function useDeleteGlobalVariable() {
    const confirm = useConfirm()
    const { t } = useI18n('entities')
    const { t: tSuccess } = useI18n('success')
    const [previewImpact, { isLoading: isPreviewing }] = usePreviewGlobalVariableImpactMutation()
    const [deleteVariable, { isLoading: isDeleting }] = useDeleteGlobalVariableMutation()

    const showBlocked = useCallback(
        (name: string, entries: ImpactEntry[]) =>
            confirm({
                title: t('global-variable.delete.blocked.title', { name }),
                message: (
                    <>
                        <p>{t('global-variable.delete.blocked.message')}</p>
                        <ImpactList entries={entries} />
                    </>
                ),
                confirmText: t('global-variable.delete.blocked.close'),
                canCancel: false,
                width: 560,
            }),
        [confirm, t],
    )

    const run = useCallback(
        async ({ id, name }: Target): Promise<boolean> => {
            const impact = await previewImpact({ id, body: { delete: true } })
            if ('error' in impact) return false
            if (impact.data.blocking.length > 0) {
                await showBlocked(name, impact.data.blocking)
                return false
            }
            const isConfirmed = await confirm({
                title: t('global-variable.delete.confirm.title', { name }),
                message: impact.data.warnings.length > 0
                    ? (
                        <>
                            <p>{t('global-variable.delete.confirm.messageWithWarnings')}</p>
                            <ImpactList entries={impact.data.warnings} />
                        </>
                    )
                    : t('global-variable.delete.confirm.message', { name }),
            })
            if (!isConfirmed) return false

            const result = await deleteVariable(id)
            if ('error' in result) {
                const conflict = readConflict(result.error)
                if (conflict?.code === 'IN_USE') await showBlocked(name, conflict.blocking)
                else notifyError(readErrorMessage(result.error) ?? t('global-variable.delete.failed'))
                return false
            }
            message.success(tSuccess('api.deleted'))
            return true
        },
        [confirm, deleteVariable, previewImpact, showBlocked, t, tSuccess],
    )

    return { deleteGlobalVariable: run, isDeleting: isPreviewing || isDeleting }
}
