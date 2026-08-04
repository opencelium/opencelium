import React, { createContext, useContext, useMemo } from 'react'
import { buildTestId } from './testId'

/**
 * Carries the current test-id prefix down the tree so descendants (form fields,
 * list rows, action buttons) can derive entity-scoped selectors without
 * prop-drilling the entity name.
 *
 * Unlike PolicyReactContext this is intentionally *non-throwing*: components
 * outside any entity scope (auth forms, the workflow editor, dialogs) read an
 * `undefined` scope and fall back to unprefixed ids.
 */
const TestScopeContext = createContext<string | undefined>(undefined)

export function TestScopeProvider({
    scope,
    children,
}: {
    scope: string | undefined
    children: React.ReactNode
}) {
    const parent = useContext(TestScopeContext)
    // Nested scopes compose (e.g. an entity inside a multi-record sub-form).
    const value = useMemo(() => buildTestId(parent, scope), [parent, scope])
    return (
        <TestScopeContext.Provider value={value}>
            {children}
        </TestScopeContext.Provider>
    )
}

/** Current test-id prefix, or `undefined` when outside any scope. */
export function useTestScope(): string | undefined {
    return useContext(TestScopeContext)
}
