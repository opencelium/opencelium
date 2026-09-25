import { useEffect, useMemo, useState } from 'react';
import type { Connection } from '../../../../types/connection';
import { findRequestEnhancement, getDirectReferenceInfo } from '../bodyBinding';
import { findNodePath, getSelectedValue, type XmlSelection, type XmlTreeNode } from './xmlTree';
import type { XmlSelectionInfo } from './xmlBodyEditor.types';

type Args = {
  connection: Connection | null;
  methodColor: string;
  selection: XmlSelection | null;
  tree: XmlTreeNode;
};

export function useXmlSelectionState({ connection, methodColor, selection, tree }: Args) {
  const [selectedEnhanceId, setSelectedEnhanceId] = useState<string>();
  const selectionInfo = useMemo<XmlSelectionInfo | null>(() => {
    if (!selection) return null;
    const nodePath = findNodePath(tree, selection.nodeId);
    if (!nodePath) return null;
    const isText = selection.kind === 'text';
    const name = isText ? '__oc__value' : `__oc__attributes.${selection.attribute}`;
    const namespace = isText ? nodePath : [...nodePath, '__oc__attributes'];
    return {
      label: isText ? `${nodePath.join('.')}.text`
        : `${nodePath.join('.')}.@${selection.attribute}`,
      name,
      namespace: isText ? namespace : namespace.slice(0, -1),
      value: getSelectedValue(tree, selection),
    };
  }, [selection, tree]);

  useEffect(() => {
    if (!selectionInfo) return setSelectedEnhanceId(undefined);
    const enhancement = findRequestEnhancement(
      connection, methodColor, selectionInfo.namespace, selectionInfo.name, 'body',
    );
    setSelectedEnhanceId(enhancement?.enhanceId);
  }, [connection, methodColor, selectionInfo]);

  const currentEnhancement = useMemo(() => selectedEnhanceId
    ? connection?.fieldBindings.find(
      (binding) => binding.enhancement.enhanceId === selectedEnhanceId)?.enhancement
    : undefined, [connection, selectedEnhanceId]);
  const directReference = useMemo(() => !currentEnhancement && selectionInfo
    ? getDirectReferenceInfo('body', selectionInfo.namespace,
      selectionInfo.name, selectionInfo.value)
    : null, [currentEnhancement, selectionInfo]);

  return { selectionInfo, selectedEnhanceId, setSelectedEnhanceId,
    currentEnhancement, directReference };
}
