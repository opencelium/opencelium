import { useCallback } from 'react'
import { useFormContext } from 'react-hook-form'
import type { UpdateMode } from '@entities/updateAssistant/model/types'

const VERSION_FIELD = 'versionsDisplay'

export function useSelectUpdateMode() {
    const { setValue, getValues } = useFormContext()

    return useCallback(
        (mode: UpdateMode) => {
            if (getValues('updateMode') === mode) return
            // Online and offline list different versions, so a pick from one is meaningless in the other.
            setValue(VERSION_FIELD, null, { shouldDirty: true })
            setValue('updateMode', mode, { shouldValidate: true, shouldDirty: true })
        },
        [getValues, setValue],
    )
}
