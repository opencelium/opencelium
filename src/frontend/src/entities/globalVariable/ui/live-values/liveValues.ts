import { createContext, useContext, useEffect } from 'react'
import type { GlobalVariableValue } from '../../model/types'

export const VALUES_POLL_MS = 5000

export type GlobalValuesContextValue = {
    register: (id: number) => () => void
    values: Map<number, GlobalVariableValue>
}

export const GlobalValuesContext = createContext<GlobalValuesContextValue | null>(null)

export function useLiveGlobalValue(id: number | null): GlobalVariableValue | undefined {
    const context = useContext(GlobalValuesContext)
    const register = context?.register
    useEffect(() => (id === null || !register ? undefined : register(id)), [id, register])
    return id === null ? undefined : context?.values.get(id)
}
