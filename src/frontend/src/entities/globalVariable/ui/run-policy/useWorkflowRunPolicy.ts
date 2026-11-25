import { useEffect, useMemo, useState } from 'react'
import { useAppDispatch } from '@shared/lib/storeHooks'
import { globalVariableApi, useSearchGlobalVariablesQuery } from '../../api/globalVariableApi'
import { fetchGlobalVariablePicker } from '../../api/pickerApi'
import { findUsedMutableNames, resolveRunPolicy, type RunPolicyVariable, type WorkflowRunPolicy } from '../../model/runPolicy'
import type { PickerItem } from '../../model/types'

const MUTABLE_LIST_QUERY = { page: 0, size: 1000, sort: 'name,asc', kind: 'MUTABLE' } as const

// Neither the picker nor the list carries busyPolicy, so each used variable's detail is read.
function useBusyPolicies(ids: number[]): RunPolicyVariable[] {
    const dispatch = useAppDispatch()
    const [loaded, setLoaded] = useState<{ key: string; variables: RunPolicyVariable[] }>({ key: '', variables: [] })
    const idsKey = ids.join(',')
    useEffect(() => {
        if (ids.length === 0) return
        let isCurrent = true
        const subscriptions = ids.map((id) => dispatch(globalVariableApi.endpoints.getGlobalVariable.initiate(id)))
        void Promise.all(subscriptions.map((subscription) => subscription.unwrap().catch(() => null))).then((details) => {
            if (!isCurrent) return
            setLoaded({ key: idsKey, variables: details.flatMap((detail) => (detail?.kind === 'MUTABLE'
                ? [{ id: detail.id, name: detail.name, busyPolicy: detail.mutable.busyPolicy }]
                : [])) })
        })
        return () => {
            isCurrent = false
            subscriptions.forEach((subscription) => subscription.unsubscribe())
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the id list's content
    }, [dispatch, idsKey])
    return useMemo(() => (loaded.key === idsKey && idsKey ? loaded.variables : []), [loaded, idsKey])
}

// `referencedNames` come from the graph in the editor, so the badge already reflects unsaved
// edits; the backend decides from the saved workflow.
export function useWorkflowRunPolicy(connectionId: number | null, referencedNames: string[]): WorkflowRunPolicy | null {
    const [picker, setPicker] = useState<{ connectionId: number; items: PickerItem[] } | null>(null)
    useEffect(() => {
        if (connectionId === null) return
        let isCurrent = true
        void fetchGlobalVariablePicker({ connectionId })
            .then((items) => { if (isCurrent) setPicker({ connectionId, items: items ?? [] }) })
        return () => { isCurrent = false }
    }, [connectionId])
    const pickerItems = picker !== null && picker.connectionId === connectionId ? picker.items : null

    const usedNames = useMemo(
        () => (connectionId === null || pickerItems === null ? [] : findUsedMutableNames(pickerItems, connectionId, referencedNames)),
        [pickerItems, connectionId, referencedNames],
    )
    const { data: mutableList } = useSearchGlobalVariablesQuery(MUTABLE_LIST_QUERY, { skip: usedNames.length === 0 })
    const ids = useMemo(() => {
        const used = new Set(usedNames)
        return (mutableList?.content ?? []).filter((item) => used.has(item.name)).map((item) => item.id).sort((a, b) => a - b)
    }, [mutableList, usedNames])

    const variables = useBusyPolicies(ids)
    return useMemo(() => (usedNames.length === 0 ? null : resolveRunPolicy(variables)), [usedNames.length, variables])
}
