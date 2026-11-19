import { useMemo, type ReactNode } from 'react'
import type { PickerScope } from '../../model/types'
import { GlobalPickerScopeContext } from './globalPicker'

type Props = {
    scope: PickerScope | null
    children: ReactNode
}

export function GlobalPickerScopeProvider({ scope, children }: Props) {
    const key = scope ? JSON.stringify(scope) : null
    // Keyed by content so callers may pass a fresh object every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const stable = useMemo(() => scope, [key])
    return <GlobalPickerScopeContext.Provider value={stable}>{children}</GlobalPickerScopeContext.Provider>
}
