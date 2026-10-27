import { useEffect, useEffectEvent, useState } from 'react';
import { useSearchCommandsMutation } from '../api/aiApi';
import type { CatalogEntry } from './buildCommandCatalog';
import { toCatalogItem } from './commandProposal';

const SEARCH_DELAY_MS = 350;
const SUGGESTION_COUNT = 5;

/** Commands close in meaning to what was typed, for text the palette's own parser does not recognise. */
export function useCommandSuggestions(query: string, getCatalog: () => CatalogEntry[]): CatalogEntry[] {
	const [searchCommands] = useSearchCommandsMutation();
	const [result, setResult] = useState<{ query: string; entries: CatalogEntry[] }>({ query: '', entries: [] });

	const search = useEffectEvent(async (text: string, isCurrent: () => boolean) => {
		const catalog = getCatalog();
		if (catalog.length === 0) return;
		const response = await searchCommands({ query: text, commands: catalog.map(toCatalogItem), limit: SUGGESTION_COUNT })
			.unwrap()
			.catch(() => undefined);
		if (!response || !isCurrent()) return;
		const byId = new Map(catalog.map((entry) => [entry.id, entry]));
		setResult({ query: text, entries: response.matches.flatMap((match) => byId.get(match.id) ?? []) });
	});

	useEffect(() => {
		if (!query) return;
		let isCurrent = true;
		const timer = setTimeout(() => void search(query, () => isCurrent), SEARCH_DELAY_MS);
		return () => {
			isCurrent = false;
			clearTimeout(timer);
		};
	}, [query]);

	return result.query === query ? result.entries : [];
}
