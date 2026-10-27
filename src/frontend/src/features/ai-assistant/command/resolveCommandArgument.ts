import type { SuggestionOption } from '@shared/command/types';

export type ArgumentOption = { value: string; label: string };

export type ArgumentResolution =
	| { kind: 'match'; option: ArgumentOption }
	| { kind: 'choose'; options: ArgumentOption[] }
	| { kind: 'none' };

const toOption = (option: SuggestionOption): ArgumentOption | undefined => {
	if (typeof option === 'string') return { value: option, label: option };
	return option.disabled ? undefined : { value: option.value, label: option.label };
};

// Resolvers are debounced with `debouncePromise`, which never settles a call that a newer one replaced.
const RESOLVE_TIMEOUT_MS = 5000;
const search = (resolve: (input?: unknown) => Promise<SuggestionOption[]>, input: string) =>
	Promise.race([
		resolve(input),
		new Promise<SuggestionOption[]>((done) => setTimeout(() => done([]), RESOLVE_TIMEOUT_MS)),
	]);

const words = (text: string) => text.toLowerCase().split(/[^\p{L}\p{N}@.]+/u).filter((word) => word.length > 1);

/** Share of the requested words found in the option's label, e.g. "idoit otrs" against "idoit → OTRS sync [12]". */
const coverage = (requested: string[], label: string) => {
	const labelText = label.toLowerCase();
	return requested.length ? requested.filter((word) => labelText.includes(word)).length / requested.length : 0;
};

/**
 * Finds the record the model named, through the command's own resolver: the model only ever names things, ids come
 * from the backend. Resolvers search by the text they get, and the model's wording rarely matches a title exactly, so
 * a search for the whole text that finds nothing is retried word by word.
 */
export async function resolveCommandArgument(
	resolve: (input?: unknown) => Promise<SuggestionOption[]>,
	text: string,
): Promise<ArgumentResolution> {
	const requested = words(text);
	const found = new Map<string, ArgumentOption>();
	const collect = (options: SuggestionOption[]) =>
		options.forEach((option) => {
			const valid = toOption(option);
			if (valid) found.set(valid.value, valid);
		});

	collect(await search(resolve, text));
	if (found.size === 0) {
		for (const word of [...requested].sort((left, right) => right.length - left.length)) {
			collect(await search(resolve, word));
			if (found.size > 0) break;
		}
	}
	const options = [...found.values()];
	if (options.length === 0) return { kind: 'none' };

	const exact = options.find((option) => [option.label, option.value].some((candidate) => candidate.toLowerCase() === text.trim().toLowerCase()));
	if (exact) return { kind: 'match', option: exact };
	const scored = options
		.map((option) => ({ option, score: coverage(requested, option.label) }))
		.sort((left, right) => right.score - left.score);
	const [best, second] = scored;
	if (best && best.score > 0 && (!second || best.score > second.score)) return { kind: 'match', option: best.option };
	return options.length === 1 && options[0] ? { kind: 'match', option: options[0] } : { kind: 'choose', options };
}
