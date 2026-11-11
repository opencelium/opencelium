import { create } from 'zustand'

export type BeebotLanguage = 'auto' | 'en' | 'de'

export const BEEBOT_AUTO_STOP_MINUTES = [5, 10, 15, 30, 60] as const
export type BeebotAutoStopMinutes = (typeof BEEBOT_AUTO_STOP_MINUTES)[number]

type BeebotPrefs = {
    /** What is spoken; `auto` lets whisper detect it per utterance. */
    language: BeebotLanguage
    /** Listening stops after this long without a request: an open microphone nobody uses is a privacy cost. */
    autoStopMinutes: BeebotAutoStopMinutes
}

type BeebotPrefsState = BeebotPrefs & {
    setLanguage: (language: BeebotLanguage) => void
    setAutoStopMinutes: (minutes: BeebotAutoStopMinutes) => void
}

const STORAGE_KEY = 'oc_beebot_prefs'
const DEFAULTS: BeebotPrefs = { language: 'auto', autoStopMinutes: 10 }

const isLanguage = (value: unknown): value is BeebotLanguage => value === 'auto' || value === 'en' || value === 'de'
const isAutoStop = (value: unknown): value is BeebotAutoStopMinutes =>
    (BEEBOT_AUTO_STOP_MINUTES as readonly unknown[]).includes(value)

/** Per user and per browser: kept in localStorage, which may be missing or full; then the defaults hold. */
function readPrefs(): BeebotPrefs {
    try {
        const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
        if (!stored || typeof stored !== 'object') return DEFAULTS
        const { language, autoStopMinutes } = stored as Record<string, unknown>
        return {
            language: isLanguage(language) ? language : DEFAULTS.language,
            autoStopMinutes: isAutoStop(autoStopMinutes) ? autoStopMinutes : DEFAULTS.autoStopMinutes,
        }
    } catch {
        return DEFAULTS
    }
}

function writePrefs(prefs: BeebotPrefs) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    } catch {
        // Not kept beyond this page load; the choice still applies now.
    }
}

export const useBeebotPrefsStore = create<BeebotPrefsState>((set, get) => {
    const update = (patch: Partial<BeebotPrefs>) => {
        set(patch)
        const { language, autoStopMinutes } = get()
        writePrefs({ language, autoStopMinutes })
    }
    return {
        ...readPrefs(),
        setLanguage: (language) => update({ language }),
        setAutoStopMinutes: (autoStopMinutes) => update({ autoStopMinutes }),
    }
})
