import { create } from 'zustand';

const STORAGE_KEY = 'opencelium:notification:dismissed-guide-hints';

const readDismissed = (): string[] => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		const value: unknown = raw ? JSON.parse(raw) : [];
		return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
	} catch {
		return [];
	}
};

const writeDismissed = (ids: string[]) => {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
	} catch {
		// Storage blocked (private mode, quota): the hint just comes back next session.
	}
};

type DismissedGuideHintsState = {
	dismissed: string[];
	dismiss: (id: string) => void;
};

/** Guide hints a user closed, kept per browser so a closed hint stays closed. Ids are `<toolId>.<note>`. */
export const useDismissedGuideHints = create<DismissedGuideHintsState>((set) => ({
	dismissed: readDismissed(),
	dismiss: (id) => set((state) => {
		if (state.dismissed.includes(id)) return state;
		const dismissed = [...state.dismissed, id];
		writeDismissed(dismissed);
		return { dismissed };
	}),
}));
