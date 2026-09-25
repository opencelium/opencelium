import { useRef } from 'react'
import { Controller, FormProvider } from 'react-hook-form'
import { Button } from '@shared/ui/primitives/Button'
import { Switch } from '@shared/ui/primitives/Switch'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { FormConstraintsProvider } from '@shared/form/FormConstraintsContext'
import { FormInput } from '@shared/ui/form/FormInput'
import { CronEditor } from '@shared/ui/wizard-step/editor/cron-editor/CronEditor'
import type { ScheduleCreateDialogContentProps } from './ScheduleCreateDialogContent.types'
import { useScheduleCreateForm } from './useScheduleCreateForm'

export function ScheduleCreateDialogContent(props: ScheduleCreateDialogContentProps) {
    const { connectionTitle, onSuccess } = props
    const { t } = useI18n('workflow')
    const { t: tEntities } = useI18n('entities')
    const { t: tCommon } = useI18n('common')
    const containerRef = useRef<HTMLDivElement>(null)
    const { form, saving, handleSubmit } = useScheduleCreateForm(props)

    return (
        <div ref={containerRef}>
            <Typography variant="headline" as="h2">{t('schedules.create.title')}</Typography>
            <Typography variant="body" isSubtle>
                {t('schedules.create.subtitle', { title: connectionTitle })}
            </Typography>
            <FormConstraintsProvider constraints={{ title: { maxLength: 255 } }}>
                <FormProvider {...form}>
                    <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
                        <FormInput name="title" label={tEntities('schedule.fields.title.label')}
                            autoFocus showCounter rules={{
                                required: tCommon('field.required'),
                                validate: value => (typeof value === 'string' && value.trim().length > 0)
                                    || tCommon('field.required'),
                            }}
                        />
                        <Controller name="debugMode" control={form.control} render={({ field }) => (
                            <Switch checked={field.value} onChange={field.onChange} textKey={{
                                on: 'schedule.fields.debugMode.text.on',
                                off: 'schedule.fields.debugMode.text.off',
                            }} />
                        )} />
                        <CronEditor name="cronExp" mode="create"
                            label={tEntities('schedule.fields.cronExp.label')} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                        <Button type="primary" loading={saving} onClick={handleSubmit}>
                            {t('schedules.create.submit')}
                        </Button>
                        <Button onClick={onSuccess} disabled={saving}>{t('schedules.create.cancel')}</Button>
                    </div>
                </FormProvider>
            </FormConstraintsProvider>
        </div>
    )
}
