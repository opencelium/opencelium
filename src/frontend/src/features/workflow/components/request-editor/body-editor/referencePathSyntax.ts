import type { JSONPathEnvironment, JSONValue } from 'json-p3';
import { PayloadFormat, type MethodWithId } from '../../../types/connection';
import { isUnknownReferencePath, type ResponseType } from './requestReferenceOptions';

export type ReferencePathValidation =
  | { status: 'valid' }
  | { status: 'syntaxError'; position: number; character: string | null }
  | { status: 'unknownPath' };

export type ReferencePathFeedback = { severity: 'error' | 'warning'; message: string };

type MappedText = { text: string; origin: number[] };

const VALID: ReferencePathValidation = { status: 'valid' };

// The backend (ReferenceExtractor) treats any lowercase bracket word as a loop
// iterator and replaces it with the current index before JsonPath sees it.
const ITERATOR_RE = /\[([a-z]+)]/g;
const EMPTY_INDEX_RE = /\[]/g;
// OpenCelium's `['k']~` / `[i]~` operators, resolved manually and only as the last segment.
const TILDE_TAIL_RE = /(?<=])~$/;
// Jayway path functions, valid only as the last segment.
const FUNCTION_TAIL_RE = /\.(?:min|max|avg|stddev|length|sum|keys|first|last)\(\)$/;
const QUOTED_RE = /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g;
const INDEFINITE_RE = /\*|\.\.|\[\?|\[[^\]]*[:,][^\]]*]/;

const fromSource = (text: string): MappedText =>
  ({ text, origin: Array.from({ length: text.length + 1 }, (_, index) => index) });

// `origin[i]` is the source offset of `text[i]`; the extra last entry maps the
// end of the text, which is where "unexpected end" errors point.
const replaceMapped = ({ text, origin }: MappedText, pattern: RegExp,
  replace: (match: RegExpExecArray) => string): MappedText => {
  let nextText = '';
  const nextOrigin: number[] = [];
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const replacement = replace(match);
    nextText += text.slice(cursor, match.index) + replacement;
    nextOrigin.push(...origin.slice(cursor, match.index), ...Array(replacement.length).fill(origin[match.index]));
    cursor = match.index + match[0].length;
  }
  return { text: nextText + text.slice(cursor), origin: [...nextOrigin, ...origin.slice(cursor)] };
};

const stripTail = (mapped: MappedText, pattern: RegExp): MappedText => {
  const match = mapped.text.match(pattern);
  if (!match || match.index === undefined) return mapped;
  return { text: mapped.text.slice(0, match.index), origin: mapped.origin.slice(0, match.index + 1) };
};

const withRoot = ({ text, origin }: MappedText): MappedText => {
  const prefix = text.startsWith('$') ? '' : text.startsWith('[') ? '$' : '$.';
  return { text: prefix + text, origin: [...Array(prefix.length).fill(0), ...origin] };
};

// Mirrors the rewrites ReferenceExtractor applies before handing a path to
// Jayway, so what reaches json-p3 is what Jayway would compile.
export const toJsonPathQuery = (path: string): MappedText => {
  let mapped = withRoot(fromSource(path));
  mapped = replaceMapped(mapped, ITERATOR_RE, () => '[0]');
  mapped = replaceMapped(mapped, EMPTY_INDEX_RE, () => '[*]');
  mapped = stripTail(mapped, TILDE_TAIL_RE);
  mapped = stripTail(mapped, FUNCTION_TAIL_RE);
  return mapped.text === '$.' ? { text: '$', origin: mapped.origin.slice(0, 2) } : mapped;
};

const readErrorIndex = (error: unknown): number | null => {
  if (!error || typeof error !== 'object' || !('token' in error)) return null;
  const { token } = error as { token?: { index?: unknown } };
  return typeof token?.index === 'number' ? token.index : null;
};

export const checkReferencePathSyntax = (
  environment: JSONPathEnvironment,
  path: string,
): ReferencePathValidation => {
  const source = path.trim();
  if (!source) return VALID;
  const query = toJsonPathQuery(source);
  try {
    environment.compile(query.text);
    return VALID;
  } catch (error) {
    const index = readErrorIndex(error) ?? query.text.length;
    const position = query.origin[Math.min(index, query.origin.length - 1)] ?? source.length;
    return { status: 'syntaxError', position, character: source[position] ?? null };
  }
};

// XML bodies are resolved with XPath, not JsonPath.
const isJsonPathBody = (method: MethodWithId | undefined) =>
  method?.response?.success?.body?.format !== PayloadFormat.Xml;

export const validateReferencePath = (
  environment: JSONPathEnvironment | null,
  method: MethodWithId | undefined,
  type: ResponseType,
  path: string,
  iterators: string[] = [],
): ReferencePathValidation => {
  if (type !== 'body' || !path.trim()) return VALID;
  if (environment && isJsonPathBody(method)) {
    const syntax = checkReferencePathSyntax(environment, path);
    if (syntax.status !== 'valid') return syntax;
  }
  return isUnknownReferencePath(method, type, path, iterators) ? { status: 'unknownPath' } : VALID;
};

type FeedbackT = (key: string, values?: Record<string, unknown>) => string;

export const describeReferencePathValidation = (
  validation: ReferencePathValidation,
  t: FeedbackT,
): ReferencePathFeedback | null => {
  switch (validation.status) {
    case 'valid':
      return null;
    case 'syntaxError':
      return {
        severity: 'error',
        message: validation.character === null
          ? t('references.incompleteSyntax')
          : t('references.invalidSyntax', { position: validation.position + 1, character: validation.character }),
      };
    case 'unknownPath':
      return { severity: 'warning', message: t('references.unknownPath') };
    default: {
      const _exhaustive: never = validation;
      return _exhaustive;
    }
  }
};

export const isIndefiniteReferencePath = (path: string) =>
  INDEFINITE_RE.test(path.replace(QUOTED_RE, "''"));

// Live values for paths the hand-written walker can't follow (`*`, `[*].x`,
// filters, `..`). Returns null when the walker should handle the path instead:
// a definite path, an OpenCelium tail operator, or an iterator with no current index.
export const readLiveValueWithJsonPath = (
  environment: JSONPathEnvironment,
  source: unknown,
  path: string,
  resolveIteratorIndex: (iteratorName: string) => number | null,
): { value: unknown } | null => {
  const trimmed = path.trim();
  if (!isIndefiniteReferencePath(trimmed) || TILDE_TAIL_RE.test(trimmed) || FUNCTION_TAIL_RE.test(trimmed)) return null;
  let isResolved = true;
  const resolved = trimmed.replace(ITERATOR_RE, (_, iterator: string) => {
    const index = resolveIteratorIndex(iterator);
    if (index === null) isResolved = false;
    return `[${index ?? 0}]`;
  });
  if (!isResolved) return null;
  try {
    // Jayway returns every match of an indefinite path as a list, even a single one.
    return { value: environment.query(withRoot(fromSource(resolved)).text, source as JSONValue).values() };
  } catch {
    return null;
  }
};
