import { createShortId } from '@shared/lib/createId';
import type { Connection } from '../../../types/connection';
import { buildBodyEnhancement, buildRequestResultField, getParsedReferences } from './bodyReference';
import { collectEnhancementsFromObject } from './bodyBindingCollection';
import type { BodyEditData, RequestMessageProperty } from './bodyBinding.types';

export const updateRequestFieldBindings = (
  connection: Connection,
  methodColor: string,
  messageProperty: RequestMessageProperty,
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
  const merged = previous ? {
    ...next,
    language: previous.enhancement.language,
    script: previous.enhancement.script,
    description: previous.enhancement.description,
  } : next;
  return { ...connection, fieldBindings: [...current, { enhancement: merged }] };
};

export const removeDeletedRequestBindings = (
  connection: Connection,
  methodColor: string,
  messageProperty: RequestMessageProperty,
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
      Object.entries(value as Record<string, unknown>).forEach(([key, nested]) =>
        visit(nested, [...namespace, name].filter(Boolean), key));
    }
  };
  visit(body);
  const prefix = `${methodColor}.(request).${messageProperty}.$`;
  return {
    ...connection,
    fieldBindings: (connection.fieldBindings || []).filter((binding) => {
      const resultVar = binding.enhancement?.args?.RESULT_VAR || '';
      return !resultVar.startsWith(prefix) || valid.has(resultVar);
    }),
  };
};

export const replaceRequestBindings = (
  connection: Connection,
  methodColor: string,
  messageProperty: RequestMessageProperty,
  body: unknown,
) => {
  const prefix = `${methodColor}.(request).${messageProperty}.$`;
  const untouched = (connection.fieldBindings || []).filter((binding) =>
    !(binding.enhancement?.args?.RESULT_VAR || '').startsWith(prefix));
  const rebuilt = collectEnhancementsFromObject(body, methodColor, messageProperty)
    .map((enhancement) => ({ enhancement }));
  return { ...connection, fieldBindings: [...untouched, ...rebuilt] };
};
