import { create } from 'zustand'
import { resolveStorageUrl } from '@shared/utils/storageUrl'

// Last logo URL seen from GET /system-setting/app_logo. Cached because that endpoint needs
// a token: the login screen has none, and after a reload the authenticated fetch resolves
// well after the first paint. The stored file itself is served without auth, so the cached
// URL keeps working there. Stored unresolved (the API base can be repointed per deploy).
const LOGO_STORAGE_KEY = 'oc_system_logo_url'

const readCachedLogoPath = (): string | null => localStorage.getItem(LOGO_STORAGE_KEY)

type AppLogoState = {
    /** Storage path as the server reported it, or null while the default logo applies. */
    logoPath: string | null
    /** Same value ready for an `<img src>`, or null to fall back to the bundled logo. */
    logoUrl: string | null
    setLogo: (path: string) => void
    clearLogo: () => void
}

/**
 * The org's uploaded logo, seeded synchronously from the cache so the first paint is
 * already branded. `SystemLogoSync` keeps it in step with the server, and the admin
 * controls push their own result here so an upload is visible without a reload.
 */
export const useAppLogoStore = create<AppLogoState>(set => ({
    logoPath: readCachedLogoPath(),
    logoUrl: resolveStorageUrl(readCachedLogoPath()),
    setLogo: path => {
        localStorage.setItem(LOGO_STORAGE_KEY, path)
        set({ logoPath: path, logoUrl: resolveStorageUrl(path) })
    },
    clearLogo: () => {
        localStorage.removeItem(LOGO_STORAGE_KEY)
        set({ logoPath: null, logoUrl: null })
    },
}))
