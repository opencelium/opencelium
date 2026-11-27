import { escapeXmlText, serializeXmlBody } from '../../utils/xmlBody';
import { buildTextPreview, type JsonLine, type JsonPart } from './bodyPreview';
import type { PreviewInput } from './previewRequest';

export function buildXmlBodyPreview(body: unknown, inputs: PreviewInput[]): JsonLine[] {
  const chips: { token: string; part: JsonPart }[] = [];
  let prefix = '__OC_XML_PREVIEW_';
  const source = JSON.stringify(body) ?? '';
  while (source.includes(prefix)) prefix += '_';
  const visit = (value: unknown): unknown => {
    if (typeof value === 'string') return buildTextPreview(value, inputs).map(part => {
      if (part.kind !== 'input') return part.text;
      const token = `${prefix}${chips.length}__`;
      chips.push({ token, part: { ...part, parts: part.parts.map(valuePart => valuePart.kind === 'input'
        ? valuePart : { ...valuePart, text: escapeXmlText(valuePart.text).replace(/"/g, '&quot;') }) } });
      return token;
    }).join('');
    if (Array.isArray(value)) return value.map(visit);
    if (value && typeof value === 'object') return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, visit(nested)]));
    return value;
  };
  return serializeXmlBody(visit(body)).split('\n').map(line => {
    const parts: JsonPart[] = [];
    let cursor = 0;
    while (cursor < line.length) {
      const next = chips.map(chip => ({ ...chip, index: line.indexOf(chip.token, cursor) }))
        .filter(chip => chip.index >= 0).sort((a, b) => a.index - b.index)[0];
      if (!next) { parts.push({ kind: 'syntax', text: line.slice(cursor) }); break; }
      if (next.index > cursor) parts.push({ kind: 'syntax', text: line.slice(cursor, next.index) });
      parts.push(next.part);
      cursor = next.index + next.token.length;
    }
    return { depth: 0, parts };
  });
}
