import { IfOperatorName, UNARY_IF_OPERATORS } from './conditionBuilder.types';

// Faithful (best-effort) port of the backend's operator set — see
// src/backend/.../ocel/operator/operators/*.java, the ONLY operator
// implementation actually wired into the visual condition builder at
// runtime (a separate execution.operator.* hierarchy exists but is dead
// code, never referenced outside its own package). Kept intentionally
// close to those semantics rather than "whatever seems reasonable" so a
// hover result never contradicts what the backend actually decided.
export type OperandInput = { known: boolean; value: unknown };

// `error` means the backend operator would have thrown (e.g. GreaterThan
// between a number and a date) — surfaced distinctly from a real `false`
// result so the hover never implies a comparison that couldn't actually run.
export type ComparisonEvaluation =
	| { kind: 'unknown' }
	| { kind: 'error' }
	| { kind: 'result'; value: boolean };

// Java's isNumber (ValueUtils): a Number, or a string that parses as a plain
// decimal — no leading zeros ("007" is rejected, "0"/"0.5" are fine).
const NUMERIC_STRING_RE = /^-?(0|[1-9]\d*)(\.\d+)?$/;

function isNumericLike(value: unknown): value is number | string {
	if (typeof value === 'number') return Number.isFinite(value);
	if (typeof value !== 'string') return false;
	return NUMERIC_STRING_RE.test(value.trim());
}

const toNumber = (value: number | string): number => (typeof value === 'number' ? value : Number(value));

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;

const isIsoDate = (value: unknown): value is string => typeof value === 'string' && ISO_DATE_RE.test(value);
const isIsoDateTime = (value: unknown): value is string => typeof value === 'string' && ISO_DATETIME_RE.test(value);

// Java's Object.toString() fallback for EqualTo's non-numeric branch — exact
// array/map formatting differs from JSON.stringify, but that's a documented,
// low-impact gap (see the backend research this ported from): it only
// matters when comparing two whole objects/arrays with `=`, not scalars.
function toComparableString(value: unknown): string {
	if (value === null || value === undefined) return 'null';
	if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value);
	return String(value);
}

function equalTo(a: unknown, b: unknown): boolean {
	if (isNumericLike(a) && isNumericLike(b)) return toNumber(a) === toNumber(b);
	return toComparableString(a) === toComparableString(b);
}

