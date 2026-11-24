import { useCallback, useState } from 'react'
import { message } from 'antd'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useRestoreGlobalVariableChangeMutation } from '../../api/globalVariableApi'
import { readConflict, readErrorMessage } from '../../model/errors'
import type { GlobalVariable, GlobalVariableChange } from '../../model/types'

export function useRestoreChange(variable: GlobalVariable) {
    const confirm = useConfirm()
    const { t } = useI18n('entities')
    const [restoreChange] = useRestoreGlobalVariableChangeMutation()
    const [restoringId, setRestoringId] = useState<number | null>(null)

    const restore = useCallback(
        async (change: GlobalVariableChange) => {
            const isConfirmed = await confirm({
                title: t('global-variable.changes.restoreConfirm.title'),
                // A mutable variable's restore sets its initial value; a reset then makes that the current one.
                message: t(variable.kind === 'MUTABLE'
                    ? 'global-variable.changes.restoreConfirm.messageMutable'
                    : 'global-variable.changes.restoreConfirm.message', { version: change.versionFrom ?? change.versionTo }),
            })
            if (!isConfirmed) return
            setRestoringId(change.id)
            const result = await restoreChange({ id: variable.id, changeId: change.id, version: variable.version })
            setRestoringId(null)
            if ('error' in result) {
                const conflict = readConflict(result.error)
                notifyError(conflict?.message || readErrorMessage(result.error) || t('global-variable.changes.restoreFailed'))
                return
            }
            message.success(t('global-variable.changes.restored'))
        },
        [confirm, restoreChange, t, variable.id, variable.kind, variable.version],
    )

    return { restore, restoringId }
}
