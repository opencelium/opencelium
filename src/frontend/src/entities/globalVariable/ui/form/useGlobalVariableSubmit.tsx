import { useCallback } from 'react'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import {
    useCreateGlobalVariableMutation,
    usePreviewGlobalVariableImpactMutation,
    useUpdateGlobalVariableMutation,
} from '../../api/globalVariableApi'
import { readConflict, readErrorMessage, readViolations } from '../../model/errors'
import { toSaveDto, type GlobalVariableFormValues } from '../../model/form'
import type { GlobalVariable, ImpactEntry } from '../../model/types'
import { ImpactList } from '../impact/ImpactList'

type Args =
    | { mode: 'create' }
    | { mode: 'update'; id: number; reload: () => void }

// The wizard treats a thrown submit as "not saved" and stays on the form.
const abortSave = (reason: string): never => {
    throw new Error(`global variable not saved: ${reason}`)
}

export function useGlobalVariableSubmit(args: Args) {
    const confirm = useConfirm()
    const { t } = useI18n('entities')
    const [previewImpact] = usePreviewGlobalVariableImpactMutation()
    const [createVariable] = useCreateGlobalVariableMutation()
    const [updateVariable] = useUpdateGlobalVariableMutation()

    const showImpact = useCallback(
        (titleKey: string, entries: ImpactEntry[], isProceedAllowed: boolean) =>
            confirm({
                title: t(titleKey),
                message: <ImpactList entries={entries} />,
                confirmText: t(isProceedAllowed ? 'global-variable.save.saveAnyway' : 'global-variable.save.close'),
                canCancel: isProceedAllowed,
                width: 560,
            }),
        [confirm, t],
    )

    const handleSaveError = useCallback(
        async (error: unknown) => {
            const conflict = readConflict(error)
            if (conflict?.code === 'VERSION_CONFLICT') {
                const isReload = await confirm({
                    title: t('global-variable.save.versionConflict.title'),
                    message: t('global-variable.save.versionConflict.message', { detail: conflict.message }),
                    confirmText: t('global-variable.save.versionConflict.reload'),
                })
                if (isReload && args.mode === 'update') args.reload()
                return
            }
            if (conflict) {
                await showImpact(`global-variable.save.blocked.${conflict.code}`, conflict.blocking, false)
                return
            }
            const violations = readViolations(error)
            if (violations.length > 0) {
                notifyError(violations.map((violation) => `${violation.field}: ${violation.message}`).join('\n'))
                return
            }
            notifyError(readErrorMessage(error) ?? t('global-variable.save.failed'))
        },
        [args, confirm, showImpact, t],
    )

    return useCallback(
        async (data: unknown): Promise<GlobalVariable> => {
            const body = toSaveDto(data as GlobalVariableFormValues, args.mode)
            if (args.mode === 'update') {
                const impact = await previewImpact({ id: args.id, body })
                if ('error' in impact) return abortSave('impact preview failed')
                if (impact.data.blocking.length > 0) {
                    await showImpact('global-variable.save.blocked.title', impact.data.blocking, false)
                    return abortSave('blocked by usages')
                }
                if (impact.data.warnings.length > 0
                    && !(await showImpact('global-variable.save.warnings.title', impact.data.warnings, true))) {
                    return abortSave('warnings declined')
                }
            }
            const result = args.mode === 'create'
                ? await createVariable(body)
                : await updateVariable({ id: args.id, body })
            if ('error' in result) {
                await handleSaveError(result.error)
                return abortSave('backend refused')
            }
            return result.data
        },
        [args, createVariable, handleSaveError, previewImpact, showImpact, updateVariable],
    )
}
