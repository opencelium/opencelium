import { useState } from 'react'
import type { InputValue, InputValues } from '@features/workflow/components/request-editor/enhancement/ScriptPlayground/playgroundInputs'
import { useValidateGlobalScriptMutation } from '../../api/globalVariableApi'
import { toParameter } from '../../model/form'
import type { ScriptFormValues } from '../../model/script'
import type { ValidateScriptResponse } from '../../model/types'
import { toTestArguments } from './scriptTestMapping'

export const MISSING_INPUT: InputValue = { mode: 'missing', text: '' }

export function useScriptTestRun(script: ScriptFormValues) {
    const [validate, { isLoading: isRunning }] = useValidateGlobalScriptMutation()
    const [argumentInputs, setArgumentInputs] = useState<InputValues>({})
    const [result, setResult] = useState<ValidateScriptResponse | null>(null)
    const [completedAt, setCompletedAt] = useState<number>()

    const parameters = script.parameters.map(toParameter)
    const testArguments = toTestArguments(argumentInputs, parameters)

    const run = async () => {
        if (isRunning || testArguments.invalid.length > 0) return
        const response = await validate({
            language: script.language,
            code: script.code,
            parameters,
            testArguments: testArguments.values,
        })
        setResult('data' in response && response.data ? response.data : null)
        setCompletedAt(Date.now())
    }

    return {
        argumentInputs,
        setArgument: (name: string, input: InputValue) => setArgumentInputs((current) => ({ ...current, [name]: input })),
        invalid: testArguments.invalid,
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
