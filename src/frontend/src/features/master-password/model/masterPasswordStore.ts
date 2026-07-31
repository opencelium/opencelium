import { create } from 'zustand'

type MasterPasswordState = {
    masterPassword: string
    setMasterPassword: (masterPassword: string) => void
    clearMasterPassword: () => void
}

export const useMasterPasswordStore = create<MasterPasswordState>((set) => ({
    masterPassword: localStorage.getItem('masterPassword') || '',
    setMasterPassword: (masterPassword) => set({ masterPassword }),
    clearMasterPassword: () => set({ masterPassword: '' }),
}))
