import { OperatorType, type Connection, type MethodWithId } from '../types/connection';

/**
 * Which array subscript a reference into a source response should carry.
 *
 * A method inside a loop runs once per element, so a reference into the collection that
 * loop walks must be written `[i]`, not `[0]` — `[0]` compiles, runs, and quietly writes
 * the first element on every iteration. Only the array a loop actually iterates gets its
 * iterator; every other array still resolves to its first element.
 */

/** `#AABBCC.(response).body.$.users` → the colour and the path within the message. */
const REFERENCE_IN_EXPRESSION =
	/(#[A-Fa-f0-9]{6})\.\((?:request|response)\)\.(?:header|body|status)(?:\.(\$[^\s%})'"]*|\$))?/;

/** `[0]`, `[*]`, `[7]` — the accessors that still denote the array, not one element. */
const TRAILING_COLLECTION_ACCESSOR = /\[(?:\*|\d+)]$/;

/**
 * The loop's collection as the schema walk names it.
 *
 * getReferenceOptions offers an array node only `[0]`, `[*]` and `[<iterator>]` — there is
 * no "the array itself" entry — so a loop's collection is always authored *with* a trailing
 * accessor, while the walk names that same array by its bare path. Without dropping the
 * accessor the two can never meet, and every reference falls back to `[0]`.
 *
 * A trailing iterator subscript is left alone: it names one element of an enclosing loop's
 * collection, and stripping it would map that outer collection to the inner iterator.
 */
const toCollectionPath = (path: string) => {
	const bare = path.replace(TRAILING_COLLECTION_ACCESSOR, '').replace(/\.$/, '');
	return bare || '$';
};

const parseCollectionReference = (expression: string | undefined) => {
	const match = String(expression ?? '').match(REFERENCE_IN_EXPRESSION);
	if (!match) return null;
	return { color: match[1].toLowerCase(), path: toCollectionPath(match[2] || '$') };
};

/** Operator indices that enclose this method: "1_2_0" is inside "1_2", which is inside "1". */
const ancestorIndexesOf = (methodIndex: string) => {
	const parts = String(methodIndex ?? '').split('_').filter(Boolean);
	return parts.slice(0, -1).map((_, depth) => parts.slice(0, depth + 1).join('_'));
};

/** Key into the accessor map: a colour plus the array's path inside that method's response. */
export const iteratorKey = (color: string, path: string) => `${color.toLowerCase()}|${path}`;

/**
 * Maps every collection an enclosing loop iterates to that loop's iterator name. Built from
 * the loops above `method` only, so a loop elsewhere in the graph never leaks into scope.
 */
export const buildIteratorAccessors = (
	connection: Connection | null,
	method: MethodWithId,
): Map<string, string> => {
	const accessors = new Map<string, string>();
	if (!connection) return accessors;
	const ancestors = new Set(ancestorIndexesOf(String(method.index ?? '')));

	connection.fromConnector.operator.forEach((operator) => {
		if (operator.type !== OperatorType.Loop) return;
		if (!ancestors.has(String(operator.index ?? ''))) return;
		const iterator = (operator as { iterator?: string }).iterator;
		const collection = parseCollectionReference(operator.expression);
		if (!iterator || !collection) return;
		accessors.set(iteratorKey(collection.color, collection.path), iterator);
	});

	return accessors;
};
