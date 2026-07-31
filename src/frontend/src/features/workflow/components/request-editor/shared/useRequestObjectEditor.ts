import type { InteractionProps, OnSelectProps } from 'react-json-view';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMethodContext } from '../../../providers/MethodContext';
import type { RootState } from '../../../store';
import { updateConnection, updatePayload } from '../../../store/connection/connectionSlice';
import {
  createDirectReferenceEnhancement,
  findRequestEnhancement,
  getDirectReferenceInfo,
  removeDeletedRequestBindings,
  updateRequestFieldBindings,
} from '../body-editor/bodyBinding';
import {
  getBodySelection,
  getBodySelectionValue,
  mergeReferenceValue,
  setBodySelectionValue,
} from '../body-editor/bodyValue';
import { isInvalidMixedReferenceInteraction } from './requestFieldRules';

type MessageProperty = 'body' | 'header';

type Props = {
  messageProperty: MessageProperty;
  source: Record<string, unknown>;
};

export function useRequestObjectEditor({ messageProperty, source }: Props) {
  const dispatch = useDispatch();
  const { method } = useMethodContext();
  const connection = useSelector((state: RootState) => state.connection.connection);
  const [selection, setSelection] = useState<ReturnType<typeof getBodySelection>>(null);
  const [selectedEnhanceId, setSelectedEnhanceId] = useState<string>();
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const currentValue = getBodySelectionValue(source, selection);
  const currentEnhancement = useMemo(
    () =>
      selectedEnhanceId
        ? connection?.fieldBindings.find((binding) => binding.enhancement.enhanceId === selectedEnhanceId)?.enhancement
        : undefined,
    [connection, selectedEnhanceId],
  );
  const directReference = useMemo(
    () =>
      !currentEnhancement && selection
        ? getDirectReferenceInfo(messageProperty, selection.namespace, selection.name, currentValue)
        : null,
    [currentEnhancement, currentValue, messageProperty, selection],
  );

  const getNextConnection = (updatedSource: unknown, namespace: string[], name: string | undefined, newValue: unknown) => {
    if (!connection) return undefined;
    const next = updateRequestFieldBindings(connection, method.color, messageProperty, { namespace, name, newValue });
    return removeDeletedRequestBindings(next, method.color, messageProperty, updatedSource);
  };

  const commit = (payload: InteractionProps) => {
    if (isInvalidMixedReferenceInteraction(payload)) {
      setValidationError('The field must contain either plain text or references only. Mixed values are not allowed.');
      return false;
    }
    setValidationError(null);
    dispatch(updatePayload({ methodId: method.id, newFields: payload.updated_src, messageProperty } as never));
    const next = getNextConnection(
      payload.updated_src,
      (payload.namespace || []).filter(Boolean).map(String),
      payload.name || undefined,
      payload.new_value,
    );
    if (next) dispatch(updateConnection({ fieldBindings: next.fieldBindings } as never));
    return true;
  };

  const onSelect = (select: OnSelectProps) => {
    const next = getBodySelection(select);
    if (!next) return;
    setSelection(next);
    setValidationError(null);
    const enhancement = findRequestEnhancement(connection, method.color, next.namespace, next.name, messageProperty, next.value);
    setSelectedEnhanceId(enhancement?.enhanceId);
  };

  const selectField = (namespace: string[], name: string, value: unknown) => {
    const next = { namespace, name, value, pathLabel: [...namespace, name].join('.') };
    setSelection(next);
    setValidationError(null);
    const enhancement = findRequestEnhancement(connection, method.color, namespace, name, messageProperty, value);
    setSelectedEnhanceId(enhancement?.enhanceId);
  };

  const updateSelectionValue = (nextValue: string) => {
    if (!selection) return;
    const updated = setBodySelectionValue(source, selection, nextValue);
    const next = getNextConnection(updated, selection.namespace, selection.name, nextValue);
    commit({
      updated_src: updated,
      existing_src: source,
      namespace: selection.namespace,
      name: selection.name,
      existing_value: selection.value as never,
      new_value: nextValue as never,
    });
    if (next) {
      const enhancement = findRequestEnhancement(next, method.color, selection.namespace, selection.name, messageProperty, nextValue);
      setSelectedEnhanceId(enhancement?.enhanceId);
    }
    setSelection({ ...selection, value: nextValue });
  };

  const createEnhancement = () => {
    if (!connection || !selection) return;
    const created = createDirectReferenceEnhancement(
      connection,
      method.color,
      messageProperty,
      selection.namespace,
      selection.name,
      currentValue,
    );
    if (!created) return;
    dispatch(updateConnection({ fieldBindings: created.connection.fieldBindings } as never));
    setSelectedEnhanceId(created.enhanceId);
  };

  return {
    connection,
    createEnhancement,
    currentEnhancement,
    currentValue,
    directReference,
    isReferenceOpen,
    method,
    onSelect,
    selection,
    selectField,
    selectedEnhanceId,
    setIsReferenceOpen,
    setSelectedEnhanceId,
    syncSource: commit,
    updateSelectionValue,
    validationError,
    insertReference: (reference: string) => {
      if (!selection) return;
      updateSelectionValue(mergeReferenceValue(selection.value, reference));
      setIsReferenceOpen(false);
    },
  };
}
