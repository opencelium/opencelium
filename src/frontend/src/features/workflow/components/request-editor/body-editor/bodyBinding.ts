import { type Connection, type Enhancement } from '../../../types/connection';
import { buildBodyEnhancement, buildRequestResultField, getParsedReferences, type ParsedReference } from './bodyReference';
import { createShortId } from '@shared/lib/createId';

export type DirectReferenceInfo = {
  leftField: string;
  refs: ParsedReference[];
};

// A field can hold a raw reference token with no matching fieldBinding — e.g. a template
// imported with body/header JSON that already contains `{%...%}` tokens the UI never ran
// through updateRequestFieldBindings for. Surfaces that "direct reference" so the enhancement
// panel can explain the 1:1 mapping instead of just showing an empty state.
export const getDirectReferenceInfo = (
  messageProperty: 'body' | 'header',
  namespace: string[],
  name: string,
  value: unknown,
): DirectReferenceInfo | null => {
  const refs = getParsedReferences(typeof value === 'string' ? value : '');
  if (refs.length === 0) return null;
  return { leftField: buildRequestResultField(messageProperty, namespace, name), refs };
};

export const createDirectReferenceEnhancement = (
  connection: Connection,
  methodColor: string,
  messageProperty: 'body' | 'header',
  namespace: string[],
  name: string,
  value: unknown,
): { connection: Connection; enhanceId: string } | null => {
  const direct = getDirectReferenceInfo(messageProperty, namespace, name, value);
  if (!direct) return null;
  const resultVar = `${methodColor}.(request).${direct.leftField}`;
  const enhanceId = createShortId();
  const enhancement = buildBodyEnhancement(enhanceId, resultVar, direct.refs);
  return {
    connection: { ...connection, fieldBindings: [...(connection.fieldBindings || []), { enhancement }] },
    enhanceId,
  };
};

type BodyEditData = {
  namespace?: string[];
  name?: string;
  newValue?: unknown;
};

export const collectEnhancementsFromObject = (
  body: unknown,
  methodColor: string,
  messageProperty: 'body' | 'header',
) => {
  const seen = new Map<string, Enhancement>();
  const visit = (value: unknown, namespace: string[] = [], name = '') => {
    const resultField = name ? buildRequestResultField(messageProperty, namespace, name) : '';
    if (typeof value === 'string') {
      const refs = getParsedReferences(value);
      if (refs.length > 0 && resultField) {
        const id = createShortId();
        seen.set(id, buildBodyEnhancement(id, `${methodColor}.(request).${resultField}`, refs));
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, [...namespace, name].filter(Boolean), String(index)));
      return;
    }
    if (value && typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(([key, nested]) => {
        visit(nested, [...namespace, name].filter(Boolean), key);
      });
    }
  };
  visit(body);
  return Array.from(seen.values());
};

export const updateRequestFieldBindings = (
  connection: Connection,
  methodColor: string,
  messageProperty: 'body' | 'header',
  bodyData: BodyEditData,
) => {
  const resultField = buildRequestResultField(messageProperty, bodyData.namespace || [], bodyData.name || '');
  const resultVar = `${methodColor}.(request).${resultField}`;
  const refs = getParsedReferences(typeof bodyData.newValue === 'string' ? bodyData.newValue : '');
  const current = (connection.fieldBindings || []).filter(
    (binding) => binding.enhancement?.args?.RESULT_VAR !== resultVar,
  );
  if (refs.length === 0) return { ...connection, fieldBindings: current };
  const previous = connection.fieldBindings.find(
    (binding) => binding.enhancement?.args?.RESULT_VAR === resultVar,
  );
  const next = buildBodyEnhancement(previous?.enhancement.enhanceId || createShortId(), resultVar, refs);
  const merged = previous
    ? {
        ...next,
        language: previous.enhancement.language,
        script: previous.enhancement.script,
        description: previous.enhancement.description,
      }
    : next;
  return { ...connection, fieldBindings: [...current, { enhancement: merged }] };
};

export const removeDeletedRequestBindings = (
  connection: Connection,
  methodColor: string,
  messageProperty: 'body' | 'header',
  body: unknown,
) => {
  const valid = new Set<string>();
  const visit = (value: unknown, namespace: string[] = [], name = '') => {
    if (typeof value === 'string' && getParsedReferences(value).length > 0 && name) {
      valid.add(`${methodColor}.(request).${buildRequestResultField(messageProperty, namespace, name)}`);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, [...namespace, name].filter(Boolean), String(index)));
      return;
    }
    if (value && typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(([key, nested]) => {
        visit(nested, [...namespace, name].filter(Boolean), key);
      });
    }
  };
  visit(body);
  return {
    ...connection,
    fieldBindings: (connection.fieldBindings || []).filter((binding) => {
      const resultVar = binding.enhancement?.args?.RESULT_VAR || '';
      return !resultVar.startsWith(`${methodColor}.(request).${messageProperty}.$`) || valid.has(resultVar);
    }),
  };
};

export const replaceRequestBindings = (
  connection: Connection,
  methodColor: string,
  messageProperty: 'body' | 'header',
  body: unknown,
) => {
  const untouched = (connection.fieldBindings || []).filter((binding) => {
    const resultVar = binding.enhancement?.args?.RESULT_VAR || '';
    return !resultVar.startsWith(`${methodColor}.(request).${messageProperty}.$`);
  });
  const rebuilt = collectEnhancementsFromObject(body, methodColor, messageProperty).map((enhancement) => ({ enhancement }));
  return { ...connection, fieldBindings: [...untouched, ...rebuilt] };
};

export const findRequestEnhancement = (
  connection: Connection | null,
  methodColor: string,
  namespace: string[],
  name: string,
  messageProperty: 'body' | 'header',
  value?: unknown,
) => {
  const resultVar = `${methodColor}.(request).${buildRequestResultField(messageProperty, namespace, name)}`;
  const exact = connection?.fieldBindings.find((binding) => binding.enhancement?.args?.RESULT_VAR === resultVar)?.enhancement;
  if (exact) return exact;

  const refs = getParsedReferences(typeof value === 'string' ? value : '');
  if (refs.length === 0) return undefined;
  const refValues = refs.map((reference) => `${reference.color}.(${reference.type}).${reference.field}`);
  const resultVarPrefix = `${methodColor}.(request).${messageProperty}.$`;

  // Recovers a binding whose exact RESULT_VAR path drifted (e.g. an array index shifted) by
  // re-anchoring on its source value(s) instead. Scoped to this same method+section and to an
  // exact var-count match — otherwise two unrelated fields that happen to share a source
  // reference (very common: the same response field feeding several different targets) would
  // match whichever binding appears first in the array, regardless of which field it's actually for.
  return connection?.fieldBindings.find((binding) => {
    const args = binding.enhancement?.args || {};
    if (!String(args.RESULT_VAR || '').startsWith(resultVarPrefix)) return false;
    const varCount = Object.keys(args).filter((key) => /^VAR_\d+$/.test(key)).length;
    if (varCount !== refValues.length) return false;
    return refValues.every((refValue, index) => args[`VAR_${index}`] === refValue);
  })?.enhancement;
};
