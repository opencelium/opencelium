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
    mode: CommandRenderMode;
    setMode: (mode: CommandRenderMode) => void;
}

export const useCommandPaletteUIStore = create<CommandPaletteUIState>((set) => ({
    mode: readStoredMode(),
    setMode: (mode) => set(() => {
        localStorage.setItem('commandMode', mode);
        return {
            mode,
        }
    }),
}));
