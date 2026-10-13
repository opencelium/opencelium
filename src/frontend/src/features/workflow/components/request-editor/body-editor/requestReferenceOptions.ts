import { MethodType, OperatorType, type Connection, type LoopOperatorWithId, type MethodWithId, type OperatorWithId } from '../../../types/connection';

export type ResponseType = 'body' | 'header' | 'status';

export type ReferenceOption = { label: string; value: string };

// Reverse a reference's color back to the method it points at. Case-
// insensitive and '#'-stripped on both sides since the two reference parsers
// in this codebase (parseEnhancementArg.ts vs body-editor/bodyReference.ts)
// disagree on whether the leading '#' is part of the captured color.
export const findMethodByColor = (
  methods: MethodWithId[],
  color: string,
): MethodWithId | undefined => {
  const normalized = color.replace(/^#/, '').toLowerCase();
  return methods.find((method) => method.color?.replace(/^#/, '').toLowerCase() === normalized);
};

export const getMethodConnectorTitle = (method: MethodWithId) =>
  method.connector?.title ?? 'HTTP Request';

export const getMethodConnectorIcon = (method: MethodWithId) =>
  method.connector?.icon ?? null;

// Method pickers show a "which connector/source is this method from" chip. A `WEBHOOK`
// (trigger-connection) method has no connector — its chip shows a generic "Webhook" label
// and the webhook icon, plus a hint that the response is only the trigger acknowledgement,
// not the result of the workflow it triggers (referencing the ack's own status/body is
// still valid, so it isn't filtered out of the picker).
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
      return { kind: 'connector', title: getMethodConnectorTitle(method), iconUrl: getMethodConnectorIcon(method) };
    default: {
      const _exhaustive: never = method.methodType;
      return _exhaustive;
    }
  }
};

const PATH_RE = /\['(?:\\'|[^'])*']|\["(?:\\"|[^"])*"]|\[[^\]]+]|[^.[\]]+/g;

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

const isRootPath = (path: string) => path === '$' || path === '$.';

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const isArrayNode = (value: unknown) =>
  Array.isArray(value) || (isRecord(value) && value.type === 'array' && 'fields' in value);

const getArrayItem = (value: unknown) => {
  if (Array.isArray(value)) return value[0];
  if (isRecord(value) && value.type === 'array') {
    const fields = value.fields;
    return Array.isArray(fields) ? fields[0] : fields;
  }
  return undefined;
};

const OBJECT_WILDCARD = '*';
// OpenCelium's own operator (not JsonPath): resolves to the field names of the
// object the path points at. The backend only honours it as the last segment.
const KEY_NAMES_SUFFIX = "['*']~";

const isObjectNode = (value: unknown): value is Record<string, unknown> =>
  isRecord(value) && !isArrayNode(value);

const isArrayAccessPart = (part: string, iterators: string[]) =>
  part === '[0]' || part === '[*]' || iterators.includes(getArrayAccessIterator(part));

// A `*` segment fans out over every child of an object, so a path no longer
// points at one node but at a set of them; later segments apply to each match
// and non-matching ones (e.g. primitives under `*`) simply drop out.
const stepNodes = (nodes: unknown[], part: string, iterators: string[]): unknown[] => {
  if (part === OBJECT_WILDCARD) return nodes.filter(isObjectNode).flatMap((node) => Object.values(node));
  if (isArrayAccessPart(part, iterators) && nodes.some(isArrayNode)) {
    return nodes.filter(isArrayNode).map(getArrayItem);
  }
  const key = unquotePathPart(part);
  return nodes.filter(isRecord).filter((node) => key in node).map((node) => node[key]);
};

const readNodesAtPath = (source: unknown, path: string, iterators: string[] = []) => {
  const parts = normalizePath(path).match(PATH_RE) || [];
  return parts.reduce<unknown[]>((nodes, part) => stepNodes(nodes, part, iterators), [source]);
};

const appendPath = (base: string, part: string) => {
  const serializedPart = isArrayPathPart(part) || part === OBJECT_WILDCARD
    ? part
    : serializeObjectKey(unquotePathPart(part));
  if (base === '$') return `$.${serializedPart}`;
  return base ? `${base}${isArrayPathPart(serializedPart) ? '' : '.'}${serializedPart}` : serializedPart;
};

// The backend reads the base of `['*']~` with JsonPath; any multi-match segment
// makes that base a list, which has no field names.
const isSingleMatchPath = (path: string) =>
  !(normalizePath(path).match(PATH_RE) || []).some((part) => part === OBJECT_WILDCARD || part === '[*]');

const normalizeRootArrayPath = (path: string) => {
  if (path.startsWith('$[')) return `$.${path.slice(1)}`;
  if (path.startsWith('[')) return `$.${path}`;
  return path;
};

const getContext = (
  method: MethodWithId | undefined,
  type: ResponseType,
  currentPath = '',
  iterators: string[] = [],
): { nodes: unknown[]; lastValidPath: string } => {
  if (type === 'status') return { nodes: ['status'], lastValidPath: 'status' };
  const parts = normalizePath(currentPath).match(PATH_RE) || [];
  let nodes: unknown[] = [getSource(method, type)];
  let lastValidPath = currentPath === '$' || currentPath === '$.' ? '$' : '';

  for (const part of parts) {
    const nextNodes = stepNodes(nodes, part, iterators);
    if (nextNodes.length === 0) break;
    nodes = nextNodes;
    lastValidPath = appendPath(lastValidPath, isArrayPathPart(part) ? part : unquotePathPart(part));
  }

  return { nodes, lastValidPath };
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
  const { nodes, lastValidPath } = getContext(method, type, currentPath, iterators);
  const options: ReferenceOption[] = [];

  if (!normalizePath(currentPath)) {
    options.push({ label: t('references.rootObject'), value: '$' });
  }

  if (nodes.length > 0 && nodes.every(isArrayNode)) {
    return [
      ...options,
      { label: t('references.firstArrayElement'), value: appendPath(lastValidPath, '[0]') },
      { label: t('references.wholeArray'), value: appendPath(lastValidPath, '[*]') },
      ...iterators.map((iterator) => ({
        label: t('references.iteratorLoop', { iterator }),
        value: appendPath(lastValidPath, `[${iterator}]`),
      })),
    ];
  }

  if (nodes.length === 1 && isObjectNode(nodes[0]) && isSingleMatchPath(lastValidPath)) {
    options.push({ label: t('references.allKeyNames'), value: `${lastValidPath}${KEY_NAMES_SUFFIX}` });
  }

  const keys = new Set(nodes.filter(isObjectNode).flatMap((node) => Object.keys(node)));
  options.push(...[...keys].map((key) => ({
    label: key,
    value: appendPath(lastValidPath, key),
  })));

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
  if (type === 'status') return false;
  if (isRootPath(path)) return false;
  const source = getSource(method, type);
  return readNodesAtPath(source, path, iterators).some((node) => isArrayNode(node) || isRecord(node));
};

const parseIndexPath = (value: unknown) =>
  String(value ?? '')
    .split('_')
    .map((part) => Number(part))
    .map((part) => (Number.isFinite(part) ? part : 0));

const compareIndex = (left?: unknown, right?: unknown) => {
  const leftPath = parseIndexPath(left);
  const rightPath = parseIndexPath(right);
  const length = Math.max(leftPath.length, rightPath.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = leftPath[index] ?? -1;
    const rightPart = rightPath[index] ?? -1;
    if (leftPart !== rightPart) return leftPart - rightPart;
  }

  return leftPath.length - rightPath.length;
};

const isLoopOperator = (operator: OperatorWithId | undefined): operator is LoopOperatorWithId =>
  operator?.type === OperatorType.Loop;

export const getIteratorsForIndex = (
  connection: Connection,
  targetIndex: string | undefined,
): string[] => {
  if (!targetIndex) return [];
  const splitMethodIndex = targetIndex.split('_');
  const previousOperatorIndex = splitMethodIndex.length === 1 ? '-1' : splitMethodIndex.slice(0, -1).join('_');
  const operators = [...connection.fromConnector.operator].sort((left, right) => compareIndex(left.index, right.index));
  let previousOperatorArrayIndex = operators.findIndex((operator) => operator.index === previousOperatorIndex);

  if (previousOperatorArrayIndex === -1) return [];

  while (true) {
    if (operators[previousOperatorArrayIndex]?.type === 'loop') break;
    if (previousOperatorArrayIndex === 0) break;
    previousOperatorArrayIndex -= 1;
  }

  const previousOperator = operators[previousOperatorArrayIndex];
  const iteratorName = isLoopOperator(previousOperator) ? previousOperator.iterator : undefined;
  if (!iteratorName) return [];
  if (ITERATOR_NAMES.indexOf(iteratorName) === -1) return [];

  const previousIterators: string[] = [];
  for (const iterator of ITERATOR_NAMES) {
    previousIterators.push(iterator);
    if (iterator === iteratorName) break;
  }
  return previousIterators;
};

export const getIteratorsForMethod = (
  connection: Connection,
  method: MethodWithId | undefined,
): string[] => getIteratorsForIndex(connection, method?.index);

// Walks `path` against an ACTUAL captured value (a real, already-parsed JSON
// response — not the static sample response the picker/readNodesAtPath peek
// at) to extract the exact value a reference resolves to while debugging a
// paused test run (see useLiveReferenceValue.ts). Same path grammar as
// readNodesAtPath, but different bracket semantics: that function always
// takes element 0 (correct for shape-discovery — it only needs to know what
// fields exist further down), whereas this one is producing a real value a
// user will read, so `[*]` must return the WHOLE array and `[<iteratorName>]`
// must return the element at that iterator's CURRENT iteration index, not
// always the first one. `resolveIteratorIndex` maps an iterator name (as it
// appears inside the path) to its current 0-based index, or null if the name
// isn't a real, currently-known iterator (in which case the lookup bails
// rather than guessing element 0).
export const readLiveValueAtPath = (
  source: unknown,
  path: string,
  resolveIteratorIndex: (iteratorName: string) => number | null,
): unknown => {
  if (!path) return source;
  if (path.endsWith(KEY_NAMES_SUFFIX)) {
    const base = readLiveValueAtPath(source, path.slice(0, -KEY_NAMES_SUFFIX.length), resolveIteratorIndex);
    return isRecord(base) ? Object.keys(base) : undefined;
  }
  const parts = normalizePath(path).match(PATH_RE) || [];
  let current: unknown = source;
  for (const part of parts) {
    if (isArrayPathPart(part)) {
      if (!Array.isArray(current)) return undefined;
      if (part === '[*]') continue;
      const index = part === '[0]' ? 0 : resolveIteratorIndex(getArrayAccessIterator(part));
      if (index === null || index === undefined) return undefined;
      current = current[index];
      continue;
    }
    if (isRecord(current)) {
      current = current[unquotePathPart(part)];
      continue;
    }
    return undefined;
  }
  return current;
};
