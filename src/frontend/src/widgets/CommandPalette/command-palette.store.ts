import {create} from "zustand";

export type CommandRenderMode = 'inline' | 'modal' | 'route' | 'new-tab';

interface CommandPaletteUIState {
    mode: CommandRenderMode;
    setMode: (mode: CommandRenderMode) => void;
}

export const useCommandPaletteUIStore = create<CommandPaletteUIState>((set) => ({
    mode: (localStorage.getItem('commandMode')) || 'route',
    setMode: (mode) => set(() => {
        localStorage.setItem('commandMode', mode);
        return {
            mode,
        }
    }),
}));
