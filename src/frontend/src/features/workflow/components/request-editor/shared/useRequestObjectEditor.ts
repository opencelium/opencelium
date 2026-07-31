import type { InteractionProps, OnSelectProps } from 'react-json-view';
import { useEffect, useMemo, useState } from 'react';
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
import { countEnhancementReferences, parseFieldPath, removeReferenceValue } from '../body-editor/bodyReference';
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

  // Derives the selected enhancement from the latest connection/selection on every render instead
  // of setting it inline inside event handlers: react-json-view's edit-confirm icon doesn't stop
  // propagation, so confirming a reference re-fires onSelect (with pre-edit, stale props) in the
  // same event dispatch — an inline setSelectedEnhanceId there would clobber the id the edit just
  // produced. Recomputing after the state settles avoids that race.
  useEffect(() => {
    if (!selection) return;
    const enhancement = findRequestEnhancement(connection, method.color, selection.namespace, selection.name, messageProperty, currentValue);
    setSelectedEnhanceId(enhancement?.enhanceId);
  }, [connection, method.color, messageProperty, selection, currentValue]);

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
    const namespace = (payload.namespace || []).filter(Boolean).map(String);
    const name = payload.name || undefined;
    const next = getNextConnection(payload.updated_src, namespace, name, payload.new_value);
    if (next) dispatch(updateConnection({ fieldBindings: next.fieldBindings } as never));
    return true;
  };

  const onSelect = (select: OnSelectProps) => {
    const next = getBodySelection(select);
    if (!next) return;
    setSelection(next);
    setValidationError(null);
  };

  const selectField = (namespace: string[], name: string, value: unknown) => {
    setSelection({ namespace, name, value, pathLabel: [...namespace, name].join('.') });
    setValidationError(null);
  };

  const updateSelectionValue = (nextValue: string) => {
    if (!selection) return;
    const updated = setBodySelectionValue(source, selection, nextValue);
    commit({
      updated_src: updated,
      existing_src: source,
      namespace: selection.namespace,
      name: selection.name,
      existing_value: selection.value as never,
      new_value: nextValue as never,
    });
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
  };

  const deleteEnhancement = () => {
    if (!connection || !currentEnhancement) return;
    if (countEnhancementReferences(currentEnhancement) > 1) return;
    dispatch(updateConnection({
      fieldBindings: connection.fieldBindings.filter((binding) => binding.enhancement.enhanceId !== currentEnhancement.enhanceId),
    } as never));
  };

  // Removes one reference token from a field's raw value (identified by its dotted resultVar
  // path, e.g. "items.[0].name") — same mechanism BodyPointer's own remove action uses. Letting
  // the normal commit pipeline resync afterward keeps fieldBindings/args consistent with the
  // edited value, instead of editing args directly and leaving the raw value out of sync.
  const deleteReferenceAtPath = (fieldPath: string, pointer: string) => {
    const { namespace, name } = parseFieldPath(fieldPath);
    if (!name) return;
    const target = { namespace, name, value: undefined, pathLabel: '' };
    const existingValue = getBodySelectionValue(source, target);
    const nextValue = removeReferenceValue(existingValue, pointer);
    if (nextValue === null) return;
    const updated = setBodySelectionValue(source, { ...target, value: existingValue }, nextValue);
    commit({
      updated_src: updated,
      existing_src: source,
      namespace,
      name,
      existing_value: existingValue as never,
      new_value: nextValue as never,
    });
  };

  return {
    connection,
    createEnhancement,
    currentEnhancement,
    deleteEnhancement,
    deleteReferenceAtPath,
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
