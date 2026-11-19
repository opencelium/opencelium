import { useMemo } from 'react'
import { MultiSelect } from '@shared/ui/primitives/MultiSelect'
import { FormControl } from '@shared/ui/form/FormControl'
import { useSearchGlobalVariablesQuery } from '../../api/globalVariableApi'
import type { ScriptLanguage } from '../../model/types'

type Props = {
    value: string[]
    onChange: (imports: string[]) => void
    language: ScriptLanguage
    ownName: string
    isReadOnly: boolean
}

// Scripts import only scripts of their own language (FR-44); cycles are refused by the backend on save.
export function ScriptImportsSelect({ value, onChange, language, ownName, isReadOnly }: Props) {
    const { data } = useSearchGlobalVariablesQuery({ page: 0, size: 1000, sort: 'name,asc', kind: 'SCRIPT' })
    const options = useMemo(() => (data?.content ?? [])
        .filter((item) => item.language === language && item.name !== ownName)
        .map((item) => ({ value: item.name, label: item.name })), [data, language, ownName])

    return (
        <FormControl label="global-variable.script.imports.label" hint="global-variable.script.imports.hint" style={{ width: '100%' }}>
            <MultiSelect value={value} onChange={onChange} options={options} disabled={isReadOnly}
                testId="global-variable-script-imports" />
        </FormControl>
    )
}
