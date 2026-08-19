import { useMemo, useState } from 'react';
import { buildReferenceValue, getIteratorsForMethod, type ResponseType } from '../requestReferenceOptions';
import { webhookSnippet } from '../bodyWebhook';
import { getDuplicateMethodIndexByColor } from '../../../../utils/methodColor';
import type { LegacyBodyReferenceGeneratorProps } from './LegacyBodyReferenceGenerator.types';
import { getReferenceMethods } from './legacyBodyReferenceGenerator.utils';

export function useLegacyBodyReferenceGenerator({
  connection, currentMethod, onApply, showWebhookOption = true,
}: LegacyBodyReferenceGeneratorProps) {
  const [referenceType, setReferenceType] = useState<'direct' | 'webhook'>('direct');
  const [responseType, setResponseType] = useState<ResponseType>('body');
  const [methodId, setMethodId] = useState<string>();
  const [field, setField] = useState<string>();
  const [webhookValue, setWebhookValue] = useState<string>();
  const methods = useMemo(() => getReferenceMethods(connection, currentMethod),
    [connection, currentMethod]);
  const selectedMethod = methods.find((method) => method.id === methodId);
  const duplicateIndexByColor = useMemo(() => getDuplicateMethodIndexByColor(methods), [methods]);
  const iterators = useMemo(() => getIteratorsForMethod(connection, currentMethod),
    [connection, currentMethod]);
  const shellClassName = ['bodyLegacyGeneratorShell',
    referenceType === 'webhook' ? 'bodyLegacyGeneratorShellWebhook' : '',
    !showWebhookOption ? 'bodyLegacyGeneratorShellNoToggle' : '',
  ].filter(Boolean).join(' ');

  const selectMethod = (value: string) => {
    setMethodId(value);
    setField(undefined);
  };
  const selectResponseType = (value: ResponseType) => {
    setResponseType(value);
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
    referenceType, setReferenceType, responseType, methodId, field, setField,
    webhookValue, setWebhookValue, methods, selectedMethod, duplicateIndexByColor,
    iterators, shellClassName, selectMethod, selectResponseType, applyDirect, applyWebhook,
  };
}
