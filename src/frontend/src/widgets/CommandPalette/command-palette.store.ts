import {create} from "zustand";

export type CommandRenderMode = 'inline' | 'modal' | 'route' | 'new-tab';

const DEFAULT_MODE: CommandRenderMode = 'route';
const VALID_MODES: CommandRenderMode[] = ['inline', 'modal', 'route', 'new-tab'];

const readStoredMode = (): CommandRenderMode => {
    const stored = localStorage.getItem('commandMode');
    return VALID_MODES.includes(stored as CommandRenderMode)
        ? (stored as CommandRenderMode)
        : DEFAULT_MODE;
};

interface CommandPaletteUIState {
    /** The user's persisted preference (set in UI settings). */
    mode: CommandRenderMode;
    /** Context-scoped override (e.g. the workflow editor forces 'modal'); not
     * persisted. Takes precedence over `mode` for command execution only. */
    modeOverride: CommandRenderMode | null;
    setMode: (mode: CommandRenderMode) => void;
    setModeOverride: (mode: CommandRenderMode | null) => void;
    /** Mode commands should actually execute with: override when set, else preference. */
    resolveMode: () => CommandRenderMode;
}

export const useCommandPaletteUIStore = create<CommandPaletteUIState>((set, get) => ({
    mode: readStoredMode(),
    modeOverride: null,
    setMode: (mode) => set(() => {
        localStorage.setItem('commandMode', mode);
        return {
            mode,
        }
    }),
    setModeOverride: (modeOverride) => set({ modeOverride }),
    resolveMode: () => get().modeOverride ?? get().mode,
}));
