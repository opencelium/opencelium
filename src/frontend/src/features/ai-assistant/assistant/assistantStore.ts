import { create } from 'zustand';
import type { HelpSource } from '../model/aiGateway.types';

/** A command the answer offers, as the palette would show it. */
export type AssistantAction = { id: string; label: string; prefix: string };

export type AssistantTurn =
	| { id: number; role: 'user'; text: string }
	| { id: number; role: 'assistant'; text: string; sources: HelpSource[]; actions: AssistantAction[];
		status: 'searching' | 'writing' | 'done' | 'error' };

type AssistantState = {
	isOpen: boolean;
	/** The conversation lives for the browser session only; nothing is stored. */
	turns: AssistantTurn[];
	/** A question handed over (from the palette) for the panel to send once it is open. */
	pendingQuestion: string | null;
	/** A command the panel asks the palette to type in, for the user to confirm there. */
	paletteRequest: string | null;
	open: (question?: string) => void;
	close: () => void;
	takePendingQuestion: () => string | null;
	setTurns: (update: (turns: AssistantTurn[]) => AssistantTurn[]) => void;
	newConversation: () => void;
	runInPalette: (prefix: string) => void;
	takePaletteRequest: () => string | null;
};

/** The help assistant's state, shared by the top bar button, the palette and the panel. */
export const useAssistantStore = create<AssistantState>((set, get) => ({
	isOpen: false,
	turns: [],
	pendingQuestion: null,
	paletteRequest: null,
	open: (question) => set({ isOpen: true, ...(question?.trim() ? { pendingQuestion: question.trim() } : {}) }),
	close: () => set({ isOpen: false }),
	takePendingQuestion: () => {
		const question = get().pendingQuestion;
		if (question) set({ pendingQuestion: null });
		return question;
	},
	setTurns: (update) => set((state) => ({ turns: update(state.turns) })),
	newConversation: () => set({ turns: [] }),
	runInPalette: (prefix) => set({ paletteRequest: prefix, isOpen: false }),
	takePaletteRequest: () => {
		const request = get().paletteRequest;
		if (request) set({ paletteRequest: null });
		return request;
	},
}));
