import { createContext, useContext, useEffect, useState } from 'react'
import { fetchGlobalVariablePicker, pickerQueryKey } from '../../api/pickerApi'
import type { PickerItem, PickerQuery } from '../../model/types'

// Which picker query the surrounding editor stands for: the saved workflow, an unsaved one's
// category, a connector or a schedule's notification. Null = no global variables offered.
export const GlobalPickerScopeContext = createContext<PickerQuery | null>(null)

export const useGlobalPickerScope = () => useContext(GlobalPickerScopeContext)

type PickerState = { items: PickerItem[]; isLoading: boolean }

export function useGlobalVariablePicker(): PickerState {
    const scope = useGlobalPickerScope()
    const key = scope ? pickerQueryKey(scope) : null
    const [state, setState] = useState<{ key: string | null; items: PickerItem[] }>({ key: null, items: [] })

    useEffect(() => {
        if (!scope || key === null) return
        let isCurrent = true
        void fetchGlobalVariablePicker(scope).then((items) => {
            if (isCurrent) setState({ key, items: items ?? [] })
        })
        return () => { isCurrent = false }
        // `key` stands for `scope`: a new object with the same query must not refetch.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key])

    return { items: state.key === key ? state.items : [], isLoading: key !== null && state.key !== key }
}

// The saved workflow when there is one, otherwise its category (contract: unsaved workflows ask by category).
export const workflowPickerScope = (connectionId: number | null, categoryId: number | null): PickerQuery | null => {
    if (connectionId) return { connectionId }
    return categoryId ? { categoryId } : null
}
