import { useRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { message } from 'antd'
import cron from 'cron-validate'
import { Button } from '@shared/ui/primitives/Button'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { StepHeader } from '@shared/ui/step-form/StepHeader'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { FormConstraintsProvider } from '@shared/form/FormConstraintsContext'
import { CronEditor } from '@shared/ui/wizard-step/editor/cron-editor/CronEditor'
import { stripSeconds } from '@shared/ui/wizard-step/editor/cron-editor/cron-editor.utils'
import { useFetchEntitiesQuery, useUpdateEntityMutation } from '@shared/api/genericApi'
import type { Schedule, ScheduleUpdateDTO } from '../model/types'
import { notifyError } from '@shared/ui/feedback/notifyError'

type Props = {
    schedulerId: number
    connectionTitle: string
    onClose: () => void
}

type CronForm = { cronExp: string }

export function CronEditDialogContent({ schedulerId, connectionTitle, onClose }: Props) {
    const { data, isLoading } = useFetchEntitiesQuery(`/scheduler/${schedulerId}`)
    const schedule = (Array.isArray(data) ? data[0] : data) as Schedule | undefined

    if (isLoading || !schedule) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 240,
                }}
            >
                <Loading />
            </div>
        )
    }

    return (
        <CronEditForm
            schedule={schedule}
            connectionTitle={connectionTitle}
            onClose={onClose}
        />
    )
}

type FormProps = {
    schedule: Schedule
    connectionTitle: string
    onClose: () => void
}

// Mounted only once the schedule is loaded, so CronEditor reads the real cron
// value from defaultValues at mount instead of an empty form reset in an effect.
function CronEditForm({ schedule, connectionTitle, onClose }: FormProps) {
    const { t: tEntities } = useI18n('entities')
    const containerRef = useRef<HTMLDivElement>(null)
    const [updateEntity, { isLoading: isSaving }] = useUpdateEntityMutation()

    const form = useForm<CronForm>({
        defaultValues: { cronExp: schedule.cronExp ?? '' },
    })

    const handleSubmit = form.handleSubmit(async ({ cronExp }) => {
        if (cronExp && !cron(stripSeconds(cronExp), { override: { useBlankDay: true } }).isValid()) {
            notifyError(tEntities('schedule.fields.cronExp.error.invalid'))
            return
        }

        const body: ScheduleUpdateDTO = {
            schedulerId: schedule.schedulerId,
            title: schedule.title,
            debugMode: schedule.debugMode,
            status: schedule.status,
            cronExp,
            connectionId: String(schedule.connection.connectionId),
        }

        try {
            await updateEntity({ url: `/scheduler/${schedule.schedulerId}`, body }).unwrap()
            message.success(tEntities('schedule.cronEdit.success', { connectionTitle, cronExp }))
            onClose()
        } catch (err) {
            console.error(err)
            notifyError(tEntities('schedule.cronEdit.error'))
        }
    })

    return (
        <div ref={containerRef}>
            <StepHeader
                containerRef={containerRef}
                header="schedule.cronEdit.title"
                subheader="schedule.cronEdit.subtitle"
            />

            <FormConstraintsProvider constraints={{}}>
                <FormProvider {...form}>
                    <CronEditor
                        name="cronExp"
                        mode="update"
                        autoFocus
                        label={tEntities('schedule.fields.cronExp.label')}
                    />
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 8,
                            marginTop: 20,
                        }}
                    >
                        <Button type="primary" loading={isSaving} onClick={handleSubmit}>
                            {tEntities('schedule.cronEdit.submit')}
                        </Button>
                        <Button onClick={onClose}>
                            {tEntities('schedule.cronEdit.cancel')}
                        </Button>
                    </div>
                </FormProvider>
            </FormConstraintsProvider>
        </div>
    )
}
