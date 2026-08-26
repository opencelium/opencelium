import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormSelect } from '@shared/ui/form/FormSelect'
import type { FieldOverrideProps } from '@/engine/entity/overrides/types'
import type { User } from '@entities/user/model/types'
import { NOTIFICATION_TYPE_EMAIL } from '@entities/schedule/ui/notificationsForm'
import { usePrevious } from '@entities/schedule/ui/usePrevious'

const stripLastSegment = (path: string): string =>
    path.includes('.') ? path.slice(0, path.lastIndexOf('.')) : ''

export function NotificationRecipientsEmailsField({ field }: FieldOverrideProps) {
    const { watch, setValue, clearErrors } = useFormContext()
    const base = stripLastSegment(field.name)
    const notificationType = watch(`${base}.notificationType`)

    const previous = usePrevious(notificationType)
    useEffect(() => {
        if (previous !== undefined && previous !== notificationType) {
            setValue(field.name, [], { shouldDirty: true })
            clearErrors(field.name)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notificationType])

    if (notificationType !== NOTIFICATION_TYPE_EMAIL) return null

    return (
        <FormSelect
            createOptionUrl={"/user/create"}
            name={field.name}
            labelKey={field.ui.props?.labelKey as string | undefined}
            multiple
            asyncOptions={{
                url: '/user/all',
                // A user without an email cannot receive one — those accounts sign in
                // with a username only and have nothing to address the notification to.
                map: (data: User[]) =>
                    (data ?? [])
                        .filter((u): u is User & { email: string } => Boolean(u.email))
                        .map((u) => ({ value: u.email, label: u.email })),
                refreshable: true,
            }}
        />
    )
}
