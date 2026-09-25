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

export const DEFAULT_ENHANCEMENT_SCRIPT = 'RESULT_VAR = VAR_0';

export const buildBodyEnhancement = (
  enhanceId: string,
  resultVar: string,
  references: ParsedReference[],
): Enhancement => {
  const enhancement: Enhancement = {
    enhanceId,
    language: Language.JavaScript,
    script: DEFAULT_ENHANCEMENT_SCRIPT,
    args: { RESULT_VAR: resultVar },
  };
  references.forEach((reference, index) => {
    enhancement.args[`VAR_${index}`] = `${reference.color}.(${reference.type}).${reference.field}`;
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
