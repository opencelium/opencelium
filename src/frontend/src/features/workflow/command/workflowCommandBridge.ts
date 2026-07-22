import { create } from 'zustand';
import type { Node } from '@xyflow/react';
import type { WorkflowNodeData } from '../types/workflow.types';

/**
 * Bridge between the command-palette's plain-function CommandNode
 * resolve/execute callbacks (no React context available) and whichever
 * workflow editor instance is currently mounted. `useWorkflowPage` sets
 * this on mount and clears it on unmount — see connection.definition.tsx's
 * `workflow find method/property` commands for the read side.
 */
type WorkflowCommandBridge = {
  isActive: boolean;
  getNodes: () => Node<WorkflowNodeData>[];
  setSearchHighlightedNodeIds: (ids: string[]) => void;
  hasSearchHighlights: () => boolean;
  clearSearchHighlights: () => void;
  /** True while any editor-owned dialog (method config, condition builder,
   * data aggregator, response viewer, history panel) is open — these live in
   * useWorkflowPage's own state, invisible to the command palette's generic
   * useModalStore check. Escape must close a dialog before it clears search
   * highlights, so callers gate on this first. */
  hasOpenDialog: () => boolean;
};

const INACTIVE_BRIDGE: WorkflowCommandBridge = {
  isActive: false,
  getNodes: () => [],
  setSearchHighlightedNodeIds: () => {},
  hasSearchHighlights: () => false,
  clearSearchHighlights: () => {},
  hasOpenDialog: () => false,
};

export const workflowCommandBridgeStore = create<WorkflowCommandBridge>(() => ({
  ...INACTIVE_BRIDGE,
}));

export const deactivateWorkflowCommandBridge = () => {
  workflowCommandBridgeStore.setState({ ...INACTIVE_BRIDGE });
};
