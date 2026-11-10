/**
 * Who made a change: the undo history observes graph state rather than call sites, so an AI edit says so right before
 * it writes, and the next recorded entry takes the mark. The mark expires: a write that turns out to change nothing
 * must not label the user's next edit as the AI's.
 */
const MARK_TTL_MS = 2000;

let markedUntil = 0;

export function markNextChangeAsAi(now = Date.now()): void {
	markedUntil = now + MARK_TTL_MS;
}

/** Consumes the mark: true once for the first change recorded while it is fresh. */
export function takeAiChangeMark(now = Date.now()): boolean {
	const isMarked = now <= markedUntil;
	markedUntil = 0;
	return isMarked;
}
