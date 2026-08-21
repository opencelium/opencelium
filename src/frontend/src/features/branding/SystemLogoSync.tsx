import { useEffect } from 'react'
import { useGetSystemSettingQuery } from '@entities/systemSetting/api/systemSettingApi'
import { useAuth } from '@features/auth/useAuth'
import { isAppLogoValue } from '@entities/systemSetting/model/types'
import { useAppLogoStore } from '@features/branding/appLogoStore'

/**
 * Keeps the org's logo (`app_logo`) in step with the server once a session exists — the
 * endpoint needs a token, so this can't run on the login screen. What brands the login
 * screen and the first paint after a reload is the cached path the store seeds itself
 * from; this only corrects it.
 *
 * A 404 is the documented "never uploaded / just removed" state and clears the cache, so
 * an admin's reset reaches every client. Any other failure (offline, 5xx) deliberately
 * keeps the cached logo rather than flipping every user back to the default.
 */
export function SystemLogoSync() {
    const { isAuthenticated } = useAuth()
    // Revalidate on every re-subscription (a re-login within the cache lifetime) so a
    // logo removed meanwhile can't be replayed from a stale cache entry.
    const { data, error } = useGetSystemSettingQuery('app_logo', {
        skip: !isAuthenticated,
        refetchOnMountOrArgChange: true,
    })
    const setLogo = useAppLogoStore(state => state.setLogo)
    const clearLogo = useAppLogoStore(state => state.clearLogo)

    // Runs on a server answer only. The stored path is read imperatively rather than
    // subscribed to on purpose: as a dependency it would re-run this on every local
    // write, re-applying the answer still cached here and undoing an admin's upload or
    // reset the moment they made it.
    useEffect(() => {
        if (!data) return
        if (!isAppLogoValue(data.value)) {
            clearLogo()
            return
        }
        if (data.value.url === useAppLogoStore.getState().logoPath) return
        setLogo(data.value.url)
    }, [data, setLogo, clearLogo])

    useEffect(() => {
        if (error && 'status' in error && error.status === 404) clearLogo()
    }, [error, clearLogo])

    return null
}
