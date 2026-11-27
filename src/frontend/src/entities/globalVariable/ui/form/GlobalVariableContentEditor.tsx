import { useWatch } from 'react-hook-form'
import type { FieldOverrideProps } from '@/engine/entity/overrides/types'
import { FormSwitch } from '@shared/ui/form/FormSwitch'
import { DocsLink } from '@shared/ui/actions/DocsLink'
import { GlobalVariableValueEditor } from './GlobalVariableValueEditor'
import { ScriptVariableEditor } from '../script/ScriptVariableEditor'
import { MutableSettingsEditor } from './MutableSettingsEditor'
import { GlobalVariableKindDocsLink } from './GlobalVariableKindDocsLink'

// The wizard's steps are fixed per entity, so the "value" step decides by kind what it holds:
// a value (with the secret switch) for a constant, the code and its parameters for a script.
export function GlobalVariableContentEditor(props: FieldOverrideProps) {
    const kind = useWatch({ name: 'kind' })
    if (kind === 'SCRIPT') return <ScriptVariableEditor mode={props.mode} />
    if (kind === 'MUTABLE') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                <GlobalVariableKindDocsLink kind="MUTABLE" />
                <GlobalVariableValueEditor {...props} />
                <MutableSettingsEditor mode={props.mode} />
            </div>
        )
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <GlobalVariableKindDocsLink kind="CONSTANT" />
            <FormSwitch name="secret" labelKey="global-variable.fields.secret.label"
                labelExtra={<DocsLink page="guides/global-variables" anchor="secrets-and-the-secret-key" testId="global-variable-secret-docs" />}
                readOnly={props.mode === 'view'} testId="global-variable-field-secret" />
            <GlobalVariableValueEditor {...props} />
        </div>
    )
}
