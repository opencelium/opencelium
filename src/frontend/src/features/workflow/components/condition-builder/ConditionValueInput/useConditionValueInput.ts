import { useEffect, useState } from 'react';
import type { ResponseType } from '../../request-editor/body-editor/requestReferenceOptions';
import type { ConditionValueSource } from '../conditionBuilder.types';
import type { ConditionValueInputProps } from './ConditionValueInput.types';
import { getSourceFromField, parseMethodFromReference,
  parseResponseTypeFromReference } from './conditionValueReference.utils';

export function useConditionValueInput({
  side, properties, allMethods, onChange,
}: Pick<ConditionValueInputProps, 'side' | 'properties' | 'allMethods' | 'onChange'>) {
  const fieldKey = side === 'left' ? 'leftField' : 'rightField';
  const fieldValue = properties[fieldKey] || '';
  const parsedMethod = parseMethodFromReference(allMethods, fieldValue);
  const parsedResponseType = parseResponseTypeFromReference(fieldValue);
  const [draftSource, setDraftSource] = useState<ConditionValueSource>(
    () => getSourceFromField(fieldValue));
  const [draftMethodId, setDraftMethodId] = useState<string | undefined>(() => parsedMethod?.id);
  const [draftResponseType, setDraftResponseType] = useState<ResponseType>(
    () => parsedResponseType || 'body');
  const source = fieldValue ? getSourceFromField(fieldValue) : draftSource || 'direct';
  const methodId = fieldValue ? parsedMethod?.id : draftMethodId;
  const responseType = draftResponseType || 'body';

  useEffect(() => {
    if (!fieldValue) return;
    setDraftSource(getSourceFromField(fieldValue));
    setDraftMethodId(parsedMethod?.id);
    setDraftResponseType(parsedResponseType || 'body');
  }, [fieldValue, parsedMethod?.id, parsedResponseType]);

  const setSource = (nextSource: ConditionValueSource) => {
    setDraftSource(nextSource);
    if (nextSource === 'direct') setDraftResponseType(responseType || 'body');
    onChange({ [fieldKey]: undefined });
  };

  return { fieldKey, fieldValue, source, methodId, responseType, setSource,
    setDraftMethodId, setDraftResponseType };
}
