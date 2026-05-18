import {create} from "zustand";

interface AppUIState {
    masterPassword: string;
    setMasterPassword: (newMasterPassword: string) => void;
}

export const useAppStore = create<AppUIState>((set) => ({
    masterPassword: (localStorage.getItem('masterPassword')) || '',
    setMasterPassword: (masterPassword) => set(() => {
        return {
            masterPassword,
        }
    }),
}));
