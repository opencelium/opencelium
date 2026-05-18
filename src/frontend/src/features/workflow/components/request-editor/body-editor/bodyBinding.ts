import { type Connection, type Enhancement } from '../../../types/connection';
import { buildBodyEnhancement, buildRequestResultField, getParsedReferences } from './bodyReference';

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
        const id = crypto.randomUUID().slice(0, 8);
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
  const next = buildBodyEnhancement(previous?.enhancement.enhanceId || crypto.randomUUID().slice(0, 8), resultVar, refs);
  return { ...connection, fieldBindings: [...current, { enhancement: next }] };
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
) => {
  const resultVar = `${methodColor}.(request).${buildRequestResultField(messageProperty, namespace, name)}`;
  return connection?.fieldBindings.find((binding) => binding.enhancement?.args?.RESULT_VAR === resultVar)?.enhancement;
};
