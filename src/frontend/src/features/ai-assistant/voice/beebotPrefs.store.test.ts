import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('Beebot preferences', () => {
    beforeEach(() => {
        localStorage.clear()
        vi.resetModules()
    })

    it('starts from the defaults and keeps a change in this browser', async () => {
        const { useBeebotPrefsStore } = await import('./beebotPrefs.store')
        expect(useBeebotPrefsStore.getState()).toMatchObject({ language: 'auto', autoStopMinutes: 10 })
        useBeebotPrefsStore.getState().setLanguage('de')
        useBeebotPrefsStore.getState().setAutoStopMinutes(30)
        vi.resetModules()
        const reloaded = await import('./beebotPrefs.store')
        expect(reloaded.useBeebotPrefsStore.getState()).toMatchObject({ language: 'de', autoStopMinutes: 30 })
    })

    it('falls back to the defaults for values it does not know', async () => {
        localStorage.setItem('oc_beebot_prefs', JSON.stringify({ language: 'fr', autoStopMinutes: 7 }))
        const { useBeebotPrefsStore } = await import('./beebotPrefs.store')
        expect(useBeebotPrefsStore.getState()).toMatchObject({ language: 'auto', autoStopMinutes: 10 })
    })
})
