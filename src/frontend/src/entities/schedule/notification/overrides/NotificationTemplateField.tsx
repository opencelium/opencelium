import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormSelect } from '@shared/ui/form/FormSelect'
import type { FieldOverrideProps } from '@/engine/entity/overrides/types'
import type { NotificationTemplate } from '@entities/schedule/model/notification.types'
import { usePrevious } from '@entities/schedule/ui/usePrevious'

const stripLastSegment = (path: string): string =>
    path.includes('.') ? path.slice(0, path.lastIndexOf('.')) : ''

export function NotificationTemplateField({ field }: FieldOverrideProps) {
    const { watch, setValue, clearErrors } = useFormContext()
    const base = stripLastSegment(field.name)
    const notificationType = watch(`${base}.notificationType`)

    const previous = usePrevious(notificationType)
    useEffect(() => {
        if (previous !== undefined && previous !== notificationType) {
            setValue(field.name, null as unknown as number, { shouldDirty: true })
            clearErrors(field.name)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notificationType])

    return (
        <FormSelect
            createOptionUrl={"/notification-template/create"}
            name={field.name}
            labelKey={field.ui.props?.labelKey as string | undefined}
            readOnly={!notificationType}
            asyncOptions={{
                url: notificationType ? `/message/all/${notificationType}` : '',
                map: (data: NotificationTemplate[]) =>
                    (data ?? []).map((t) => ({ value: t.templateId, label: t.name })),
                refreshable: true,
            }}
        />
    )
}
