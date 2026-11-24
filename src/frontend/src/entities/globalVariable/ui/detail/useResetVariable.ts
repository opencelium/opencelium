import { useCallback } from 'react'
import { message } from 'antd'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useResetGlobalVariableMutation } from '../../api/globalVariableApi'
import { readConflict, readErrorMessage } from '../../model/errors'
import type { MutableVariable } from '../../model/types'

export function useResetVariable(variable: MutableVariable, onReset: () => void) {
    const confirm = useConfirm()
    const { t } = useI18n('entities')
    const [resetVariable, { isLoading: isResetting }] = useResetGlobalVariableMutation()

    const reset = useCallback(async () => {
        const isConfirmed = await confirm({
            title: t('global-variable.reset.confirm.title'),
            message: t('global-variable.reset.confirm.message', { value: JSON.stringify(variable.value) }),
        })
        if (!isConfirmed) return
        const result = await resetVariable(variable.id)
        if ('error' in result) {
            notifyError(readConflict(result.error)?.message || readErrorMessage(result.error) || t('global-variable.reset.failed'))
            return
        }
        onReset()
        message.success(t('global-variable.reset.done'))
    }, [confirm, onReset, resetVariable, t, variable.id, variable.value])

    return { reset, isResetting }
}
