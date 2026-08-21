import { beforeEach, describe, expect, it, vi } from 'vitest'

const STORAGE_KEY = 'oc_system_logo_url'
const LOGO_PATH = './storage/files/9f1c.png'
const API_URL = 'https://oc.example.com/api'

/**
 * The store seeds itself from the cache at module load, so each case imports it fresh —
 * which also means the API base has to be set on that same fresh module graph.
 */
const loadStore = async (apiUrl = API_URL) => {
    vi.resetModules()
    const { runtimeConfig } = await import('@shared/config/runtimeConfig')
    runtimeConfig.apiUrl = apiUrl
    const { useAppLogoStore } = await import('@features/branding/appLogoStore')
    return useAppLogoStore
}

describe('app logo store', () => {
    beforeEach(() => {
        localStorage.removeItem(STORAGE_KEY)
    })

    it('starts on the default logo when nothing is cached', async () => {
        const store = await loadStore()
        expect(store.getState().logoUrl).toBeNull()
    })

    it('is branded on the first paint from the cache alone, before any request', async () => {
        localStorage.setItem(STORAGE_KEY, LOGO_PATH)
        const store = await loadStore()
        expect(store.getState().logoUrl).toBe('https://oc.example.com/api/storage/files/9f1c.png')
    })

    it('caches what it is given so the next load and the login screen keep the logo', async () => {
        const store = await loadStore()
        store.getState().setLogo(LOGO_PATH)
        expect(localStorage.getItem(STORAGE_KEY)).toBe(LOGO_PATH)
        expect(store.getState().logoUrl).toBe('https://oc.example.com/api/storage/files/9f1c.png')
    })

    it('stores the unresolved path, so a redeployed API base still resolves', async () => {
        const store = await loadStore()
        store.getState().setLogo(LOGO_PATH)
        const reloaded = await loadStore('https://other.example.com/api')
        expect(reloaded.getState().logoUrl)
            .toBe('https://other.example.com/api/storage/files/9f1c.png')
    })

    it('clears the cache on removal, so an admin reset reaches the login screen too', async () => {
        localStorage.setItem(STORAGE_KEY, LOGO_PATH)
        const store = await loadStore()
        store.getState().clearLogo()
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
        expect(store.getState().logoUrl).toBeNull()
    })
})
