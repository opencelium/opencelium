import { create } from 'zustand';

/** The confirm dialog on screen, as far as something other than a click (a spoken "yes") needs it. */
export type OpenConfirm = {
	/** The question as text, when title and message are plain strings; for saying it aloud. */
	text: string;
	/** Confirming destroys something: a plain "yes" is not enough to answer it. */
	isDanger: boolean;
	openedAt: number;
	/** Answers it as its buttons would. */
	answer: (isConfirmed: boolean) => void;
};

type OpenConfirmStore = {
	current: OpenConfirm | null;
	set: (current: OpenConfirm | null) => void;
};

export const useOpenConfirmStore = create<OpenConfirmStore>((set) => ({
	current: null,
	set: (current) => set({ current }),
}));
