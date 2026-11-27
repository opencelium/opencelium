import { xml2js } from 'xml-js';

/**
 * An XML body is stored "compact": element name -> { __oc__attributes, __oc__value, ...children },
 * repeated names as arrays. Bodies saved by older versions may use xml-js's own `_attributes` /
 * `_text` and carry document keys such as `_declaration`; those are read, never written.
 */
export const XML_ATTRIBUTES = '__oc__attributes';
export const XML_TEXT = '__oc__value';
const LEGACY_ATTRIBUTES = '_attributes';
const LEGACY_TEXT = '_text';
export const XML_DOCUMENT_KEYS = ['_declaration', '_comment', '_instruction', '_doctype', '_cdata'];
/** Names an element cannot have, because the stored format or JavaScript gives them a meaning. */
export const XML_RESERVED_NAMES = [XML_ATTRIBUTES, XML_TEXT, LEGACY_ATTRIBUTES, LEGACY_TEXT, ...XML_DOCUMENT_KEYS, '__proto__'];
/** Deeper bodies are refused rather than risking a stack overflow while reading or writing them. */
export const XML_MAX_DEPTH = 200;
const XML_NAME_RE = /^[\p{L}_][\p{L}\p{N}._-]*(?::[\p{L}_][\p{L}\p{N}._-]*)?$/u;

export type XmlNameCheck = 'valid' | 'invalid' | 'reserved';
export const checkXmlName = (name: string): XmlNameCheck =>
  XML_RESERVED_NAMES.includes(name) ? 'reserved' : XML_NAME_RE.test(name) ? 'valid' : 'invalid';

export type XmlBodyError =
  | { kind: 'empty' | 'invalid' | 'multipleRoots' | 'mixedContent' | 'interleaved' | 'tooDeep' }
  | { kind: 'reservedName'; name: string };
export type XmlBodyParse = { ok: true; fields: Record<string, unknown> } | { ok: false; error: XmlBodyError };
type ElementParse = XmlBodyParse;

type XmlElement = {
  type?: string;
  name?: string;
  text?: string | number;
  cdata?: string;
  attributes?: Record<string, string>;
  elements?: XmlElement[];
};

