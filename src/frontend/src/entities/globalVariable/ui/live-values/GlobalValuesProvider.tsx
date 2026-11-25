import React, { useCallback, useMemo, useState } from 'react'
import { useGetGlobalVariableValuesQuery } from '../../api/globalVariableApi'
import { GlobalValuesContext, VALUES_POLL_MS } from './liveValues'

const MAX_IDS_PER_CALL = 100

// Polls GET /values for the ids that mounted cells registered, i.e. only the rows on screen.
export const GlobalValuesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [counts, setCounts] = useState<Map<number, number>>(new Map())

    const register = useCallback((id: number) => {
        setCounts((current) => new Map(current).set(id, (current.get(id) ?? 0) + 1))
        return () =>
            setCounts((current) => {
                const next = new Map(current)
                const count = (next.get(id) ?? 1) - 1
                if (count <= 0) next.delete(id)
                else next.set(id, count)
                return next
            })
    }, [])

    const ids = useMemo(() => [...counts.keys()].sort((a, b) => a - b).slice(0, MAX_IDS_PER_CALL), [counts])
    const { data } = useGetGlobalVariableValuesQuery(ids, {
        skip: ids.length === 0,
        pollingInterval: VALUES_POLL_MS,
        skipPollingIfUnfocused: true,
    })

    const values = useMemo(() => new Map((data ?? []).map((value) => [value.id, value])), [data])
    const context = useMemo(() => ({ register, values }), [register, values])

    return <GlobalValuesContext.Provider value={context}>{children}</GlobalValuesContext.Provider>
}
