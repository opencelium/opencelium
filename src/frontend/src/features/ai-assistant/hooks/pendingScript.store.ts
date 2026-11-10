import { create } from 'zustand';

/** A script asked for from outside the transformation panel ("Beebot, apply transformation for …"), run once it shows. */
export type PendingScript = {
	enhanceId: string;
	description: string;
	/** Applied straight away when the user addressed the assistant by name; otherwise offered to compare and accept. */
	isApplied: boolean;
	/** Asked by voice: applied without the "Script applied" toast; Undo stays in the panel. */
	isQuiet: boolean;
};

/** Long enough for the panel and the AI availability check; a later visit to the field is not the request's. */
const PENDING_FOR_MS = 30_000;

type PendingScriptStore = {
	pending: (PendingScript & { requestedAt: number }) | null;
	request: (pending: PendingScript) => void;
	take: (enhanceId: string) => PendingScript | null;
};

export const usePendingScriptStore = create<PendingScriptStore>((set, get) => ({
	pending: null,
	request: (pending) => set({ pending: { ...pending, requestedAt: Date.now() } }),
	take: (enhanceId) => {
		const { pending } = get();
		if (pending?.enhanceId !== enhanceId) return null;
		set({ pending: null });
		const { requestedAt, ...script } = pending;
		return Date.now() - requestedAt <= PENDING_FOR_MS ? script : null;
	},
}));
