import { useEffect } from 'react'
import { useAppSelector } from '@shared/lib/storeHooks'
import { selectIsAuthenticated } from '@entities/auth/model/authSelectors'
import { useMasterPasswordStore } from './masterPasswordStore'

// The store lives outside React and outlives the session, so without this the next user
// signing in to the same tab would find credentials already unlocked.
export function useClearMasterPasswordOnSignOut() {
    const isAuthenticated = useAppSelector(selectIsAuthenticated)
    useEffect(() => {
        if (!isAuthenticated) useMasterPasswordStore.getState().clearMasterPassword()
    }, [isAuthenticated])
}
