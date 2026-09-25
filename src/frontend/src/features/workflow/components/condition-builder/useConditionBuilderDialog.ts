import { useEffect, useState } from 'react';
import type { ConditionGroup } from './conditionBuilder.types';
import { buildConditionConfig, getInitialTreeFromConfig,
  validateConditionTreeWithErrors } from './conditionBuilder.utils';
import { useConditionBuilderData } from './useConditionBuilderData';
import type { ConditionBuilderDialogProps } from './ConditionBuilderDialog.types';

export function useConditionBuilderDialog(props: ConditionBuilderDialogProps) {
  const { open, node, nodes, edges, connection, onSave } = props;
  const operatorType = node?.type === 'loop' ? 'loop' : 'if';
  const [tree, setTree] = useState<ConditionGroup>(() => getInitialTreeFromConfig(node, operatorType));
  const [renderKey, setRenderKey] = useState(0);
  const isLoop = operatorType === 'loop';
  const data = useConditionBuilderData(connection, nodes, edges, node, tree, isLoop);

  useEffect(() => {
    if (!open) return;
    setTree(getInitialTreeFromConfig(node, operatorType));
    setRenderKey((current) => current + 1);
  }, [node, open, operatorType]);

  const save = () => {
    if (!node) return;
    const result = validateConditionTreeWithErrors(tree, operatorType);
    setTree(result.tree);
    if (!result.isValid) return;
    onSave(node.id, buildConditionConfig(operatorType, result.tree, data.loopIterator));
  };

  return { operatorType, tree, setTree, renderKey, isLoop, save, ...data };
}
