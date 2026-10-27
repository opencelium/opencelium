// "i-doit", "idoit" and "I Doit" are one name to a speaker.
const normalize = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
const words = (text: string) => text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 1);

/** Share of the said words found in a name, compared without separators. */
function score(said: string, name: string): number {
	if (normalize(said) === normalize(name)) return 2;
	const saidWords = words(said);
	if (saidWords.length === 0) return 0;
	const target = normalize(name);
	return saidWords.filter((word) => target.includes(normalize(word))).length / saidWords.length;
}

/**
 * The one item whose name fits what the user said, or undefined when none fits well or two fit equally: a guess
 * would fill the form with the wrong record, an empty field just asks the user to pick.
 */
export function matchByName<T>(items: T[], nameOf: (item: T) => string[], said: string): T | undefined {
	if (!said.trim()) return undefined;
	const ranked = items
		.map((item) => ({ item, score: Math.max(0, ...nameOf(item).map((name) => score(said, name))) }))
		.filter((entry) => entry.score >= 0.5)
		.sort((left, right) => right.score - left.score);
	const [best, second] = ranked;
	return best && (!second || best.score > second.score) ? best.item : undefined;
}
