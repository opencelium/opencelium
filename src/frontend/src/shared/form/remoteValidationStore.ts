import { create } from 'zustand'

type State = {
    loadingFields: Record<string, boolean>
    setLoading: (name: string, value: boolean) => void
}

export const useRemoteValidationStore = create<State>((set) => ({
    loadingFields: {},
    setLoading: (name, value) =>
        set((state) => ({
            loadingFields: {
                ...state.loadingFields,
                [name]: value,
            },
        })),
}))
