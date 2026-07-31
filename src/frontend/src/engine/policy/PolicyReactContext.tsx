import React, { createContext, useContext } from 'react'
import type { PolicyContext } from './types'

const PolicyReactContext = createContext<PolicyContext | null>(null)

export function PolicyProvider({
    value,
    children
}: {
    value: PolicyContext
    children: React.ReactNode
}) {
    return (
        <PolicyReactContext.Provider value={value}>
            {children}
        </PolicyReactContext.Provider>
    )
}

export function usePolicyContext(): PolicyContext {
    const ctx = useContext(PolicyReactContext)

    if (!ctx) {
        throw new Error('usePolicyContext must be used inside PolicyProvider')
    }

    return ctx
}
