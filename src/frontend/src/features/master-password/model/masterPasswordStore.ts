import { create } from 'zustand'

type MasterPasswordState = {
    masterPassword: string
    setMasterPassword: (masterPassword: string) => void
    clearMasterPassword: () => void
}

const LEGACY_STORAGE_KEY = 'masterPassword'

// Earlier frontends persisted the master password in plain localStorage. Nothing writes it
// any more; drop a leftover value so it can't be read by scripts or seed a new session.
try {
    localStorage.removeItem(LEGACY_STORAGE_KEY)
} catch {
    // Storage blocked (private mode, sandboxed iframe): nothing to clean up.
}

export const useMasterPasswordStore = create<MasterPasswordState>((set) => ({
    masterPassword: '',
    setMasterPassword: (masterPassword) => set({ masterPassword }),
    clearMasterPassword: () => set({ masterPassword: '' }),
}))
