import { create } from 'zustand';

/** A mapping asked for from outside the body editor ("Beebot, suggest references for X from Y"), run once it opens. */
export type PendingMapping = {
	/** The method (node id) whose body editor runs the suggestion. */
	methodId: string;
	/** Only this method's response is offered; null offers every earlier method, as the button does. */
	source: { methodId: string; label: string } | null;
};

/** Long enough for the dialog to open and the AI availability check to answer; a later visit is not the request's. */
const PENDING_FOR_MS = 30_000;

type PendingMappingStore = {
	pending: (PendingMapping & { requestedAt: number }) | null;
	request: (pending: PendingMapping) => void;
	/** Hands the request to the body editor of `methodId` once; another method's editor leaves it waiting. */
	take: (methodId: string) => PendingMapping | null;
};

export const usePendingMappingStore = create<PendingMappingStore>((set, get) => ({
	pending: null,
	request: (pending) => set({ pending: { ...pending, requestedAt: Date.now() } }),
	take: (methodId) => {
		const { pending } = get();
		if (pending?.methodId !== methodId) return null;
		set({ pending: null });
		return Date.now() - pending.requestedAt <= PENDING_FOR_MS ? { methodId: pending.methodId, source: pending.source } : null;
	},
}));
