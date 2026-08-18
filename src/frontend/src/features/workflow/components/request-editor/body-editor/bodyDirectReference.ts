import { createShortId } from '@shared/lib/createId';
import type { Connection } from '../../../types/connection';
import { buildBodyEnhancement, buildRequestResultField, getParsedReferences } from './bodyReference';
import type { DirectReferenceInfo, RequestMessageProperty } from './bodyBinding.types';

export const getDirectReferenceInfo = (
  messageProperty: RequestMessageProperty,
  namespace: string[],
  name: string,
  value: unknown,
): DirectReferenceInfo | null => {
  const refs = getParsedReferences(typeof value === 'string' ? value : '');
  if (refs.length === 0) return null;
  return { leftField: buildRequestResultField(messageProperty, namespace, name), refs };
};

export const createDirectReferenceEnhancement = (
  connection: Connection,
  methodColor: string,
  messageProperty: RequestMessageProperty,
  namespace: string[],
  name: string,
  value: unknown,
): { connection: Connection; enhanceId: string } | null => {
  const direct = getDirectReferenceInfo(messageProperty, namespace, name, value);
  if (!direct) return null;
  const resultVar = `${methodColor}.(request).${direct.leftField}`;
  const enhanceId = createShortId();
  const enhancement = buildBodyEnhancement(enhanceId, resultVar, direct.refs);
  return {
    connection: {
      ...connection,
      fieldBindings: [...(connection.fieldBindings || []), { enhancement }],
    },
    enhanceId,
  };
};
