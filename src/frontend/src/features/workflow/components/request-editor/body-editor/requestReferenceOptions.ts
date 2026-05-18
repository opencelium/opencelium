import type { Connection, MethodWithId } from '../../../types/connection';

export type ResponseType = 'body' | 'header' | 'status';

export type ReferenceOption = { label: string; value: string };

const PATH_RE = /[^.[\]]+|\[\*]|\[\d+]|\[\w+]/g;

export const ITERATOR_NAMES = [
  'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'ii', 'ij', 'ik', 'il', 'im', 'in', 'io', 'ip', 'iq', 'ir', 'is', 'it', 'iu', 'iv', 'iw', 'ix', 'iy', 'iz',
];

const getSource = (method: MethodWithId | undefined, type: ResponseType) => {
  if (!method) return undefined;
  if (type === 'status') return 'status';
  if (type === 'header') return method.response?.success?.header;
  const body = method.response?.success?.body as any;
  if (body?.type === 'array' && !Array.isArray(body.fields)) return [body.fields ?? {}];
  return body?.fields;
};

const normalizePath = (path: string) => path.replace(/^\$\.?/, '');

const getArrayAccessIterator = (part: string) =>
  part.startsWith('[') && part.endsWith(']') ? part.slice(1, -1) : '';

const exactReadAtPath = (source: unknown, path: string, iterators: string[] = []) => {
  if (!path) return source;
  const parts = normalizePath(path).match(PATH_RE) || [];
  let current = source;
  for (const part of parts) {
    const iterator = getArrayAccessIterator(part);
    if (Array.isArray(current) && (part === '[0]' || part === '[*]' || iterators.includes(iterator))) {
      current = current[0];
      continue;
    }
    if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
      continue;
    }
    return undefined;
  }
  return current;
};

const appendPath = (base: string, part: string) => {
  if (base === '$') return part.startsWith('[') ? `$${part}` : `$.${part}`;
  return base ? `${base}${part.startsWith('[') ? '' : '.'}${part}` : part;
};

const getContext = (
  method: MethodWithId | undefined,
  type: ResponseType,
  currentPath = '',
  iterators: string[] = [],
): { node: unknown; lastValidPath: string } => {
  if (type === 'status') return { node: 'status', lastValidPath: 'status' };
  const source = getSource(method, type);
  const parts = normalizePath(currentPath).match(PATH_RE) || [];
  let current = source;
  let lastValidPath = currentPath === '$' || currentPath === '$.' ? '$' : '';

  for (const part of parts) {
    const iterator = getArrayAccessIterator(part);
    if (Array.isArray(current) && (part === '[0]' || part === '[*]' || iterators.includes(iterator))) {
      current = current[0];
      lastValidPath = appendPath(lastValidPath, part);
      continue;
    }
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
      lastValidPath = appendPath(lastValidPath, part);
      continue;
    }
    break;
  }

  return { node: current, lastValidPath };
};

export const getReferenceOptions = (
  method: MethodWithId | undefined,
  type: ResponseType,
  currentPath = '',
  iterators: string[] = [],
): ReferenceOption[] => {
  if (type === 'status') return [{ label: 'Response Status', value: 'status' }];
  const { node, lastValidPath } = getContext(method, type, currentPath, iterators);
  const options: ReferenceOption[] = [];

  if (!normalizePath(currentPath)) {
    options.push({ label: 'The root object', value: '$' });
  }

  if (Array.isArray(node)) {
    return [
      ...options,
      { label: 'First element of the array', value: appendPath(lastValidPath, '[0]') },
      { label: 'The whole array', value: appendPath(lastValidPath, '[*]') },
      ...iterators.map((iterator) => ({
        label: `(${iterator} loop)`,
        value: appendPath(lastValidPath, `[${iterator}]`),
      })),
    ];
  }

  if (node && typeof node === 'object') {
    options.push(...Object.keys(node as Record<string, unknown>).map((key) => ({
      label: key,
      value: appendPath(lastValidPath, key),
    })));
  }

  return options;
};

export const buildReferenceValue = (color: string, type: ResponseType, path: string) => {
  if (type === 'status') return `${color}.(response).status`;
  if (path === '$' || path === '$.') return `${color}.(response).${type}.$`;
  if (path.startsWith('$.') || path.startsWith('$[')) return `${color}.(response).${type}.${path}`;
  return path.startsWith('[') ? `${color}.(response).${type}.$${path}` : `${color}.(response).${type}.$.${path}`;
};

export const isExpandableReferencePath = (
  method: MethodWithId | undefined,
  type: ResponseType,
  path: string,
  iterators: string[] = [],
) => {
  if (type === 'status') return false;
  const source = getSource(method, type);
  const current = exactReadAtPath(source, path, iterators);
  return Array.isArray(current) || (!!current && typeof current === 'object');
};

const isChildIndex = (childIndex?: string, parentIndex?: string) =>
  !!childIndex && !!parentIndex && childIndex !== parentIndex && childIndex.startsWith(`${parentIndex}_`);

export const getIteratorsForIndex = (
  connection: Connection,
  targetIndex: string | undefined,
): string[] => {
  if (!targetIndex) return [];
  return connection.fromConnector.operator
    .filter((operator) => operator.type === 'loop' && isChildIndex(targetIndex, operator.index))
    .sort((left, right) => left.index.split('_').length - right.index.split('_').length)
    .map((operator, index) => (operator as any).iterator || ITERATOR_NAMES[index])
    .filter((iterator): iterator is string => !!iterator);
};

export const getIteratorsForMethod = (
  connection: Connection,
  method: MethodWithId | undefined,
): string[] => getIteratorsForIndex(connection, method?.index);
