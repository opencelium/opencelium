import React, { useEffect } from 'react'
import { useController, useFormContext } from 'react-hook-form'
import { useFetchEntitiesQuery } from '@shared/api/genericApi'
import type { Aggregator } from '@entities/notificationTemplate/model/types'
import { toDisplayFormat, replaceInactiveArgs } from '@entities/notificationTemplate/lib/templateArgUtils'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { Mode } from '@/engine/entity/EntityDefinition'
import { FormInput } from '@shared/ui/form/FormInput'

interface TemplateSubjectEditorProps {
    name: string
    label?: string
    mode?: Mode
}

const SERVER_ARG_RE = /\{\{\d+\}\}/

export function TemplateSubjectEditor({ name, label, mode }: TemplateSubjectEditorProps) {
    const { t } = useI18n('entities')
    const { control } = useFormContext()
    const { field, fieldState } = useController({ name, control })
    const { data: aggregators = [] } = useFetchEntitiesQuery('/aggregator/all')

    // Convert server format {{argId}} → display format {{aggregatorName.argName}} on load
    useEffect(() => {
        const value = field.value as string | undefined
        if (value && SERVER_ARG_RE.test(value)) {
            const converted = toDisplayFormat(value, aggregators as Aggregator[])
            if (converted !== value) field.onChange(converted)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aggregators])

    // Replace any inactive aggregator's arg refs with {{OC_ARG_NOT_EXIST}} whenever value or aggregators change.
    useEffect(() => {
        if ((aggregators as Aggregator[]).length === 0) return
        const value = (field.value as string) ?? ''
        const replaced = replaceInactiveArgs(value, aggregators as Aggregator[])
        if (replaced !== value) field.onChange(replaced)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aggregators, field.value])

    const readOnly = mode === 'view'
    const translatedLabel = label ? t(label, { defaultValue: label }) : undefined

    return (
        <FormInput
            autoFocus
            label={translatedLabel}
            error={fieldState?.error?.message ? t(fieldState.error.message, { defaultValue: fieldState.error.message }) : ''}
            name={name}
            value={field.value ?? ''}
            onChange={field.onChange}
            readOnly={readOnly}
            disabled={readOnly}
            placeholder="e.g. Hello {{myAggregator.myArg}}"
        />
    )
}
