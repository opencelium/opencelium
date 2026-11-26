import { useState } from 'react'
import { genericApi, useGeneralRequestMutation } from '@shared/api/genericApi'
import { errorBus } from '@shared/errors/api/errorBus'
import { normalizeError } from '@shared/errors/api/normalizeError'
import { useAppDispatch } from '@shared/lib/storeHooks'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { PasswordResetLinkDto } from '@entities/user/model/types'
import {
    buildPasswordResetLinkUrl,
    isPasswordResetLinkDto,
    resolveResetLinkFailure,
} from '@entities/user/lib/passwordResetLink'

export function useCreatePasswordResetLink() {
    const { t } = useI18n('entities')
    const dispatch = useAppDispatch()
    const [generalRequest] = useGeneralRequestMutation()
    const [isCreating, setIsCreating] = useState(false)

    const create = async (userId: number, sendEmail: boolean): Promise<PasswordResetLinkDto | null> => {
        const url = buildPasswordResetLinkUrl(userId, sendEmail)
        setIsCreating(true)
        try {
            const result: unknown = await generalRequest({
                url,
                method: 'POST',
                options: { ignoreError: true, skipEntityInvalidation: true },
            }).unwrap()
            if (isPasswordResetLinkDto(result)) return result
            notifyError(t('user.resetLink.error.failed'))
            return null
        } catch (error) {
            const failure = resolveResetLinkFailure(error)
            if (failure) notifyError(t(`user.resetLink.error.${failure}`))
            else errorBus.emit(normalizeError(error, { url, method: 'POST' }))
            if (failure === 'userNotFound') dispatch(genericApi.util.invalidateTags(['Entity' as never]))
            return null
        } finally {
            setIsCreating(false)
        }
    }

    return { create, isCreating }
}
