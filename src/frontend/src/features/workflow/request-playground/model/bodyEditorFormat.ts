import type { WorkflowBodyFormat } from '../../types/request-config.types';
import { parseXmlBody, serializeXmlBody } from '../../utils/xmlBody';
import { readBodyFields } from './collectPlaygroundInputs';

export const formatBodyForEditor = (body: unknown, format: WorkflowBodyFormat) =>
  format === 'xml' ? serializeXmlBody(readBodyFields(body)) : JSON.stringify(body ?? {}, null, 2);

export const parseEditedBody = (text: string, body: unknown, format: WorkflowBodyFormat): unknown => {
  const fields = format === 'xml' ? parseXmlBody(text) : JSON.parse(text);
  return format === 'xml' && body && typeof body === 'object' && 'fields' in body
    ? { ...body, fields } : fields;
};
