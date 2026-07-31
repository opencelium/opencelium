import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { js2xml, xml2js } from 'xml-js';
import { useMethodContext } from '../../../../providers/MethodContext';
import type { RootState } from '../../../../store';
import { updateConnection, updatePayload } from '../../../../store/connection/connectionSlice';
import { createDirectReferenceEnhancement, findRequestEnhancement, getDirectReferenceInfo, replaceRequestBindings } from '../bodyBinding';
import { countEnhancementReferences } from '../bodyReference';
import { mergeReferenceValue } from '../bodyValue';
import {
  applySelectionValue,
  createTreeFromCompactXml,
  findNodePath,
  getSelectedValue,
  serializeCompactXml,
  type XmlSelection,
} from './xmlTree';

const XML_JS_OPTIONS = {
  compact: true,
  attributesKey: '__oc__attributes',
  textKey: '__oc__value',
} as const;

export function useXmlBodyEditor() {
  const dispatch = useDispatch();
  const { method } = useMethodContext();
  const connection = useSelector((state: RootState) => state.connection.connection);
  const body = connection?.fromConnector.method.find((item) => item.id === method.id)?.request.body?.fields;
  const [mode, setMode] = useState<'tree' | 'raw'>('tree');
  const [tree, setTree] = useState(() => createTreeFromCompactXml(body));
  const [selection, setSelection] = useState<XmlSelection | null>(null);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [selectedEnhanceId, setSelectedEnhanceId] = useState<string>();
  const [rawXml, setRawXml] = useState('');
  const [rawError, setRawError] = useState<string | null>(null);

  useEffect(() => setTree(createTreeFromCompactXml(body)), [body]);

  useEffect(() => {
    try {
      setRawXml(js2xml(serializeCompactXml(tree), { ...XML_JS_OPTIONS, spaces: 2 }));
      setRawError(null);
    } catch {
      setRawXml('');
    }
  }, [tree]);

  const selectionInfo = useMemo(() => {
    if (!selection) return null;
    const nodePath = findNodePath(tree, selection.nodeId);
    if (!nodePath) return null;
    const name = selection.kind === 'text' ? '__oc__value' : `__oc__attributes.${selection.attribute}`;
    const namespace = selection.kind === 'text' ? nodePath : [...nodePath, '__oc__attributes'];
    return {
      label: selection.kind === 'text' ? `${nodePath.join('.')}.text` : `${nodePath.join('.')}.@${selection.attribute}`,
      name,
      namespace: selection.kind === 'text' ? namespace : namespace.slice(0, -1),
      value: getSelectedValue(tree, selection),
    };
  }, [selection, tree]);

  useEffect(() => {
    if (!selectionInfo) return setSelectedEnhanceId(undefined);
    const enhancement = findRequestEnhancement(connection, method.color, selectionInfo.namespace, selectionInfo.name, 'body');
    setSelectedEnhanceId(enhancement?.enhanceId);
  }, [connection, method.color, selectionInfo]);

  const currentEnhancement = useMemo(
    () =>
      selectedEnhanceId
        ? connection?.fieldBindings.find((binding) => binding.enhancement.enhanceId === selectedEnhanceId)?.enhancement
        : undefined,
    [connection, selectedEnhanceId],
  );
  const directReference = useMemo(
    () =>
      !currentEnhancement && selectionInfo
        ? getDirectReferenceInfo('body', selectionInfo.namespace, selectionInfo.name, selectionInfo.value)
        : null,
    [currentEnhancement, selectionInfo],
  );

  const createEnhancement = () => {
    if (!connection || !selectionInfo) return;
    const created = createDirectReferenceEnhancement(
      connection,
      method.color,
      'body',
      selectionInfo.namespace,
      selectionInfo.name,
      selectionInfo.value,
    );
    if (!created) return;
    dispatch(updateConnection({ fieldBindings: created.connection.fieldBindings } as never));
    setSelectedEnhanceId(created.enhanceId);
  };

  const deleteEnhancement = () => {
    if (!connection || !currentEnhancement) return;
    if (countEnhancementReferences(currentEnhancement) > 1) return;
    dispatch(updateConnection({
      fieldBindings: connection.fieldBindings.filter((binding) => binding.enhancement.enhanceId !== currentEnhancement.enhanceId),
    } as never));
  };

  const syncBody = (nextTree = tree) => {
    const nextBody = serializeCompactXml(nextTree);
    dispatch(updatePayload({ methodId: method.id, newFields: nextBody, messageProperty: 'body' } as never));
    if (!connection) return;
    const nextConnection = replaceRequestBindings(connection, method.color, 'body', nextBody);
    dispatch(updateConnection({ fieldBindings: nextConnection.fieldBindings } as never));
  };

  return {
    connection,
    createEnhancement,
    currentEnhancement,
    deleteEnhancement,
    directReference,
    isReferenceOpen,
    method,
    mode,
    rawError,
    rawXml,
    selection,
    selectionInfo,
    setIsReferenceOpen,
    setMode,
    setRawError,
    setRawXml,
    setSelectedEnhanceId,
    setSelection,
    setTree,
    syncBody,
    tree,
    applyRawXml: (readOnly?: boolean) => {
      if (readOnly) return;
      try {
        const parsed = xml2js(rawXml || '<root />', XML_JS_OPTIONS);
        const nextTree = createTreeFromCompactXml(parsed);
        setTree(nextTree);
        setRawError(null);
        syncBody(nextTree);
      } catch (value) {
        setRawError(value instanceof Error ? value.message : 'Invalid XML');
      }
    },
    insertReference: (reference: string) => {
      if (!selection) return;
      const nextTree = applySelectionValue(tree, selection, mergeReferenceValue(getSelectedValue(tree, selection), reference));
      setTree(nextTree);
      syncBody(nextTree);
      setIsReferenceOpen(false);
    },
  };
}
