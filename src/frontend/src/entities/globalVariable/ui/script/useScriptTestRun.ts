import { useState } from 'react'
import type { InputValue, InputValues } from '@features/workflow/components/request-editor/enhancement/ScriptPlayground/playgroundInputs'
import { useValidateGlobalScriptMutation } from '../../api/globalVariableApi'
import { toParameter } from '../../model/form'
import type { DetectedRef, ScriptFormValues } from '../../model/script'
import type { ValidateScriptResponse } from '../../model/types'
import { toTestValues } from './scriptTestMapping'

export const MISSING_INPUT: InputValue = { mode: 'missing', text: '' }

export function useScriptTestRun(script: ScriptFormValues, refs: DetectedRef[]) {
    const [validate, { isLoading: isRunning }] = useValidateGlobalScriptMutation()
    const [argumentInputs, setArgumentInputs] = useState<InputValues>({})
    const [refInputs, setRefInputs] = useState<InputValues>({})
    const [result, setResult] = useState<ValidateScriptResponse | null>(null)
    const [completedAt, setCompletedAt] = useState<number>()

    const testArguments = toTestValues(argumentInputs, script.parameters.map((parameter) => parameter.name.trim()))
    const testRefs = toTestValues(refInputs, refs.map((ref) => ref.ref))
    const invalid = [...testArguments.invalid, ...testRefs.invalid]

    const run = async () => {
        if (isRunning || invalid.length > 0) return
        const response = await validate({
            language: script.language,
            code: script.code,
            parameters: script.parameters.map(toParameter),
            imports: script.imports,
            testArguments: testArguments.values,
            testRefs: testRefs.values,
        })
        setResult('data' in response && response.data ? response.data : null)
        setCompletedAt(Date.now())
    }

    return {
        argumentInputs,
        setArgument: (name: string, input: InputValue) => setArgumentInputs((current) => ({ ...current, [name]: input })),
        refInputs,
        setRef: (ref: string, input: InputValue) => setRefInputs((current) => ({ ...current, [ref]: input })),
        invalid,
        result,
        completedAt,
        clearResult: () => {
            setResult(null)
            setCompletedAt(undefined)
        },
        isRunning,
        run,
    }
}
