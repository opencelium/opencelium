import { useEffect } from 'react'
import { message } from 'antd'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { useGetAiSettingsQuery, useUpdateAiSettingsMutation } from '@features/ai-assistant/api/aiApi'
import { aiSettingsFormSchema, type AiSettingsFormValues } from './aiSettingsForm.schema'
import { toFormValues, toGatewaySettings } from './aiSettingsForm.utils'

/**
 * The admin part of the AI settings page: the gateway's settings in a form, saved for everyone after a confirmation.
 * `onSaved` lets the page re-check availability, since a new Ollama URL or model changes it.
 */
export function useAiSettingsAdmin({ onSaved }: { onSaved: () => void }) {
    const { t } = useI18n('entities')
    const confirm = useConfirm()
    const query = useGetAiSettingsQuery(undefined, { refetchOnMountOrArgChange: true })
    const [update, updating] = useUpdateAiSettingsMutation()
    const form = useForm<AiSettingsFormValues>({ resolver: zodResolver(aiSettingsFormSchema), mode: 'onChange' })
    const saved = query.data?.settings
    const { reset } = form

    useEffect(() => {
        if (saved) reset(toFormValues(saved))
    }, [reset, saved])

    const save = form.handleSubmit(async (values) => {
        const isConfirmed = await confirm({
            title: t('ai-settings.admin.confirmSave.title'),
            message: t('ai-settings.admin.confirmSave.message'),
        })
        if (!isConfirmed) return
        try {
            const response = await update(toGatewaySettings(values)).unwrap()
            reset(toFormValues(response.settings))
            message.success(t('ai-settings.admin.saved'))
            onSaved()
        } catch {
            notifyError(t('ai-settings.admin.saveFailed'))
        }
    }, () => notifyError(t('ai-settings.admin.invalid')))

    const discard = () => {
        if (saved) reset(toFormValues(saved))
    }

    /** Fills in the environment's values; nothing changes until saved. */
    const resetToDefaults = () => {
        if (!query.data) return
        const defaults = toFormValues(query.data.defaults)
        for (const key of Object.keys(defaults) as (keyof AiSettingsFormValues)[]) {
            form.setValue(key, defaults[key], { shouldDirty: true, shouldValidate: true })
        }
    }

    return {
        form,
        data: query.data,
        isLoading: query.isLoading,
        /** A gateway older than `/settings`, or one that does not answer. */
        isUnavailable: query.isError,
        isSaving: updating.isLoading,
        isDirty: form.formState.isDirty,
        save,
        discard,
        resetToDefaults,
    }
}

export type AiSettingsAdmin = ReturnType<typeof useAiSettingsAdmin>
