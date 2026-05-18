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

const normalizeBodySegment = (segment: string) =>
  segment.replace(/\[(\d+)]/g, '.$1').replace(/^\./, '');

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
