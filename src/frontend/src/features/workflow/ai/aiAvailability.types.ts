/**
 * Whether the AI routes can answer, asked before either panel offers an action.
 *
 * Three states rather than a boolean, because the two panels degrade differently and the
 * difference is not cosmetic. The mapping suggester's precedent and name-match tiers are
 * computed on the server without a model, so it stays useful with the model gone and only
 * loses its semantic tier. Writing a script has no non-model path at all. And a backend
 * that serves no AI routes is a third case, where neither can work — telling it apart from
 * a configured-but-model-less one is the reason /ai/availability exists as its own route.
 */

/** Wire shape. `provider` names the vendor for the dev log; it is not shown to the user. */
export type AiAvailabilityResponse = {
	available: boolean;
	provider?: string;
};

export type AiAvailability =
	| { status: 'checking' }
	| { status: 'available'; provider?: string }
	/** Routes are there, no model behind them: local tiers only. */
	| { status: 'no-model' }
	/** No AI routes on this backend, or the probe failed. */
	| { status: 'unreachable' };
