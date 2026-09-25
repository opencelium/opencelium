import type { MethodWithId } from '../../../types/connection';
import type { ResponseType } from './requestReferenceOptions';

const PATH_RE = /\['(?:\\'|[^'])*']|\["(?:\\"|[^"])*"]|\[[^\]]+]|[^.[\]]+/g;

export const getReferenceSource = (method: MethodWithId | undefined, type: ResponseType) => {
  if (!method) return undefined;
  if (type === 'status') return 'status';
  if (type === 'header') return method.response?.success?.header;
  const body = method.response?.success?.body as any;
  if (body?.type === 'array' && !Array.isArray(body.fields)) return [body.fields ?? {}];
  return body?.fields;
};

export const normalizeReferencePath = (path: string) => path.replace(/^\$\.?/, '');
export const isRootReferencePath = (path: string) => path === '$' || path === '$.';

const unquotePathPart = (part: string) => {
  const singleQuoted = part.match(/^\['((?:\\'|[^'])*)']$/);
  if (singleQuoted) return singleQuoted[1].replace(/\\'/g, "'");
  const doubleQuoted = part.match(/^\["((?:\\"|[^"])*)"]$/);
  if (doubleQuoted) return doubleQuoted[1].replace(/\\"/g, '"');
  return part;
};

const isBracketPathPart = (part: string) => part.startsWith('[') && part.endsWith(']');
const isArrayPathPart = (part: string) =>
  isBracketPathPart(part) && !part.startsWith("['") && !part.startsWith('["');
const serializeObjectKey = (key: string) =>
  /^[A-Za-z_][A-Za-z0-9_-]*$/.test(key)
    ? key
    : `['${key.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}']`;
const getArrayAccessIterator = (part: string) =>
  isArrayPathPart(part) ? part.slice(1, -1) : '';

export const isReferenceRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
export const isReferenceArray = (value: unknown) =>
  Array.isArray(value) || (isReferenceRecord(value) && value.type === 'array' && 'fields' in value);

const getArrayItem = (value: unknown) => {
  if (Array.isArray(value)) return value[0];
  if (isReferenceRecord(value) && value.type === 'array') {
    const fields = value.fields;
    return Array.isArray(fields) ? fields[0] : fields;
  }
  return undefined;
};

export const readReferencePath = (source: unknown, path: string, iterators: string[] = []) => {
  if (!path) return source;
  const parts = normalizeReferencePath(path).match(PATH_RE) || [];
  let current = source;
  for (const part of parts) {
    const iterator = getArrayAccessIterator(part);
    if (isReferenceArray(current) && (part === '[0]' || part === '[*]' || iterators.includes(iterator))) {
      current = getArrayItem(current);
      continue;
    }
    if (isReferenceRecord(current)) {
      current = current[unquotePathPart(part)];
      continue;
    }
    return undefined;
  }
  return current;
};

export const appendReferencePath = (base: string, part: string) => {
  const serializedPart = isArrayPathPart(part) ? part : serializeObjectKey(unquotePathPart(part));
  if (base === '$') return `$.${serializedPart}`;
  return base ? `${base}${isArrayPathPart(serializedPart) ? '' : '.'}${serializedPart}` : serializedPart;
};

export const normalizeRootArrayPath = (path: string) => {
  if (path.startsWith('$[')) return `$.${path.slice(1)}`;
  if (path.startsWith('[')) return `$.${path}`;
  return path;
};

export const getReferenceContext = (
  method: MethodWithId | undefined,
  type: ResponseType,
  currentPath = '',
  iterators: string[] = [],
): { node: unknown; lastValidPath: string } => {
  if (type === 'status') return { node: 'status', lastValidPath: 'status' };
  const parts = normalizeReferencePath(currentPath).match(PATH_RE) || [];
  let current = getReferenceSource(method, type);
  let lastValidPath = isRootReferencePath(currentPath) ? '$' : '';
  for (const part of parts) {
    const iterator = getArrayAccessIterator(part);
    if (isReferenceArray(current) && (part === '[0]' || part === '[*]' || iterators.includes(iterator))) {
      current = getArrayItem(current);
      lastValidPath = appendReferencePath(lastValidPath, part);
      continue;
    }
    const objectKey = unquotePathPart(part);
    if (isReferenceRecord(current) && objectKey in current) {
      current = current[objectKey];
      lastValidPath = appendReferencePath(lastValidPath, objectKey);
      continue;
    }
    break;
  }
  return { node: current, lastValidPath };
};
