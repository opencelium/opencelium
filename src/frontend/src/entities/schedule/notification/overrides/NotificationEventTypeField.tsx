import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormSelect } from '@shared/ui/form/FormSelect'
import { Hint } from '@shared/ui/primitives/Hint'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { FieldOverrideProps } from '@/engine/entity/overrides/types'

const EVENT_TYPES = ['pre', 'post', 'alert'] as const

export function NotificationEventTypeField({ field }: FieldOverrideProps) {
    const { t: tEntities } = useI18n('entities')
    const { watch } = useFormContext()
    const value = watch(field.name)

    const options = useMemo(
        () =>
            EVENT_TYPES.map((v) => ({
                value: v,
                label: tEntities(`schedule.notifications.eventTypeOptions.${v}`),
            })),
        [tEntities],
    )

    return (
        <>
            <FormSelect
                name={field.name}
                labelKey={field.ui.props?.labelKey as string | undefined}
                options={options}
            />
            {(value === 'pre' || value === 'alert') && (
                <Hint noPrefix>
                    {tEntities('schedule.notifications.aggregatorHint')}
                </Hint>
            )}
        </>
    )
}
