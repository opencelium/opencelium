import { xml2js } from 'xml-js';

export const XML_ATTRIBUTES = '__oc__attributes';
export const XML_TEXT = '__oc__value';
const DOCUMENT_METADATA = ['_declaration', '_comment', '_instruction', '_doctype'];
export const xmlRootEntry = (document: Record<string, unknown>) =>
  Object.entries(document).find(([key]) => !DOCUMENT_METADATA.includes(key));

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
const objectOf = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const textOf = (value: unknown) => value == null ? '' : String(value);

export const xmlChildEntries = (value: Record<string, unknown>): [string, unknown][] => {
  const entries = Object.entries(value).filter(([key]) => ![
    XML_ATTRIBUTES, XML_TEXT, '_attributes', '_text', '_declaration', '_comment',
  ].includes(key)).flatMap(([key, child]) => (Array.isArray(child) ? child : [child]).map(
    (item): [string, unknown] => [key, item]));
  return entries;
};

const compactElement = (element: XmlElement): Record<string, unknown> => {
  const fields: Record<string, unknown> = { [XML_ATTRIBUTES]: element.attributes ?? null };
  const children = (element.elements ?? []).filter(child => child.type === 'element');
  const segments = [''];
  for (const child of element.elements ?? []) {
    if (child.type === 'element') {
      const name = child.name!;
      const next = compactElement(child);
      if (Object.hasOwn(fields, name)) {
        fields[name] = Array.isArray(fields[name]) ? [...fields[name] as unknown[], next] : [fields[name], next];
      } else fields[name] = next;
      segments.push('');
    } else if (child.type === 'text' || child.type === 'cdata') {
      segments[segments.length - 1] += textOf(child.type === 'cdata' ? child.cdata : child.text);
    }
  }
  const hasText = segments.some(text => text.length > 0);
  if (children.length && hasText) {
    if (segments.some(text => text.trim()) || !segments.some(text => /[\r\n]/.test(text))) {
      throw new Error('Mixed XML content (text and child elements) is not supported by the current API. The body has not been changed.');
    }
  } else if (!children.length) fields[XML_TEXT] = segments[0] || null;
  const order = children.map(child => child.name!);
  const grouped = Object.keys(fields).filter(key => ![XML_ATTRIBUTES, XML_TEXT].includes(key))
    .flatMap(key => Array(Array.isArray(fields[key]) ? fields[key].length : 1).fill(key));
  if (order.some((key, index) => key !== grouped[index])) {
    throw new Error('Interleaved XML elements with repeated names are not supported by the current API. The body has not been changed.');
  }
  return fields;
};

export function parseXmlBody(xml: string): Record<string, unknown> {
  if (!xml.trim()) throw new Error('XML must contain a root element');
  const validated = new DOMParser().parseFromString(xml, 'application/xml');
  if (validated.getElementsByTagNameNS('http://www.mozilla.org/newlayout/xml/parsererror.xml', 'parsererror').length) {
    throw new Error('Invalid XML');
  }
  const document = xml2js(xml, { compact: false, captureSpacesBetweenElements: true }) as {
    declaration?: { attributes?: Record<string, string> }; elements?: XmlElement[];
  };
  const roots = (document.elements ?? []).filter(element => element.type === 'element');
  if (roots.length !== 1 || (document.elements ?? []).some(element => element.type === 'text' && textOf(element.text).trim())) {
    throw new Error('XML must contain exactly one root element');
  }
  return { [roots[0].name!]: compactElement(roots[0]),
    ...(document.declaration ? { _declaration: document.declaration } : {}) };
}

const writeAttributes = (value: unknown) => Object.entries(objectOf(value)).map(
  ([key, item]) => ` ${key}="${escapeAttribute(textOf(item))}"`).join('');

export function serializeXmlBody(body: unknown): string {
  const document = typeof body === 'string' ? parseXmlBody(body) : objectOf(body);
  const root = xmlRootEntry(document);
  if (!root) return '';
  const write = (name: string, raw: unknown, depth: number, inline = false): string => {
    const fields = objectOf(raw);
    const children = xmlChildEntries(fields);
    const value = fields[XML_TEXT] ?? fields._text ?? (typeof raw === 'object' ? '' : raw);
    const mixed = Array.isArray(value);
    const text = mixed ? value.map(textOf) : [textOf(value)];
    const open = `<${name}${writeAttributes(fields[XML_ATTRIBUTES] ?? fields._attributes)}`;
    if (!children.length && text.every(part => !part)) return `${open}/>`;
    if (mixed) {
      const content = text.map((part, index) => escapeXmlText(part)
        + (children[index] ? write(...children[index], depth + 1, true) : '')).join('');
      return `${open}>${content}${children.slice(text.length).map(child => write(...child, depth + 1, true)).join('')}</${name}>`;
    }
    const content = escapeXmlText(text[0]);
    if (!children.length) return `${open}>${content}</${name}>`;
    if (inline || content) return `${open}>${content}${children.map(child => write(...child, depth + 1, true)).join('')}</${name}>`;
    const indent = '  '.repeat(depth);
    return `${open}>\n${children.map(child => `${indent}  ${write(...child, depth + 1)}`).join('\n')}\n${indent}</${name}>`;
  };
  const declaration = objectOf(document._declaration);
  return `${document._declaration ? `<?xml${writeAttributes(declaration.attributes ?? declaration._attributes)}?>\n` : ''}${write(...root, 0)}`;
}
