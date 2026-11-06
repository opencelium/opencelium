import { create } from 'zustand';

/** Long enough for the dialog to open and the AI availability check to answer; a later visit is not the request's. */
const PENDING_FOR_MS = 30_000;

type PendingConditionStore = {
	/** A condition asked for from outside the dialog ("Beebot, add an if after X when …"), built once the if's dialog opens. */
	pending: { nodeId: string; instruction: string; requestedAt: number } | null;
	request: (nodeId: string, instruction: string) => void;
	/** Hands the instruction to the dialog of `nodeId` once; another operator's dialog leaves it waiting. */
	take: (nodeId: string) => string | null;
};

export const usePendingConditionStore = create<PendingConditionStore>((set, get) => ({
	pending: null,
	request: (nodeId, instruction) => set({ pending: { nodeId, instruction, requestedAt: Date.now() } }),
	take: (nodeId) => {
		const { pending } = get();
		if (pending?.nodeId !== nodeId) return null;
		set({ pending: null });
		return Date.now() - pending.requestedAt <= PENDING_FOR_MS ? pending.instruction : null;
	},
}));
