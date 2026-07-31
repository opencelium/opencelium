import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormInput } from '@shared/ui/form/FormInput'
import type { FieldOverrideProps } from '@/engine/entity/overrides/types'
import { NOTIFICATION_TYPE_WEBHOOK } from '@entities/schedule/ui/notificationsForm'
import { usePrevious } from '@entities/schedule/ui/usePrevious'

const stripLastSegment = (path: string): string =>
    path.includes('.') ? path.slice(0, path.lastIndexOf('.')) : ''

export function NotificationRecipientsWebhookField({ field }: FieldOverrideProps) {
    const { watch, setValue, clearErrors } = useFormContext()
    const base = stripLastSegment(field.name)
    const notificationType = watch(`${base}.notificationType`)

    const previous = usePrevious(notificationType)
    useEffect(() => {
        if (previous !== undefined && previous !== notificationType) {
            setValue(field.name, '', { shouldDirty: true })
            clearErrors(field.name)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notificationType])

    if (notificationType !== NOTIFICATION_TYPE_WEBHOOK) return null

    return (
        <FormInput
            name={field.name}
            labelKey={field.ui.props?.labelKey as string | undefined}
        />
    )
}
