import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@features/auth/useAuth'

type ResetEntry = 'signingOut' | 'nothingToReset' | 'ready'

// A reset link opened in a browser that is still signed in must not bounce to
// the dashboard: the backend drops every session of that user on reset anyway,
// and the success redirect to /login would otherwise be swallowed by the live session.
// Without a token there is nothing to reset, so a signed-in user is left alone.
export function useSignOutForReset(): ResetEntry {
    const { isAuthenticated, logout } = useAuth()
    const [searchParams] = useSearchParams()
    const hasToken = Boolean(searchParams.get('token')?.trim())
    const hasStarted = useRef(false)

    useEffect(() => {
        if (!isAuthenticated || !hasToken || hasStarted.current) return
        hasStarted.current = true
        void logout()
    }, [isAuthenticated, hasToken, logout])

    if (!isAuthenticated) return 'ready'
    return hasToken ? 'signingOut' : 'nothingToReset'
}
