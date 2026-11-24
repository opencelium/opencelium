import { isGlobalReference } from '@entities/globalVariable/lib/globalReference';
import { type Enhancement, Language } from '../../../types/connection';
export {
  buildRequestResultField,
  parseFieldPath,
  resolveFieldPathAgainstSource,
} from './bodyReferencePath';

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

export type BindingArgument =
  | { kind: 'method'; reference: ParsedReference }
  | { kind: 'global'; reference: string };

const toBindingArgument = (item: string): BindingArgument | null => {
  const parsed = parseReference(item);
  if (parsed) return { kind: 'method', reference: parsed };
  return isGlobalReference(item) ? { kind: 'global', reference: item.trim() } : null;
};

// A global only becomes an enhancement arg next to a method reference. A field holding just
// `{{global.x}}` stays a plain value that the backend renders by itself.
export const getBindingArguments = (value = ''): BindingArgument[] => {
  const items = splitReferences(value).map(toBindingArgument);
  if (!items.some((item) => item?.kind === 'method')) return [];
  return items.filter((item): item is BindingArgument => item !== null);
};

export const formatBindingArgument = (argument: BindingArgument): string => {
  switch (argument.kind) {
    case 'method': {
      const { color, type, field } = argument.reference;
      return `${color}.(${type}).${field}`;
    }
    case 'global':
      return argument.reference;
    default: {
      const _exhaustive: never = argument;
      return _exhaustive;
    }
  }
};

export const isReferenceList = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const items = splitReferences(value);
  return items.length > 0 && items.every((item) => toBindingArgument(item) !== null);
};

export const hasOnlyReferences = (value: unknown) =>
  isReferenceList(value) && value.includes('#') && getParsedReferences(value).length > 0;

export const hasMixedReferenceValue = (value: unknown) =>
  typeof value === 'string' && value.includes('#') && splitReferences(value).length > 0
    && !isReferenceList(value);

export const DEFAULT_ENHANCEMENT_SCRIPT = 'RESULT_VAR = VAR_0';

export const buildBodyEnhancement = (
  enhanceId: string,
  resultVar: string,
  references: BindingArgument[],
): Enhancement => {
  const enhancement: Enhancement = {
    enhanceId,
    language: Language.JavaScript,
    script: DEFAULT_ENHANCEMENT_SCRIPT,
    args: { RESULT_VAR: resultVar },
  };
  references.forEach((reference, index) => {
    enhancement.args[`VAR_${index}`] = formatBindingArgument(reference);
  });
  return enhancement;
};

export const countEnhancementReferences = (enhancement?: Enhancement) =>
  Object.keys(enhancement?.args || {}).filter((key) => /^VAR_\d+$/.test(key)).length;

export const isDirectReferenceEnhancement = (enhancement?: Enhancement) =>
  countEnhancementReferences(enhancement) === 1 &&
  String(enhancement?.script ?? '').trim().replace(/;$/, '') === DEFAULT_ENHANCEMENT_SCRIPT;

export const removeReferenceValue = (current: unknown, pointer: string): string | null => {
  if (typeof current !== 'string') return null;
  const refs = splitReferences(current);
  if (!refs.includes(pointer)) return null;
  return refs.filter((item) => item !== pointer).join(';');
};
