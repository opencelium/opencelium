import { createShortId } from '@shared/lib/createId';
import {
  isPlainObject,
  XML_ATTRIBUTES,
  XML_TEXT,
  xmlAttributesOf,
  xmlChildEntries,
  xmlRootEntry,
  xmlTextOf,
} from '../../../../utils/xmlBody';

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

const createId = () => createShortId();

const normalizeAttributes = (value: Record<string, unknown> | null): XmlAttributes =>
  Object.fromEntries(Object.entries(value ?? {}).map(([key, item]) => [key, item == null ? '' : String(item)]));

const parseNode = (name: string, raw: unknown): XmlTreeNode => {
  const fields = isPlainObject(raw) ? raw : {};
  return {
    id: createId(),
    name,
    text: xmlTextOf(raw),
    attributes: normalizeAttributes(xmlAttributesOf(fields)),
    children: xmlChildEntries(fields).map(([key, item]) => parseNode(key, item)),
  };
};

export const createTreeFromCompactXml = (value: unknown) => {
  const [rootName, rootValue] = xmlRootEntry(isPlainObject(value) ? value : {}) || ['root', { [XML_TEXT]: '' }];
  return parseNode(rootName, rootValue);
};

/** Text next to child elements: the backend cannot send it, the editor asks to clear it. */
export const hasMixedText = (node: XmlTreeNode) => node.children.length > 0 && !!node.text.trim();

const groupChildren = (children: XmlTreeNode[]) => {
  const next: Record<string, unknown> = {};
  children.forEach((child) => {
    const serialized = serializeTreeNode(child);
    if (Object.hasOwn(next, child.name)) {
      next[child.name] = Array.isArray(next[child.name]) ? [...(next[child.name] as unknown[]), serialized] : [next[child.name], serialized];
      return;
    }
    next[child.name] = serialized;
  });
  return next;
};

export const serializeTreeNode = (node: XmlTreeNode): Record<string, unknown> => {
  const next: Record<string, unknown> = {};
  next[XML_ATTRIBUTES] = Object.keys(node.attributes).length ? node.attributes : null;
  if (node.text) next[XML_TEXT] = node.text;
  Object.assign(next, groupChildren(node.children));
  // An empty text, not null: the backend writes a null value as the text "null".
  if (!node.text && node.children.length === 0) next[XML_TEXT] = '';
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
