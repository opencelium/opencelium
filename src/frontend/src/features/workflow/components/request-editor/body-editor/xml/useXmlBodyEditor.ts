import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { js2xml, xml2js } from 'xml-js';
import { useMethodContext } from '../../../../providers/MethodContext';
import type { RootState } from '../../../../store';
import { updateConnection, updatePayload } from '../../../../store/connection/connectionSlice';
import { replaceRequestBindings } from '../bodyBinding';
import { mergeReferenceValue } from '../bodyValue';
import {
  applySelectionValue,
  createTreeFromCompactXml,
  getSelectedValue,
  serializeCompactXml,
  type XmlSelection,
} from './xmlTree';
import { useXmlEnhancementActions } from './useXmlEnhancementActions';
import { useXmlSelectionState } from './useXmlSelectionState';

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

  const { selectionInfo, setSelectedEnhanceId,
    currentEnhancement, directReference } = useXmlSelectionState({
    connection, methodColor: method.color, selection, tree,
  });
  const enhancementActions = useXmlEnhancementActions({ connection, method, selectionInfo,
    currentEnhancement, setSelectedEnhanceId });

  const syncBody = (nextTree = tree) => {
    const nextBody = serializeCompactXml(nextTree);
    dispatch(updatePayload({ methodId: method.id, newFields: nextBody, messageProperty: 'body' } as never));
    if (!connection) return;
    const nextConnection = replaceRequestBindings(connection, method.color, 'body', nextBody);
    dispatch(updateConnection({ fieldBindings: nextConnection.fieldBindings } as never));
  };

  return {
    connection,
    createEnhancement: enhancementActions.createEnhancement,
    currentEnhancement,
    deleteEnhancement: enhancementActions.deleteEnhancement,
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
