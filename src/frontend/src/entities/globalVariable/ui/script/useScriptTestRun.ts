import { useState } from 'react'
import { useValidateGlobalScriptMutation } from '../../api/globalVariableApi'
import { textToValue, toParameter } from '../../model/form'
import type { DetectedRef, ScriptFormValues } from '../../model/script'
import type { JsonValue, ValidateScriptResponse } from '../../model/types'

const toValues = (texts: Record<string, string>, keys: string[]): Record<string, JsonValue> =>
    Object.fromEntries(keys.filter((key) => (texts[key] ?? '').trim() !== '').map((key) => [key, textToValue(texts[key])]))

export function useScriptTestRun(script: ScriptFormValues, refs: DetectedRef[]) {
    const [validate, { isLoading: isRunning }] = useValidateGlobalScriptMutation()
    const [argumentTexts, setArgumentTexts] = useState<Record<string, string>>({})
    const [refTexts, setRefTexts] = useState<Record<string, string>>({})
    const [result, setResult] = useState<ValidateScriptResponse | null>(null)

    const run = async () => {
        const response = await validate({
            language: script.language,
            code: script.code,
            parameters: script.parameters.map(toParameter),
            imports: script.imports,
            testArguments: toValues(argumentTexts, script.parameters.map((parameter) => parameter.name.trim())),
            // A ref left empty is sent as missing, which the run reads as null — as it would at run time.
            testRefs: toValues(refTexts, refs.map((ref) => ref.ref)),
        })
        setResult('data' in response && response.data ? response.data : null)
    }

    return {
        argumentTexts,
        setArgument: (name: string, text: string) => setArgumentTexts((current) => ({ ...current, [name]: text })),
        refTexts,
        setRef: (ref: string, text: string) => setRefTexts((current) => ({ ...current, [ref]: text })),
        result,
        clearResult: () => setResult(null),
        isRunning,
        run,
    }
}
