import React from 'react'
import { Select, Tag } from 'antd'
import { useController, useFormContext } from 'react-hook-form'
import { useFetchEntitiesQuery } from '@shared/api/genericApi'
import type { Aggregator } from '@entities/notificationTemplate/model/types'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { Mode } from '@/engine/entity/EntityDefinition'
import {EntityText} from "@shared/ui/primitives/Text";

interface AggregatorWithArgsEditorProps {
    name: string
    label?: string
    mode?: Mode
}

export function AggregatorWithArgsEditor({ name, label, mode }: AggregatorWithArgsEditorProps) {
    const { t } = useI18n('entities')
    const { control, watch, setValue } = useFormContext()
    const { field, fieldState } = useController({ name, control })
    const { data: aggregators = [], isLoading } = useFetchEntitiesQuery('/aggregator/all')

    const selectedId = field.value as number | null | undefined
    const selectedAggregator = (aggregators as Aggregator[]).find((a) => a.id === selectedId)

    const readOnly = mode === 'view'
    const translatedLabel = label ? t(label, { defaultValue: label }) : undefined

    const options = (aggregators as Aggregator[]).map((a) => ({
        value: a.id,
        label: a.name,
    }))

    function handleArgClick(agg: Aggregator, argName: string) {
        const currentBody = watch('body') ?? ''
        setValue('body', currentBody + `{{${agg.name}.${argName}}}`)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {translatedLabel &&  <EntityText typoProps={{isBold: true}} i18nKey={translatedLabel}/>}
            <Select
                loading={isLoading}
                options={options}
                value={field.value ?? undefined}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={t('notificationTemplate.fields.aggregator.label', { defaultValue: 'Select aggregator' })}
                allowClear
                disabled={readOnly}
                status={fieldState.error ? 'error' : undefined}
                style={{ width: '100%' }}
            />
            <div style={{minHeight: '20px'}}>
            {fieldState.error?.message && (
                <span style={{ color: '#ff4d4f', fontSize: 12 }}>
                    {t(fieldState.error.message, { defaultValue: fieldState.error.message })}
                </span>
            )}
            </div>
            {selectedAggregator && selectedAggregator.args.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {selectedAggregator.args.map((arg) => (
                        <Tag
                            key={arg.id}
                            color={selectedAggregator.active ? 'blue' : 'red'}
                            style={{ cursor: readOnly ? 'default' : 'pointer' }}
                            title={arg.description}
                            onClick={readOnly ? undefined : () => handleArgClick(selectedAggregator, arg.name)}
                        >
                            {arg.name}
                        </Tag>
                    ))}
                </div>
            )}
            {selectedAggregator && !selectedAggregator.active && (
                <span style={{ color: '#ff4d4f', fontSize: 12 }}>
                    This aggregator is inactive. Its arguments will be replaced with {'{'}{'{'}OC_ARG_NOT_EXIST{'}'}{'}'}
                </span>
            )}
        </div>
    )
}
