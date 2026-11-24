import AceEditor from 'react-ace'
import 'ace-builds/src-noconflict/mode-json'
import 'ace-builds/src-noconflict/theme-tomorrow'
import 'ace-builds/src-noconflict/theme-tomorrow_night'
import { useController, useFormContext, useWatch } from 'react-hook-form'
import type { FieldOverrideProps } from '@/engine/entity/overrides/types'
import { FormControl } from '@shared/ui/form/FormControl'
import { Input } from '@shared/ui/primitives/Input'
import { useTheme } from '@shared/theme/hooks/useTheme'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { jsonTypeOf, textToValue } from '../../model/form'

export function GlobalVariableValueEditor({ field, mode }: FieldOverrideProps) {
    const { t } = useI18n('entities')
    const { themeMode } = useTheme()
    const { control } = useFormContext()
    const { field: controller, fieldState } = useController({ name: field.name, control })
    const isSecret = useWatch({ control, name: 'secret' }) === true
    const hasValue = useWatch({ control, name: 'hasValue' }) === true
    const isReadOnly = mode === 'view'
    const text = typeof controller.value === 'string' ? controller.value : ''
    const error = fieldState.error?.message
    if (isSecret) {
        const isKeptOnBlank = mode === 'update' && hasValue
        return (
            <FormControl name={field.name} label={field.label} error={error}
                hint={isKeptOnBlank ? 'global-variable.fields.value.secretKeptHint' : 'global-variable.fields.value.secretHint'}>
                <Input
                    type="password"
                    value={text}
                    onChange={(event) => controller.onChange(event.target.value)}
                    placeholder={isKeptOnBlank ? t('global-variable.fields.value.secretKeptPlaceholder') : undefined}
                    readOnly={isReadOnly}
                    error={!!error}
                    testId="global-variable-field-value-secret"
                />
            </FormControl>
        )
    }

    const hint = text.trim()
        ? t('global-variable.fields.value.savedAs', { type: t(`global-variable.jsonType.${jsonTypeOf(textToValue(text))}`) })
        : 'global-variable.fields.value.hint'
    return (
        <FormControl name={field.name} label={field.label} error={error} hint={hint} style={{ width: '100%' }}>
            <div data-testid="global-variable-field-value"
                style={{ width: '100%', border: '1px solid var(--color-border-default)', borderRadius: 6 }}>
                <AceEditor
                    mode="json"
                    theme={themeMode === 'dark' ? 'tomorrow_night' : 'tomorrow'}
                    value={text}
                    onChange={controller.onChange}
                    onBlur={controller.onBlur}
                    name={`ace_global_variable_${field.name}`}
                    width="100%"
                    minLines={4}
                    maxLines={20}
                    fontSize={13}
                    readOnly={isReadOnly}
                    setOptions={{ useWorker: false, showPrintMargin: false, wrap: true }}
                    editorProps={{ $blockScrolling: true }}
                />
            </div>
        </FormControl>
    )
}
