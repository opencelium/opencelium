import { useWatch } from 'react-hook-form'
import type { FieldOverrideProps } from '@/engine/entity/overrides/types'
import { FormSwitch } from '@shared/ui/form/FormSwitch'
import { GlobalVariableValueEditor } from './GlobalVariableValueEditor'
import { ScriptVariableEditor } from '../script/ScriptVariableEditor'

// The wizard's steps are fixed per entity, so the "value" step decides by kind what it holds:
// a value (with the secret switch) for a constant, the code and its parameters for a script.
export function GlobalVariableContentEditor(props: FieldOverrideProps) {
    const kind = useWatch({ name: 'kind' })
    if (kind === 'SCRIPT') return <ScriptVariableEditor mode={props.mode} />
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <FormSwitch name="secret" labelKey="global-variable.fields.secret.label"
                readOnly={props.mode === 'view'} testId="global-variable-field-secret" />
            <GlobalVariableValueEditor {...props} />
        </div>
    )
}
