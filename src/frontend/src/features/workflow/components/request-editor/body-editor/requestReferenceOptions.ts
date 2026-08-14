import { MethodType, type MethodWithId } from '../../../types/connection';
import {
  appendReferencePath,
  getReferenceContext,
  getReferenceSource,
  isReferenceArray,
  isReferenceRecord,
  isRootReferencePath,
  normalizeReferencePath,
  normalizeRootArrayPath,
  readReferencePath,
} from './requestReferencePath';

export { ITERATOR_NAMES, getIteratorsForIndex, getIteratorsForMethod } from './requestReferenceIterators';

export type ResponseType = 'body' | 'header' | 'status';
export type ReferenceOption = { label: string; value: string };

export const getMethodConnectorTitle = (method: MethodWithId) =>
  method.connector?.title ?? 'HTTP Request';
export const getMethodConnectorIcon = (method: MethodWithId) => method.connector?.icon ?? null;

export type MethodConnectorChipInfo =
  | { kind: 'connector'; title: string; iconUrl: string | null }
  | { kind: 'http-request'; title: string }
  | { kind: 'webhook'; title: string };

export const getMethodConnectorChipInfo = (method: MethodWithId): MethodConnectorChipInfo => {
  switch (method.methodType) {
    case MethodType.Webhook:
      return { kind: 'webhook', title: 'Webhook' };
    case MethodType.HttpRequest:
      return { kind: 'http-request', title: getMethodConnectorTitle(method) };
    case MethodType.Connector:
      return {
        kind: 'connector',
        title: getMethodConnectorTitle(method),
        iconUrl: getMethodConnectorIcon(method),
      };
    default: {
      const exhaustive: never = method.methodType;
      return exhaustive;
    }
  }
};

type ReferenceLabelT = (key: string, values?: Record<string, unknown>) => string;

export const getReferenceOptions = (
  method: MethodWithId | undefined,
  type: ResponseType,
  currentPath = '',
  iterators: string[] = [],
  t: ReferenceLabelT = (key) => key,
): ReferenceOption[] => {
  if (type === 'status') return [{ label: t('references.responseStatus'), value: 'status' }];
  const { node, lastValidPath } = getReferenceContext(method, type, currentPath, iterators);
  const options: ReferenceOption[] = [];
  if (!normalizeReferencePath(currentPath)) {
    options.push({ label: t('references.rootObject'), value: '$' });
  }
  if (isReferenceArray(node)) {
    return [
      ...options,
      { label: t('references.firstArrayElement'), value: appendReferencePath(lastValidPath, '[0]') },
      { label: t('references.wholeArray'), value: appendReferencePath(lastValidPath, '[*]') },
      ...iterators.map((iterator) => ({
        label: t('references.iteratorLoop', { iterator }),
        value: appendReferencePath(lastValidPath, `[${iterator}]`),
      })),
    ];
  }
  if (isReferenceRecord(node)) {
    options.push(...Object.keys(node).map((key) => ({
      label: key,
      value: appendReferencePath(lastValidPath, key),
    })));
  }
  return options;
};

export const buildReferenceValue = (color: string, type: ResponseType, path: string) => {
  const normalizedPath = normalizeRootArrayPath(path);
  if (type === 'status') return `${color}.(response).status`;
  if (normalizedPath === '$') return `${color}.(response).${type}.$`;
  if (normalizedPath.startsWith('$.')) return `${color}.(response).${type}.${normalizedPath}`;
  return `${color}.(response).${type}.$.${normalizedPath}`;
};

export const isExpandableReferencePath = (
  method: MethodWithId | undefined,
  type: ResponseType,
  path: string,
  iterators: string[] = [],
) => {
  if (type === 'status' || isRootReferencePath(path)) return false;
  const current = readReferencePath(getReferenceSource(method, type), path, iterators);
  return isReferenceArray(current) || isReferenceRecord(current);
};
