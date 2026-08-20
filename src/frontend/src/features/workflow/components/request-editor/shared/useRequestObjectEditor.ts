import type { OnSelectProps } from 'react-json-view';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useMethodContext } from '../../../providers/MethodContext';
import type { RootState } from '../../../store';
import {
  findRequestEnhancement,
  getDirectReferenceInfo,
} from '../body-editor/bodyBinding';
import {
  getBodySelection,
  getBodySelectionValue,
  mergeReferenceValue,
  setBodySelectionValue,
} from '../body-editor/bodyValue';
import { removeReferenceValue, resolveFieldPathAgainstSource } from '../body-editor/bodyReference';
import type { RequestObjectEditorProps } from './requestObjectEditor.types';
import { useRequestEnhancementActions } from './useRequestEnhancementActions';
import { useRequestObjectCommit } from './useRequestObjectCommit';

export function useRequestObjectEditor({ messageProperty, source }: RequestObjectEditorProps) {
  const { method } = useMethodContext();
  const connection = useSelector((state: RootState) => state.connection.connection);
  const [selection, setSelection] = useState<ReturnType<typeof getBodySelection>>(null);
  const [selectedEnhanceId, setSelectedEnhanceId] = useState<string>();
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const currentValue = getBodySelectionValue(source, selection);

  // Recompute after selection settles to avoid react-json-view's stale onSelect race.
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
  const enhancementActions = useRequestEnhancementActions({ connection, method, messageProperty,
    selection, currentValue, currentEnhancement });
  const { commit, validationError, clearValidationError } = useRequestObjectCommit({
    connection, method, messageProperty,
  });

  const onSelect = (select: OnSelectProps) => {
    const next = getBodySelection(select);
    if (!next) return;
    setSelection(next);
    clearValidationError();
  };

  const selectField = (namespace: string[], name: string, value: unknown) => {
    setSelection({ namespace, name, value, pathLabel: [...namespace, name].join('.') });
    clearValidationError();
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

  // Use the normal commit pipeline so raw values and field bindings remain synchronized.
  const deleteReferenceAtPath = (fieldPath: string, pointer: string) => {
    const { namespace, name } = resolveFieldPathAgainstSource(source, fieldPath);
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
    createEnhancement: enhancementActions.createEnhancement,
    currentEnhancement,
    deleteEnhancement: enhancementActions.deleteEnhancement,
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