export const escapeXmlText = (value: string) => value.replace(/&/g, '&amp;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttribute = (value: string) => escapeXmlText(value).replace(/"/g, '&quot;')
  .replace(/\t/g, '&#x9;').replace(/\n/g, '&#xA;').replace(/\r/g, '&#xD;');
export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const objectOf = (value: unknown): Record<string, unknown> => isPlainObject(value) ? value : {};
const textOf = (value: unknown) => value == null ? '' : String(value);
const isPrimitive = (value: unknown) => ['string', 'number', 'boolean'].includes(typeof value);

/** The attributes of a stored element; legacy `_attributes` only when it really is an attribute map. */
export const xmlAttributesOf = (fields: Record<string, unknown>): Record<string, unknown> | null =>
  isPlainObject(fields[XML_ATTRIBUTES]) ? fields[XML_ATTRIBUTES] as Record<string, unknown>
    : isPlainObject(fields[LEGACY_ATTRIBUTES]) ? fields[LEGACY_ATTRIBUTES] as Record<string, unknown> : null;

/** The text of a stored element; a primitive stored directly in place of the element is its text. */
export const xmlTextOf = (raw: unknown): string => {
  if (isPrimitive(raw)) return String(raw);
  const fields = objectOf(raw);
  const value = fields[XML_TEXT] ?? (isPrimitive(fields[LEGACY_TEXT]) || Array.isArray(fields[LEGACY_TEXT]) ? fields[LEGACY_TEXT] : undefined);
  return Array.isArray(value) ? value.map(textOf).join('') : textOf(value);
};

const isMetaKey = (fields: Record<string, unknown>, key: string) => key === XML_ATTRIBUTES || key === XML_TEXT
  || XML_DOCUMENT_KEYS.includes(key)
  || (key === LEGACY_ATTRIBUTES && isPlainObject(fields[key]))
  || (key === LEGACY_TEXT && (isPrimitive(fields[key]) || Array.isArray(fields[key])));

/** The child elements of a stored element, in stored order, repeated names unrolled. */
export const xmlChildEntries = (fields: Record<string, unknown>): [string, unknown][] =>
  Object.entries(fields).filter(([key]) => !isMetaKey(fields, key))
    .flatMap(([key, child]) => (Array.isArray(child) ? child : [child]).map((item): [string, unknown] => [key, item]));

/** The root element of a stored body, skipping document keys an older version may have stored. */
export const xmlRootEntry = (document: Record<string, unknown>) =>
  Object.entries(document).find(([key]) => !XML_DOCUMENT_KEYS.includes(key));

const compactElement = (element: XmlElement, depth: number): ElementParse => {
  if (depth > XML_MAX_DEPTH) return { ok: false, error: { kind: 'tooDeep' } };
  const fields: Record<string, unknown> = { [XML_ATTRIBUTES]: element.attributes ?? null };
  const children = (element.elements ?? []).filter(child => child.type === 'element');
  let text = '';
  for (const child of element.elements ?? []) {
    if (child.type === 'element') {
      const name = child.name!;
      if (XML_RESERVED_NAMES.includes(name)) return { ok: false, error: { kind: 'reservedName', name } };
      const next = compactElement(child, depth + 1);
      if (!next.ok) return next;
      if (Object.hasOwn(fields, name)) {
        fields[name] = Array.isArray(fields[name]) ? [...fields[name] as unknown[], next.fields] : [fields[name], next.fields];
      } else fields[name] = next.fields;
    } else if (child.type === 'text' || child.type === 'cdata') {
      text += textOf(child.type === 'cdata' ? child.cdata : child.text);
    }
  }
  // The body format holds either a text or child elements; whitespace between elements is layout.
  if (children.length && text.trim()) return { ok: false, error: { kind: 'mixedContent' } };
  // An empty text, not null: the backend writes a null value as the text "null".
  if (!children.length) fields[XML_TEXT] = text;
  const order = children.map(child => child.name!);
  const grouped = Object.keys(fields).filter(key => key !== XML_ATTRIBUTES && key !== XML_TEXT)
    .flatMap(key => Array(Array.isArray(fields[key]) ? fields[key].length : 1).fill(key));
  if (order.some((key, index) => key !== grouped[index])) return { ok: false, error: { kind: 'interleaved' } };
  return { ok: true, fields };
};

// Chrome reports parse errors in the XHTML namespace, Firefox in its own, so look for the element by
// name, and only count those the text did not contain itself.
const hasBrowserParseError = (xml: string) =>
  new DOMParser().parseFromString(xml, 'application/xml').getElementsByTagName('parsererror').length
    > (xml.match(/<([\p{L}_][\p{L}\p{N}._-]*:)?parsererror[\s/>]/gu)?.length ?? 0);

/**
 * The XML text as the body's fields. The `<?xml …?>` declaration, comments and processing
 * instructions are left out: the backend writes the body from exactly one top-level key.
 */
export function parseXmlBody(xml: string): XmlBodyParse {
  if (!xml.trim()) return { ok: false, error: { kind: 'empty' } };
  let document: { elements?: XmlElement[] };
  try {
    document = xml2js(xml, { compact: false, captureSpacesBetweenElements: true }) as { elements?: XmlElement[] };
  } catch {
    return { ok: false, error: { kind: 'invalid' } };
  }
  const nodes = document.elements ?? [];
  const roots = nodes.filter(element => element.type === 'element');
  if (!roots.length) return { ok: false, error: { kind: 'empty' } };
  if (roots.length > 1 || nodes.some(element => element.type === 'text' && textOf(element.text).trim())) {
    return { ok: false, error: { kind: 'multipleRoots' } };
  }
  // After the root count, which the browser would only report as invalid.
  if (hasBrowserParseError(xml)) return { ok: false, error: { kind: 'invalid' } };
  const name = roots[0].name!;
  if (XML_RESERVED_NAMES.includes(name)) return { ok: false, error: { kind: 'reservedName', name } };
  const root = compactElement(roots[0], 1);
  return root.ok ? { ok: true, fields: { [name]: root.fields } } : root;
}

const writeAttributes = (attributes: Record<string, unknown> | null) => Object.entries(attributes ?? {}).map(
  ([key, item]) => ` ${key}="${escapeAttribute(textOf(item))}"`).join('');

const writeElement = (name: string, raw: unknown, depth: number, isInline = false): string => {
  const fields = objectOf(raw);
  const children = xmlChildEntries(fields);
  const content = escapeXmlText(xmlTextOf(raw));
  const open = `<${name}${writeAttributes(xmlAttributesOf(fields))}`;
  if (!children.length) return content ? `${open}>${content}</${name}>` : `${open}/>`;
  if (isInline || content) {
    return `${open}>${content}${children.map(([child, value]) => writeElement(child, value, depth + 1, true)).join('')}</${name}>`;
  }
  const indent = '  '.repeat(depth);
  const lines = children.map(([child, value]) => `${indent}  ${writeElement(child, value, depth + 1)}`);
  return `${open}>\n${lines.join('\n')}\n${indent}</${name}>`;
};

/** The stored body as indented XML text; text that is not a stored body is shown as it is. */
export function serializeXmlBody(body: unknown): string {
  if (typeof body === 'string') {
    const parsed = parseXmlBody(body);
    return parsed.ok ? serializeXmlBody(parsed.fields) : body;
  }
  const root = xmlRootEntry(objectOf(body));
  return root ? writeElement(root[0], root[1], 0) : '';
}