// null when the two sides aren't ordered-comparable at all (Java throws) —
// both numeric, both ISO dates, or both ISO datetimes; no cross-type coercion.
function compareOrdered(a: unknown, b: unknown): number | null {
	if (isNumericLike(a) && isNumericLike(b)) return toNumber(a) - toNumber(b);
	if (isIsoDate(a) && isIsoDate(b)) return a < b ? -1 : a > b ? 1 : 0;
	if (isIsoDateTime(a) && isIsoDateTime(b)) return a < b ? -1 : a > b ? 1 : 0;
	return null;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// SQL-style LIKE (`%` any run, `_` any single char), case-insensitive,
// dot-matches-newline, full-string match — shared by Like/AllowList/DenyList.
function likeMatches(input: string, pattern: string): boolean {
	const translated = escapeRegExp(pattern).replace(/%/g, '.*').replace(/_/g, '.');
	return new RegExp(`^${translated}$`, 'is').test(input);
}

function likeMatchesSafe(a: unknown, b: unknown): boolean | null {
	if (a === null || a === undefined || b === null || b === undefined) return null;
	if (typeof a === 'object' || typeof b === 'object') return null;
	return likeMatches(String(a), String(b));
}

function regexMatchesSafe(a: unknown, b: unknown): boolean | null {
	if (a === null || a === undefined || b === null || b === undefined) return null;
	if (typeof a === 'object' || typeof b === 'object') return null;
	try {
		return new RegExp(`^(?:${String(b)})$`, 's').test(String(a));
	} catch {
		return null;
	}
}

// A string shaped like a bracket array is parsed the way a `constant`
// operand would carry an array literal; a real array (from a resolved JSON
// reference) passes through as-is.
function normalizeArrayLike(value: unknown): unknown[] | null {
	if (Array.isArray(value)) return value;
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return null;
	try {
		const parsed: unknown = JSON.parse(trimmed);
		return Array.isArray(parsed) ? parsed : null;
	} catch {
		return trimmed
			.slice(1, -1)
			.split(',')
			.map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
			.filter((part) => part.length > 0);
	}
}

function containsElement(list: unknown[], target: unknown, mode: 'exact' | 'substring'): boolean {
	if (target === null || target === undefined) {
		return mode === 'exact' ? list.some((item) => item === null || item === undefined) : false;
	}
	const targetStr = toComparableString(target);
	return list.some((item) => {
		const itemStr = toComparableString(item);
		return mode === 'exact' ? itemStr === targetStr : itemStr.includes(targetStr);
	});
}

// null when neither (or both) side is an array — Java throws in that case.
function evaluateContains(left: unknown, right: unknown, mode: 'exact' | 'substring'): boolean | null {
	const leftArray = normalizeArrayLike(left);
	const rightArray = normalizeArrayLike(right);
	if (leftArray && !rightArray) return containsElement(leftArray, right, mode);
	if (rightArray && !leftArray) return containsElement(rightArray, left, mode);
	return null;
}

function buildPatternList(value: unknown): string[] {
	const arr = normalizeArrayLike(value);
	if (arr) return arr.map((item) => toComparableString(item));
	if (typeof value === 'string') {
		return value
			.replace(/\n/g, ',')
			.split(',')
			.map((part) => part.trim())
			.filter((part) => part.length > 0);
	}
	return [toComparableString(value)];
}

function matchesInList(left: unknown, right: unknown): boolean {
	if (left === null || left === undefined) return false;
	const leftStr = toComparableString(left);
	return buildPatternList(right).some((pattern) => likeMatches(leftStr, pattern));
}

// The backend quirk carries over deliberately: a null left value is always
// "typeof" true, regardless of the requested type.
function isTypeOf(left: unknown, right: unknown): boolean | null {
	if (typeof right !== 'string') return null;
	if (left === null || left === undefined) return true;
	switch (right) {
		case 'NUM': return typeof left === 'number';
		case 'ARR': return Array.isArray(left);
		case 'OBJ': return true;
		case 'STR': return typeof left === 'string';
		case 'BOOL': return typeof left === 'boolean';
		default: return null;
	}
}

function javaLikeEquals(a: unknown, b: unknown): boolean {
	if (typeof a !== typeof b) return false;
	if (a !== null && b !== null && typeof a === 'object') return JSON.stringify(a) === JSON.stringify(b);
	return a === b;
}

// Despite the name, List/Set membership is a VALUE check (Java's
// Collection.contains), not a key check — only a Map/object checks a key.
function propertyExists(left: unknown, right: unknown): boolean | null {
	if (Array.isArray(left)) return left.some((item) => javaLikeEquals(item, right));
	if (left !== null && typeof left === 'object') return Object.prototype.hasOwnProperty.call(left, String(right));
	return null;
}

// Array-only in this engine — IsEmpty on a string/number/object throws on
// the backend, so it's surfaced here as `error`, not `false`.
function isEmptyList(value: unknown): boolean | null {
	const arr = normalizeArrayLike(value);
	return arr ? arr.length === 0 : null;
}

const isNullLike = (value: unknown): boolean => value === null || value === undefined || value === 'null';

export function evaluateIfComparison(
	operator: IfOperatorName,
	left: OperandInput,
	right: OperandInput | undefined,
): ComparisonEvaluation {
	const isUnary = UNARY_IF_OPERATORS.has(operator);
	if (!left.known) return { kind: 'unknown' };
	if (!isUnary && !right?.known) return { kind: 'unknown' };

	const a = left.value;
	const b = right?.value;

	switch (operator) {
		case IfOperatorName.Equal: return { kind: 'result', value: equalTo(a, b) };
		case IfOperatorName.NotEqual: return { kind: 'result', value: !equalTo(a, b) };
		case IfOperatorName.GreaterThan: {
			const cmp = compareOrdered(a, b);
			return cmp === null ? { kind: 'error' } : { kind: 'result', value: cmp > 0 };
		}
		case IfOperatorName.GreaterOrEqual: {
			const cmp = compareOrdered(a, b);
			return cmp === null ? { kind: 'error' } : { kind: 'result', value: cmp >= 0 };
		}
		case IfOperatorName.LessThan: {
			const cmp = compareOrdered(a, b);
			return cmp === null ? { kind: 'error' } : { kind: 'result', value: cmp < 0 };
		}
		case IfOperatorName.LessOrEqual: {
			const cmp = compareOrdered(a, b);
			return cmp === null ? { kind: 'error' } : { kind: 'result', value: cmp <= 0 };
		}
		case IfOperatorName.Like: {
			const result = likeMatchesSafe(a, b);
			return result === null ? { kind: 'error' } : { kind: 'result', value: result };
		}
		case IfOperatorName.NotLike: {
			const result = likeMatchesSafe(a, b);
			return result === null ? { kind: 'error' } : { kind: 'result', value: !result };
		}
		case IfOperatorName.Contains: {
			const result = evaluateContains(a, b, 'exact');
			return result === null ? { kind: 'error' } : { kind: 'result', value: result };
		}
		case IfOperatorName.NotContains: {
			const result = evaluateContains(a, b, 'exact');
			return result === null ? { kind: 'error' } : { kind: 'result', value: !result };
		}
		case IfOperatorName.ContainsSubStr: {
			const result = evaluateContains(a, b, 'substring');
			return result === null ? { kind: 'error' } : { kind: 'result', value: result };
		}
		case IfOperatorName.NotContainsSubStr: {
			const result = evaluateContains(a, b, 'substring');
			return result === null ? { kind: 'error' } : { kind: 'result', value: !result };
		}
		case IfOperatorName.AllowList: return { kind: 'result', value: matchesInList(a, b) };
		case IfOperatorName.DenyList: return { kind: 'result', value: !matchesInList(a, b) };
		case IfOperatorName.IsTypeOf: {
			const result = isTypeOf(a, b);
			return result === null ? { kind: 'error' } : { kind: 'result', value: result };
		}
		case IfOperatorName.PropertyExists: {
			const result = propertyExists(a, b);
			return result === null ? { kind: 'error' } : { kind: 'result', value: result };
		}
		case IfOperatorName.PropertyNotExists: {
			const result = propertyExists(a, b);
			return result === null ? { kind: 'error' } : { kind: 'result', value: !result };
		}
		case IfOperatorName.RegEx: {
			const result = regexMatchesSafe(a, b);
			return result === null ? { kind: 'error' } : { kind: 'result', value: result };
		}
		case IfOperatorName.IsEmpty: {
			const result = isEmptyList(a);
			return result === null ? { kind: 'error' } : { kind: 'result', value: result };
		}
		case IfOperatorName.IsNotEmpty: {
			const result = isEmptyList(a);
			return result === null ? { kind: 'error' } : { kind: 'result', value: !result };
		}
		case IfOperatorName.IsNull: return { kind: 'result', value: isNullLike(a) };
		case IfOperatorName.IsNotNull: return { kind: 'result', value: !isNullLike(a) };
		default: {
			const _exhaustive: never = operator;
			return _exhaustive;
		}
	}
}
