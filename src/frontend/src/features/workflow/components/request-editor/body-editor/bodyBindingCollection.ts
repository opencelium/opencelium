import { createShortId } from '@shared/lib/createId';
import type { Enhancement } from '../../../types/connection';
import { buildBodyEnhancement, buildRequestResultField, getParsedReferences } from './bodyReference';
import type { RequestMessageProperty } from './bodyBinding.types';

export const collectEnhancementsFromObject = (
  body: unknown,
  methodColor: string,
  messageProperty: RequestMessageProperty,
) => {
  const seen = new Map<string, Enhancement>();
  const visit = (value: unknown, namespace: string[] = [], name = '') => {
    const resultField = name ? buildRequestResultField(messageProperty, namespace, name) : '';
    if (typeof value === 'string') {
      const refs = getParsedReferences(value);
      if (refs.length > 0 && resultField) {
        const id = createShortId();
        seen.set(id, buildBodyEnhancement(id, `${methodColor}.(request).${resultField}`, refs));
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, [...namespace, name].filter(Boolean), String(index)));
      return;
    }
    if (value && typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(([key, nested]) =>
        visit(nested, [...namespace, name].filter(Boolean), key));
    }
  };
  visit(body);
  return Array.from(seen.values());
};
