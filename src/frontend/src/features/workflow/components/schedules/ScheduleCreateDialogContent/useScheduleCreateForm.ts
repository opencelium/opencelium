import { useState } from 'react'
import { message } from 'antd'
import cron from 'cron-validate'
import { useForm } from 'react-hook-form'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { stripSeconds } from '@shared/ui/wizard-step/editor/cron-editor/cron-editor.utils'
import { useWizardSubmit } from '@/engine/entity/runtime/genererics/useWizardSubmit'
import type { ScheduleCreateDialogContentProps, ScheduleCreateForm } from './ScheduleCreateDialogContent.types'
import { notifyError } from '@shared/ui/feedback/notifyError'

export function useScheduleCreateForm({
    connectionId, connectionTitle, onSuccess,
}: ScheduleCreateDialogContentProps) {
    const { t } = useI18n('workflow')
    const { t: tEntities } = useI18n('entities')
    const submit = useWizardSubmit({ entityName: 'schedule', mode: 'create' })
    const [saving, setSaving] = useState(false)
    const form = useForm<ScheduleCreateForm>({
        defaultValues: { title: '', debugMode: false, cronExp: '' },
    })

    const handleSubmit = form.handleSubmit(async ({ title, debugMode, cronExp }) => {
        if (cronExp && !cron(stripSeconds(cronExp), { override: { useBlankDay: true } }).isValid()) {
            notifyError(tEntities('schedule.fields.cronExp.error.invalid'))
            return
        }
        setSaving(true)
        try {
            await submit({
                title: title.trim(), debugMode, cronExp: cronExp.trim(),
                connectionId: Number(connectionId),
            })
            message.success(t('schedules.create.success', { title: connectionTitle }))
            onSuccess()
        } catch {
            notifyError(t('schedules.create.error'))
        } finally {
            setSaving(false)
        }
    })

    return { form, saving, handleSubmit }
}
