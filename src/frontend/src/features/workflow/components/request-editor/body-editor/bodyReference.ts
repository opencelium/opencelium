import { type Enhancement, Language } from '../../../types/connection';

export type ParsedReference = {
  color: string;
  type: 'request' | 'response';
  field: string;
};

const REFERENCE_RE =
  /^(#[A-Fa-f0-9]{6})\.\((request|response)\)\.(header|body|status)(?:\.(.*))?$/;

export const splitReferences = (value = '') =>
  String(value || '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);

export const parseReference = (reference = ''): ParsedReference | null => {
  const normalized = String(reference || '').trim().replace(/^\{\%\s*/, '').replace(/\s*\%\}$/, '');
  const match = normalized.match(REFERENCE_RE);
  if (!match) return null;
  const [, color, type, location, tail = ''] = match;
  const field = location === 'status' ? 'status' : tail ? `${location}.${tail}` : `${location}.$`;
  return { color, type: type as ParsedReference['type'], field };
};

export const getParsedReferences = (value = '') =>
  splitReferences(value)
    .map((item) => parseReference(item))
    .filter((item): item is ParsedReference => !!item);

export const hasOnlyReferences = (value: unknown) => {
  if (typeof value !== 'string') return false;
  if (!value.includes('#')) return false;
  const refs = splitReferences(value);
  return refs.length > 0 && refs.length === getParsedReferences(value).length;
};

export const hasMixedReferenceValue = (value: unknown) => {
  if (typeof value !== 'string') return false;
  if (!value.includes('#')) return false;
  const refs = splitReferences(value);
  return refs.length > 0 && refs.length !== getParsedReferences(value).length;
};

const normalizeBodySegment = (segment: string) => {
  const value = String(segment || '').trim();
  const indexMatch = value.match(/^\[?(\d+)]?$/);
  return indexMatch ? `[${indexMatch[1]}]` : value;
};

export const buildRequestResultField = (
  messageProperty: 'body' | 'header',
  namespace: string[] = [],
  name = '',
) => {
  const parts = [...namespace, name].filter(Boolean).map((item) => normalizeBodySegment(item));
  return `${messageProperty}.$.${parts.join('.').replace(/\.\./g, '.')}`.replace(/\.$/, '');
};

export const buildBodyEnhancement = (
  enhanceId: string,
  resultVar: string,
  references: ParsedReference[],
): Enhancement => {
  const enhancement: Enhancement = {
    enhanceId,
    language: Language.JavaScript,
    script: 'RESULT_VAR = VAR_0',
    args: { RESULT_VAR: resultVar },
  };
  references.forEach((reference, index) => {
    enhancement.args[`VAR_${index}`] = `${reference.color}.(${reference.type}).${reference.field}`;
  });
  return enhancement;
};

export const countEnhancementReferences = (enhancement?: Enhancement) =>
  Object.keys(enhancement?.args || {}).filter((key) => /^VAR_\d+$/.test(key)).length;

// Inverse of buildRequestResultField: turns a dotted resultVar path (e.g. "items.[0].name") back
// into the namespace/name pair getBodySelectionValue/setBodySelectionValue expect.
export const parseFieldPath = (path: string) => {
  const segments = String(path || '')
    .split('.')
    .filter(Boolean)
    .map((segment) => segment.match(/^\[(\d+)]$/)?.[1] ?? segment);
  const name = segments.pop() || '';
  return { namespace: segments, name };
};

// parseFieldPath's naive dot-split is ambiguous for a JSON key that itself contains a literal dot
// (e.g. OData's "@odata.id") — it can't tell that apart from two nested segments "@odata"/"id".
// This walks the actual source object level by level, at each step preferring the shortest
// segment merge that exists as a real key (the common, dot-free case) and only falling back to
// merging more segments together when the short lookup doesn't resolve — recovering the original,
// unambiguous namespace/name split. Falls back to parseFieldPath's naive split if source doesn't
// contain a matching path at all (e.g. the field was already removed).
export const resolveFieldPathAgainstSource = (
  source: unknown,
  path: string,
): { namespace: string[]; name: string } => {
  const segments = String(path || '')
    .split('.')
    .filter(Boolean)
    .map((segment) => segment.match(/^\[(\d+)]$/)?.[1] ?? segment);

  const resolve = (current: unknown, remaining: string[]): string[] | null => {
    if (remaining.length === 0) return [];
    for (let take = 1; take <= remaining.length; take += 1) {
      const candidateKey = remaining.slice(0, take).join('.');
      let next: unknown;
      if (Array.isArray(current)) {
        if (take !== 1) continue;
        const index = Number(remaining[0]);
        if (Number.isNaN(index)) continue;
        next = current[index];
      } else if (current && typeof current === 'object' && candidateKey in (current as Record<string, unknown>)) {
        next = (current as Record<string, unknown>)[candidateKey];
      } else {
        continue;
      }
      const rest = resolve(next, remaining.slice(take));
      if (rest !== null) return [candidateKey, ...rest];
    }
    return null;
  };

  const resolved = resolve(source, segments) ?? segments;
  const name = resolved.pop() || '';
  return { namespace: resolved, name };
};

export const removeReferenceValue = (current: unknown, pointer: string): string | null => {
  if (typeof current !== 'string') return null;
  const refs = splitReferences(current);
  if (!refs.includes(pointer)) return null;
  return refs.filter((item) => item !== pointer).join(';');
};
