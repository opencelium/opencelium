import type { JSONPathEnvironment } from 'json-p3';
import { parseReference } from '../../components/request-editor/body-editor/bodyReference';
import { checkReferencePathSyntax } from '../../components/request-editor/body-editor/referencePathSyntax';

export type BrokenReference =
	| { reason: 'malformed' }
	| { reason: 'direction'; direction: string }
	| { reason: 'unknownStep'; color: string }
	| { reason: 'pathSyntax'; character: string | null };

/** A `{%…%}` token of the text that the backend would not resolve, with where it stands. */
export type BrokenReferenceAt = BrokenReference & { token: string; start: number; end: number };

const STEP_TOKEN_CANDIDATE_RE = /\{%[\s\S]*?%\}/g;
const SHAPE_RE = /^(#[0-9a-fA-F]{6})\.\(([^)]*)\)\./;

const checkToken = (token: string, stepColors: ReadonlySet<string>, environment: JSONPathEnvironment | null): BrokenReference | null => {
	const inner = token.slice(2, -2).trim();
	const shape = SHAPE_RE.exec(inner);
	if (!shape) return { reason: 'malformed' };
	if (shape[2] !== 'request' && shape[2] !== 'response') return { reason: 'direction', direction: shape[2] };
	const parsed = parseReference(inner);
	if (!parsed) return { reason: 'malformed' };
	if (!stepColors.has(parsed.color.toLowerCase())) return { reason: 'unknownStep', color: parsed.color };
	if (environment && parsed.field.startsWith('body.')) {
		// Without the root, as the workflow check passes it: the picker writes `$.[0].id`, which the
		// backend reads as `$[0].id` but strict JSONPath does not.
		const syntax = checkReferencePathSyntax(environment, parsed.field.slice('body.'.length).replace(/^\$\.?/, ''));
		if (syntax.status === 'syntaxError') return { reason: 'pathSyntax', character: syntax.character };
	}
	return null;
};

/**
 * The step references in a message the backend could not resolve: a token that is not shaped
 * like `{%#color.(response).body.$.path%}`, names neither request nor response, points at a
 * step this workflow does not have, or holds a JSON path that does not compile. The path check
 * needs the lazily loaded JSONPath environment and is skipped until it is there.
 */
export const findBrokenReferences = (
	text: string,
	stepColors: ReadonlySet<string>,
	environment: JSONPathEnvironment | null,
): BrokenReferenceAt[] => [...text.matchAll(STEP_TOKEN_CANDIDATE_RE)].flatMap((match) => {
	const broken = checkToken(match[0], stepColors, environment);
	return broken ? [{ ...broken, token: match[0], start: match.index, end: match.index + match[0].length }] : [];
});
