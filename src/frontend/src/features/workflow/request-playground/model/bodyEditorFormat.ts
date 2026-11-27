import type { WorkflowBodyFormat } from '../../types/request-config.types';
import { isPlainObject, parseXmlBody, serializeXmlBody, XML_DOCUMENT_KEYS, type XmlBodyError } from '../../utils/xmlBody';

export type EditedBody = { ok: true; body: unknown } | { ok: false; xmlError?: XmlBodyError };

// The raw editor gets the step's fields as they are (`config.body`), never the body wrapper: a root
// element named `fields` must not be mistaken for one.
const asXmlDocument = (body: unknown): unknown => {
  const document = isPlainObject(body) ? body : {};
  const elements = Object.keys(document).filter((key) => !XML_DOCUMENT_KEYS.includes(key));
  // A JSON body switched to XML has several top-level keys; one root keeps them all visible.
  return elements.length > 1 ? { root: Object.fromEntries(elements.map((key) => [key, document[key]])) } : document;
};

export const formatBodyForEditor = (body: unknown, format: WorkflowBodyFormat) =>
  format === 'xml' ? serializeXmlBody(asXmlDocument(body)) : JSON.stringify(body ?? {}, null, 2);

export const parseEditedBody = (text: string, format: WorkflowBodyFormat): EditedBody => {
  if (format !== 'xml') {
    try {
      return { ok: true, body: JSON.parse(text) };
    } catch {
      return { ok: false };
    }
  }
  const parsed = parseXmlBody(text);
  return parsed.ok ? { ok: true, body: parsed.fields } : { ok: false, xmlError: parsed.error };
};
