import { createShortId } from '@shared/lib/createId';

type XmlAttributes = Record<string, string>;

export type XmlTreeNode = {
  id: string;
  name: string;
  text: string;
  attributes: XmlAttributes;
  children: XmlTreeNode[];
};

export type XmlSelection =
  | { nodeId: string; kind: 'text' }
  | { nodeId: string; kind: 'attribute'; attribute: string };

const ATTR = '__oc__attributes';
const VALUE = '__oc__value';

const createId = () => createShortId();

const normalizeObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const normalizeAttributes = (value: unknown): XmlAttributes =>
  Object.fromEntries(
    Object.entries(normalizeObject(value)).map(([key, item]) => [key, item == null ? '' : String(item)]),
  );

const toArray = (value: unknown) => (Array.isArray(value) ? value : [value]);

const parseNode = (name: string, raw: unknown): XmlTreeNode => {
  const object = normalizeObject(raw);
  const attributes = normalizeAttributes(object[ATTR]);
  const text = typeof object[VALUE] === 'string' ? object[VALUE] : '';
  const children: XmlTreeNode[] = [];
  Object.entries(object).forEach(([key, value]) => {
    if (key === ATTR || key === VALUE) return;
    toArray(value).forEach((item) => children.push(parseNode(key, item)));
  });
  return { id: createId(), name, text, attributes, children };
};

export const createTreeFromCompactXml = (value: unknown) => {
  const object = normalizeObject(value);
  const [rootName, rootValue] = Object.entries(object)[0] || ['root', { [VALUE]: '' }];
  return parseNode(rootName, rootValue);
};

const groupChildren = (children: XmlTreeNode[]) => {
  const next: Record<string, unknown> = {};
  children.forEach((child) => {
    const serialized = serializeTreeNode(child);
    if (next[child.name]) {
      next[child.name] = Array.isArray(next[child.name]) ? [...(next[child.name] as unknown[]), serialized] : [next[child.name], serialized];
      return;
    }
    next[child.name] = serialized;
  });
  return next;
};

export const serializeTreeNode = (node: XmlTreeNode): Record<string, unknown> => {
  const next: Record<string, unknown> = {};
  next[ATTR] = Object.keys(node.attributes).length ? node.attributes : null;
  if (node.text) next[VALUE] = node.text;
  Object.assign(next, groupChildren(node.children));
  if (!node.text && node.children.length === 0) next[VALUE] = null;
  return next;
};

export const serializeCompactXml = (node: XmlTreeNode) => ({ [node.name]: serializeTreeNode(node) });

export const updateNode = (root: XmlTreeNode, nodeId: string, updater: (node: XmlTreeNode) => XmlTreeNode): XmlTreeNode => {
  if (root.id === nodeId) return updater(root);
  return { ...root, children: root.children.map((child) => updateNode(child, nodeId, updater)) };
};

export const removeNode = (root: XmlTreeNode, nodeId: string): XmlTreeNode => ({
  ...root,
  children: root.children.filter((child) => child.id !== nodeId).map((child) => removeNode(child, nodeId)),
});

export const addChildNode = (root: XmlTreeNode, parentId: string): XmlTreeNode =>
  updateNode(root, parentId, (node) => ({
    ...node,
    children: [...node.children, { id: createId(), name: 'tag', text: '', attributes: {}, children: [] }],
  }));

export const findNodePath = (root: XmlTreeNode, nodeId: string, path: string[] = []): string[] | null => {
  const nextPath = [...path, root.name];
  if (root.id === nodeId) return nextPath;
  for (const child of root.children) {
    const found = findNodePath(child, nodeId, nextPath);
    if (found) return found;
  }
  return null;
};

export const getSelectedValue = (root: XmlTreeNode, selection: XmlSelection | null): string => {
  if (!selection) return '';
  let value = '';
  updateNode(root, selection.nodeId, (node) => {
    value = selection.kind === 'text' ? node.text : node.attributes[selection.attribute] || '';
    return node;
  });
  return value;
};

export const applySelectionValue = (root: XmlTreeNode, selection: XmlSelection, value: string): XmlTreeNode =>
  updateNode(root, selection.nodeId, (node) => {
    if (selection.kind === 'text') return { ...node, text: value };
    return { ...node, attributes: { ...node.attributes, [selection.attribute]: value } };
  });
