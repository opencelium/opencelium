import type { OnSelectProps } from 'react-json-view';
import { hasOnlyReferences } from './bodyReference';

export type BodySelection = {
  namespace: string[];
  name: string;
  value: unknown;
  pathLabel: string;
};

export const getBodySelection = (select: OnSelectProps): BodySelection | null => {
  if (!select.name || select.type === 'object' || select.type === 'array') return null;
  const namespace = (select.namespace || []).filter(Boolean).map(String);
  const name = String(select.name);
  return {
    namespace,
    name,
    value: select.value,
    pathLabel: [...namespace, name].join('.'),
  };
};

const updateAtPath = (source: unknown, path: string[], value: unknown): unknown => {
  if (path.length === 0) return value;
  const [head, ...tail] = path;
  const isIndex = /^\d+$/.test(head);
  const base = Array.isArray(source) ? [...source] : { ...((source || {}) as Record<string, unknown>) };
  if (Array.isArray(base)) {
    const index = Number(head);
    base[index] = updateAtPath(base[index], tail, value);
    return base;
  }
  return { ...base, [head]: updateAtPath((base as Record<string, unknown>)[head], tail, value) };
};

export const setBodySelectionValue = (
  source: Record<string, unknown>,
  selection: BodySelection,
  value: unknown,
) => updateAtPath(source, [...selection.namespace, selection.name], value) as Record<string, unknown>;

export const getBodySelectionValue = (
  source: Record<string, unknown>,
  selection: BodySelection | null,
) => {
  if (!selection) return undefined;
  return [...selection.namespace, selection.name].reduce<unknown>((current, key) => {
    if (Array.isArray(current)) return current[Number(key)];
    if (current && typeof current === 'object') return (current as Record<string, unknown>)[key];
    return undefined;
  }, source);
};

export const mergeReferenceValue = (current: unknown, reference: string) => {
  if (typeof current !== 'string' || !current.trim()) return reference;
  if (!hasOnlyReferences(current)) return reference;
  return current.split(';').map((item) => item.trim()).includes(reference) ? current : `${current};${reference}`;
};
