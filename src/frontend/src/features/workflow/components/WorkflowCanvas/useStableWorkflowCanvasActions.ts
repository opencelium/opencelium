import { useCallback, useRef } from 'react';
import type { WorkflowCanvasProps } from './WorkflowCanvas.types';

type Actions = Pick<WorkflowCanvasProps, 'onOpenAddStep' | 'onOpenContextMenu'
  | 'onDeleteNode' | 'onOpenAggregatorEditor'>;

export function useStableWorkflowCanvasActions(actions: Actions) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  return {
    onOpenAddStep: useCallback<NonNullable<Actions['onOpenAddStep']>>(
      (...args) => actionsRef.current.onOpenAddStep?.(...args), []),
    onOpenContextMenu: useCallback<NonNullable<Actions['onOpenContextMenu']>>(
      (...args) => actionsRef.current.onOpenContextMenu?.(...args), []),
    onDeleteNode: useCallback<NonNullable<Actions['onDeleteNode']>>(
      (...args) => actionsRef.current.onDeleteNode?.(...args), []),
    onOpenAggregatorEditor: useCallback<NonNullable<Actions['onOpenAggregatorEditor']>>(
      (...args) => actionsRef.current.onOpenAggregatorEditor?.(...args), []),
  };
}
