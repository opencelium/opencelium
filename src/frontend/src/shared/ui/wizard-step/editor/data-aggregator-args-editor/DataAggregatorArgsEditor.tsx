import React, { useEffect, useRef } from 'react'
import { useController, useFormContext, useWatch } from 'react-hook-form'
import { FormTextarea } from '@shared/ui/form/FormTextarea'
import { FormControl } from '@shared/ui/form/FormControl'
import { Input } from '@shared/ui/primitives/Input'
import { FieldArrayEditor } from '@shared/ui/wizard-step/editor/general/FieldArrayEditor'
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import type { Mode } from '@/engine/entity/EntityDefinition'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { renameVariableInScript, replaceDeletedArgInScript } from '@entities/dataAggregator/lib/scriptUtils'
import {FormInput} from "@shared/ui/form/FormInput";

interface DataAggregatorArgsEditorProps {
    name: string
    label?: string
    mode?: Mode
}

const DEFAULT_ARG = { name: '', description: '' }
const JS_IDENT_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

function ArgNameInput({ fieldName, readOnly }: { fieldName: string; readOnly: boolean }) {
    const { t } = useI18n('entities')
    const { control } = useFormContext()
    const { field } = useController({ name: fieldName, control })
    const value = (field.value ?? '') as string
    const isInvalid = !!value && !JS_IDENT_RE.test(value)
    const errorMsg = isInvalid
        ? t('data-aggregator.validation.argNameInvalid', { defaultValue: 'Invalid variable name' })
        : undefined

    return (
        <FormControl
            label={t('data-aggregator.fields.args.name', { defaultValue: 'Argument Name' })}
            error={errorMsg}
            name={fieldName}
        >
            <Input
                value={value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                error={isInvalid}
                readOnly={readOnly}
                disabled={readOnly}
            />
        </FormControl>
    )
}

export function DataAggregatorArgsEditor({ name, label, mode }: DataAggregatorArgsEditorProps) {
    const { t } = useI18n('entities')
    const { t: tCommon } = useI18n('common')
    const { control, formState: { errors }, getValues, setValue } = useFormContext()
    const args = (useWatch({ name, control }) ?? []) as { name: string; description: string }[]
    const prevNamesRef = useRef<string[]>([])

    useEffect(() => {
        const currentNames = args.map((a) => (a?.name ?? '') as string)
        const prevNames = prevNamesRef.current

        if (prevNames.length > 0) {
            let script = (getValues('script') as string) ?? ''
            let changed = false

            if (prevNames.length === currentNames.length) {
                for (let i = 0; i < currentNames.length; i++) {
                    const oldName = prevNames[i]
                    const newName = currentNames[i]
                    if (oldName && newName && oldName !== newName) {
                        script = renameVariableInScript(script, oldName, newName)
                        changed = true
                    }
                }
            } else if (prevNames.length > currentNames.length) {
                const currentSet = new Set(currentNames)
                for (const oldName of prevNames) {
                    if (oldName && !currentSet.has(oldName)) {
                        script = replaceDeletedArgInScript(script, oldName)
                        changed = true
                    }
                }
            }

            if (changed) setValue('script', script)
        }

        prevNamesRef.current = currentNames
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [args])

    const emptyError = ((errors as any)[name]?.root?.message ?? (errors as any)[name]?.message) as string | undefined

    const readOnly = mode === 'view'
    const translatedLabel = label ? t(label, { defaultValue: label }) : undefined

    return (
        <FieldArrayEditor
            name={name}
            variant={'compact'}
            required
            error={emptyError}
            label={translatedLabel}
            defaultItem={DEFAULT_ARG}
            hideAddButton={readOnly}
            addButtonText={t('data-aggregator.fields.args.add', { defaultValue: 'Add Argument' })}
            emptyText={t('data-aggregator.fields.args.empty', { defaultValue: 'No arguments yet.' })}
            rules={{
                validate: (value: unknown[]) =>
                    value.length > 0 || t('data-aggregator.fields.args.required', { defaultValue: 'At least one argument is required' }),
            }}
            renderItem={({ index, remove }) => (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8, alignItems: 'start' }}>
                    <ArgNameInput fieldName={`${name}.${index}.name`} readOnly={readOnly} />
                    <FormInput
                        name={`${name}.${index}.description`}
                        label={t('data-aggregator.fields.args.description', { defaultValue: 'Description' })}
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
