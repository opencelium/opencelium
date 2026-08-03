import React, { useEffect, useRef } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { FieldArrayEditor } from '@shared/ui/wizard-step/editor/general/FieldArrayEditor'
import { FormInput } from '@shared/ui/form/FormInput'
import { FormSelect } from '@shared/ui/form/FormSelect'
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { Mode } from '@/engine/entity/EntityDefinition'

interface InvokerRequiredDataEditorProps {
    name: string
    label?: string
    mode?: Mode
}

type RequiredDataItem = {
    name: string
    visibility: 'public' | 'protected' | 'private'
    value: string
}

const API_KEY_DATA: RequiredDataItem[] = [
    { name: 'url', visibility: 'public', value: '' },
    { name: 'apikey', visibility: 'public', value: '' },
]

const TOKEN_DATA: RequiredDataItem[] = [
    { name: 'url', visibility: 'public', value: '' },
    { name: 'user', visibility: 'public', value: '' },
    { name: 'password', visibility: 'protected', value: '' },
    { name: 'token', visibility: 'private', value: '%{body.result}' },
]

const BASIC_DATA: RequiredDataItem[] = [
    { name: 'url', visibility: 'public', value: '' },
    { name: 'username', visibility: 'public', value: '' },
    { name: 'password', visibility: 'protected', value: '' },
    { name: 'token', visibility: 'private', value: 'Basic {username:password}' },
]

const ENDPOINT_DATA: RequiredDataItem[] = [
    { name: 'url', visibility: 'public', value: '' },
    { name: 'UserLogin', visibility: 'public', value: '' },
    { name: 'Password', visibility: 'protected', value: '' },
    { name: 'WebService', visibility: 'public', value: '' },
]

const PREDEFINED_DATA: Record<string, RequiredDataItem[]> = {
    apikey: API_KEY_DATA,
    token: TOKEN_DATA,
    basic: BASIC_DATA,
    endpointAuth: ENDPOINT_DATA,
}

const DEFAULT_ITEM: RequiredDataItem = { name: '', visibility: 'public', value: '' }

const VISIBILITY_OPTIONS = [
    { value: 'public', label: 'Public' },
    { value: 'protected', label: 'Protected' },
    { value: 'private', label: 'Private' },
]

export function InvokerRequiredDataEditor({ name, label, mode }: InvokerRequiredDataEditorProps) {
    const { t } = useI18n('entities')
    const { t: tCommon } = useI18n('common')
    const { control, formState: { errors }, setValue } = useFormContext()

    const authType = useWatch({ name: 'authType', control }) as string
    const prevAuthTypeRef = useRef<string | undefined>(undefined)

    useEffect(() => {
        if (mode === 'view') return
        const prev = prevAuthTypeRef.current
        prevAuthTypeRef.current = authType
        if (authType && authType !== prev && PREDEFINED_DATA[authType]) {
            setValue(name, PREDEFINED_DATA[authType], { shouldDirty: true })
        }
    }, [authType])

    const emptyError = (
        (errors as any)[name]?.root?.message ?? (errors as any)[name]?.message
    ) as string | undefined

    const readOnly = mode === 'view'
    const translatedLabel = label ? t(label, { defaultValue: label }) : undefined

    return (
        <FieldArrayEditor
            name={name}
            label={translatedLabel}
            required={!readOnly}
            error={emptyError}
            defaultItem={DEFAULT_ITEM}
            variant="compact"
            hideAddButton={readOnly}
            addButtonText={t('invoker.fields.requiredData.add', { defaultValue: 'Add Field' })}
            emptyText={t('invoker.fields.requiredData.empty', { defaultValue: 'No required data fields.' })}
            renderItem={({ index, remove }) => (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'start' }}>
                    <FormInput
                        name={`${name}.${index}.name`}
                        label={t('invoker.fields.requiredData.item.name', { defaultValue: 'Name' })}
                        readOnly={readOnly}
                    />
                    <FormSelect
                        name={`${name}.${index}.visibility`}
                        label={t('invoker.fields.requiredData.item.visibility', { defaultValue: 'Visibility' })}
                        options={VISIBILITY_OPTIONS}
                        readOnly={readOnly}
                    />
                    <FormInput
                        name={`${name}.${index}.value`}
                        label={t('invoker.fields.requiredData.item.value', { defaultValue: 'Default Value' })}
                        readOnly={readOnly}
                    />
                    {!readOnly && (
                        <div style={{ paddingTop: 24 }}>
                            <Tooltip content={tCommon('actions.delete')}>
                                <DeleteIconButton onClick={() => remove(index)} />
                            </Tooltip>
                        </div>
                    )}
                </div>
            )}
        />
    )
}
