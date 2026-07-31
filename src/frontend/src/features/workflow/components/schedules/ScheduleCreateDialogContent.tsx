import { useRef, useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { message } from 'antd'
import cron from 'cron-validate'
import { Button } from '@shared/ui/primitives/Button'
import { Switch } from '@shared/ui/primitives/Switch'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { FormConstraintsProvider } from '@shared/form/FormConstraintsContext'
import { FormInput } from '@shared/ui/form/FormInput'
import { CronEditor } from '@shared/ui/wizard-step/editor/cron-editor/CronEditor'
import { stripSeconds } from '@shared/ui/wizard-step/editor/cron-editor/cron-editor.utils'
import { useWizardSubmit } from '@/engine/entity/runtime/genererics/useWizardSubmit'

type Props = {
    connectionId: string
    connectionTitle: string
    onSuccess: () => void
}

type ScheduleCreateForm = {
    title: string
    debugMode: boolean
    cronExp: string
}

// The connection is fixed to the current workflow, so — unlike the schedule entity
// wizard — there is no connection picker. We reuse the entity's create submit
// (lifecycle + cache invalidation) and assemble the payload with a fixed connectionId.
export function ScheduleCreateDialogContent({ connectionId, connectionTitle, onSuccess }: Props) {
    const { t } = useI18n('workflow')
    const { t: tEntities } = useI18n('entities')
    const { t: tCommon } = useI18n('common')
    const containerRef = useRef<HTMLDivElement>(null)
    const submit = useWizardSubmit({ entityName: 'schedule', mode: 'create' })
    const [saving, setSaving] = useState(false)

    const form = useForm<ScheduleCreateForm>({
        defaultValues: { title: '', debugMode: false, cronExp: '' },
    })

    const handleSubmit = form.handleSubmit(async ({ title, debugMode, cronExp }) => {
        const normalizedTitle = title.trim()
        if (cronExp && !cron(stripSeconds(cronExp), { override: { useBlankDay: true } }).isValid()) {
            message.error(tEntities('schedule.fields.cronExp.error.invalid'))
            return
        }

        setSaving(true)
        try {
            await submit({
                title: normalizedTitle,
                debugMode,
                cronExp: cronExp.trim(),
                connectionId: Number(connectionId),
            })
            message.success(t('schedules.create.success', { title: connectionTitle }))
            onSuccess()
        } catch {
            message.error(t('schedules.create.error'))
        } finally {
            setSaving(false)
        }
    })

    return (
        <div ref={containerRef}>
            <Typography variant="headline" as="h2">
                {t('schedules.create.title')}
            </Typography>
            <Typography variant="body" isSubtle>
                {t('schedules.create.subtitle', { title: connectionTitle })}
            </Typography>

            <FormConstraintsProvider constraints={{ title: { maxLength: 255 } }}>
                <FormProvider {...form}>
                    <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
                        <FormInput
                            name="title"
                            label={tEntities('schedule.fields.title.label')}
                            autoFocus
                            showCounter
                            rules={{
                                required: tCommon('field.required'),
                                validate: value =>
                                    (typeof value === 'string' && value.trim().length > 0)
                                    || tCommon('field.required'),
                            }}
                        />
                        <Controller
                            name="debugMode"
                            control={form.control}
                            render={({ field }) => (
                                <Switch
                                    checked={field.value}
                                    onChange={field.onChange}
                                    textKey={{
                                        on: 'schedule.fields.debugMode.text.on',
                                        off: 'schedule.fields.debugMode.text.off',
                                    }}
                                />
                            )}
                        />
                        <CronEditor
                            name="cronExp"
                            mode="create"
                            label={tEntities('schedule.fields.cronExp.label')}
                        />
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 8,
                            marginTop: 20,
                        }}
                    >
                        <Button type="primary" loading={saving} onClick={handleSubmit}>
                            {t('schedules.create.submit')}
                        </Button>
                        <Button onClick={onSuccess} disabled={saving}>
                            {t('schedules.create.cancel')}
                        </Button>
                    </div>
                </FormProvider>
            </FormConstraintsProvider>
        </div>
    )
}
