import { useCallback, useEffect, useState, type FocusEvent, type RefObject } from 'react';
import { useSettleOnOutsideClick } from '../../reference-chip/useSettleOnOutsideClick';
import type { ResponseType } from '../../request-editor/body-editor/requestReferenceOptions';
import type { ConditionValueSource } from '../conditionBuilder.types';
import type { ConditionValueInputProps } from './ConditionValueInput.types';
import { getSourceFromField, parseMethodFromReference,
  parseResponseTypeFromReference } from '../conditionBuilder.utils';

export function useConditionValueInput({
  side, properties, allMethods, onChange, editorRef,
}: Pick<ConditionValueInputProps, 'side' | 'properties' | 'allMethods' | 'onChange'> & {
  /** The selects' wrapper: a click outside it settles an edited reference back into a chip. */
  editorRef: RefObject<HTMLDivElement | null>;
}) {
  const fieldKey = side === 'left' ? 'leftField' : 'rightField';
  const fieldValue = properties[fieldKey] || '';
  const parsedMethod = parseMethodFromReference(allMethods, fieldValue);
  const parsedResponseType = parseResponseTypeFromReference(fieldValue);
  const [draftSource, setDraftSource] = useState<ConditionValueSource>(
    () => getSourceFromField(fieldValue));
  const [draftMethodId, setDraftMethodId] = useState<string | undefined>(() => parsedMethod?.id);
  const [draftResponseType, setDraftResponseType] = useState<ResponseType>(
    () => parsedResponseType || 'body');
  // A chosen reference shows as a chip; the selects come back while it is edited or still empty.
  const [isEditing, setEditing] = useState(() => !fieldValue);
  const settle = useCallback(() => setEditing(false), []);
  useSettleOnOutsideClick(editorRef, isEditing && !!fieldValue, settle);
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
    setEditing(true);
    if (nextSource === 'direct') setDraftResponseType(responseType || 'body');
    onChange({ [fieldKey]: undefined });
  };

  return { fieldKey, fieldValue, source, methodId, responseType, setSource,
    setDraftMethodId, setDraftResponseType,
    isChipShown: !!fieldValue && !isEditing && source !== 'constant',
    startEditing: () => setEditing(true),
    removeReference: () => { setEditing(true); onChange({ [fieldKey]: undefined }); },
    /** Leaving the whole input — not moving between its selects — settles a complete reference into a chip. */
    finishEditing: (event: FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setEditing(false);
    },
  };
}
