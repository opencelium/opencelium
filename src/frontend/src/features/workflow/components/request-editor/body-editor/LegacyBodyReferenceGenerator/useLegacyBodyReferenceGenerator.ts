import { useMemo, useState } from 'react';
import { buildReferenceValue, getIteratorsForMethod, isExpandableReferencePath,
  type ResponseType } from '../requestReferenceOptions';
import { webhookSnippet } from '../bodyWebhook';
import { getDuplicateMethodIndexByColor } from '../../../../utils/methodColor';
import type { LegacyBodyReferenceGeneratorProps } from './LegacyBodyReferenceGenerator.types';
import { getReferenceMethods } from './legacyBodyReferenceGenerator.utils';
import { parseEnhancementArg } from '../../utils/parseEnhancementArg';
import { normalizeReferenceColor } from '../../../../utils/graph.referenceColors';

export function useLegacyBodyReferenceGenerator({
  connection, currentMethod, onApply, showWebhookOption = true, defaultMethodId, resetKey,
  applyOnSelect, value, showMethod = true, readOnly,
}: LegacyBodyReferenceGeneratorProps) {
  const [referenceType, setReferenceType] = useState<'direct' | 'webhook'>('direct');
  const [responseType, setResponseType] = useState<ResponseType>('body');
  const [methodId, setMethodId] = useState<string>();
  const [field, setField] = useState<string>();
  const [webhookValue, setWebhookValue] = useState<string>();
  // Eligibility answers "what may this method read", which is a question about
  // a choice. A read-only generator is not offering one — it is displaying a
  // reference that already exists, and the method it names may well be one the
  // reader could not pick (the step's own request, in the delete dialog's
  // "used in" column). So it draws from the whole connection instead.
  const methods = useMemo(() => (readOnly
    ? connection.fromConnector.method
    : getReferenceMethods(connection, currentMethod)),
  [connection, currentMethod, readOnly]);
  // Adjusting state during render rather than in an effect, which is the
  // documented way to follow a prop: an effect would paint one frame with the
  // previous method still selected, and the user would watch it change.
  //
  // A method this generator does not offer is not selected at all, rather than
  // shown as a selection nothing here can act on: a host seeding several of
  // these at once may be doing it from a wider list than any single one's scope
  // allows (see the delete dialog, whose method list is the union of its
  // fields').
  //
  // Whatever was half-picked here goes with it, back to the state a fresh
  // generator starts in: the path belongs to the method it was picked on, and
  // so does the part of the response it came from — a status or a header chosen
  // against the old method says nothing about the new one, and leaving either
  // standing would make the next pick read as an edit of someone else's answer.
  const edited = value ? parseEnhancementArg(value) : null;
  const editedMethodId = edited
    ? methods.find((method) => normalizeReferenceColor(method.color)
      === normalizeReferenceColor(edited.color))?.id
    : undefined;
  const seed = `${value ?? ''}|${defaultMethodId ?? ''}|${resetKey ?? 0}`;
  const [appliedSeed, setAppliedSeed] = useState(`||${resetKey ?? 0}`);
  if (seed !== appliedSeed) {
    setAppliedSeed(seed);
    if (edited && editedMethodId) {
      // Showing an answer the host already holds: the controls are the answer.
      setMethodId(editedMethodId);
      setResponseType(edited.messageProperty as ResponseType);
      setField(edited.messageProperty === 'status' ? 'status' : edited.path || '$');
    } else {
      setMethodId(methods.some((method) => method.id === defaultMethodId)
        ? defaultMethodId : undefined);
      setResponseType('body');
      setField(undefined);
    }
  }
  const selectedMethod = methods.find((method) => method.id === methodId);
  const duplicateIndexByColor = useMemo(() => getDuplicateMethodIndexByColor(methods), [methods]);
  const iterators = useMemo(() => getIteratorsForMethod(connection, currentMethod),
    [connection, currentMethod]);
  const shellClassName = ['bodyLegacyGeneratorShell',
    referenceType === 'webhook' ? 'bodyLegacyGeneratorShellWebhook' : '',
    !showWebhookOption ? 'bodyLegacyGeneratorShellNoToggle' : '',
    !showMethod ? 'bodyLegacyGeneratorShellNoMethod' : '',
  ].filter(Boolean).join(' ');

  const selectMethod = (value: string) => {
    setMethodId(value);
    setField(undefined);
  };
  const applyPicked = (type: ResponseType, path: string) => {
    if (!selectedMethod) return false;
    onApply(buildReferenceValue(selectedMethod.color, type, path));
    // A host that keeps the generator on screen hands the answer straight back
    // as `value`, which re-seeds these controls; one that dismisses it wants a
    // clean generator the next time it opens.
    if (!value) setField(undefined);
    return true;
  };
  /** A path the picker can still drill into is not an answer yet. */
  const isWholeReference = (type: ResponseType, path: string) => type === 'status'
    || !isExpandableReferencePath(selectedMethod, type, path, iterators);
  const chooseField = (value?: string) => {
    if (applyOnSelect && value && isWholeReference(responseType, value)
      && applyPicked(responseType, value)) return;
    setField(value);
  };
  const selectResponseType = (value: ResponseType) => {
    setResponseType(value);
    // Status has no path to pick, so choosing it is already the whole answer.
    if (value === 'status' && applyOnSelect && applyPicked('status', 'status')) return;
    setField(value === 'status' ? 'status' : undefined);
  };
  const applyDirect = () => {
    if (!(selectedMethod && field)) return;
    onApply(buildReferenceValue(selectedMethod.color, responseType, field));
    setField(undefined);
  };
  const applyWebhook = () => {
    if (!webhookValue) return;
    onApply(webhookSnippet(webhookValue));
    setWebhookValue(undefined);
  };

  return {
    /** Changes once per reset — what the controls are keyed on, so each reset
     *  replaces them instead of asking them to clear themselves. */
    resetSeed: appliedSeed,
    referenceType, setReferenceType, responseType, methodId, field, setField: chooseField,
    webhookValue, setWebhookValue, methods, selectedMethod, duplicateIndexByColor,
    iterators, shellClassName, selectMethod, selectResponseType, applyDirect, applyWebhook,
  };
}
