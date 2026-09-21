import { create } from 'zustand'

type DashboardTourState = {
    /** True once the user asks for the tour; the tour itself checks the route. */
    requested: boolean
    request: () => void
    dismiss: () => void
}

/**
 * Not persisted, like the workflow tutorial and unlike the intro tour: the
 * dashboard tour is only ever launched by hand from the command palette, so
 * there is no progress worth restoring and nothing to remember between reloads.
 */
export const useDashboardTourStore = create<DashboardTourState>(set => ({
    requested: false,
    request: () => set({ requested: true }),
    dismiss: () => set({ requested: false }),
}))
