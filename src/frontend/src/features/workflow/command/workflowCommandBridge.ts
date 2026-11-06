import { create } from 'zustand';
import type { Connector } from '@entities/connector/model/types';
import type { WorkflowMethodEditorState } from '../types/request-config.types';
import type { WorkflowAction, WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';

/**
 * Bridge between the command-palette's plain-function CommandNode
 * resolve/execute callbacks (no React context available) and whichever
 * workflow editor instance is currently mounted. `useWorkflowPage` sets
 * this on mount and clears it on unmount — see connection.definition.tsx's
 * `workflow search <term>` command for the read side.
 */
type WorkflowCommandBridge = {
  isActive: boolean;
  getNodes: () => WorkflowNodeModel[];
  /** Read with the nodes to put methods in workflow (tree-path) order — see buildWorkflowIndexes. */
  getEdges: () => WorkflowEdgeModel[];
  setSearchHighlightedNodeIds: (ids: string[]) => void;
  hasSearchHighlights: () => boolean;
  clearSearchHighlights: () => void;
  /** Pans (and keeps the current zoom) so the given node is centered in the
   * viewport — used to bring the best search match into view as the user types. */
  centerOnNode: (nodeId: string) => void;
  /** True while any editor-owned dialog (method config, condition builder,
   * data aggregator, response viewer, history panel) is open — these live in
   * useWorkflowPage's own state, invisible to the command palette's generic
   * useModalStore check. Escape must close a dialog before it clears search
   * highlights, so callers gate on this first. */
  hasOpenDialog: () => boolean;
  /** Adds a step exactly as the "+" and the sidebar do (spliced in, one undo entry);
   * the new node's id, or null when nothing could be added. */
  addStep: (action: WorkflowAction) => string | null;
  /** Makes this the only selected node, so "it" / "this step" in the next request means it. */
  selectNode: (nodeId: string) => void;
  /** The connectors a method can be added from, with their invokers' operations. */
  getConnectors: () => Connector[];
  /** False in read-only mode and while a test run holds the editor. */
  isEditable: () => boolean;
  /** Opens a method's URL, header or body editor, as its context-menu entry does. */
  openRequestEditor: (editor: WorkflowMethodEditorState) => void;
  /** Opens an if's or a loop's condition dialog, as double-clicking it does. */
  openConditionEditor: (nodeId: string) => void;
};

const INACTIVE_BRIDGE: WorkflowCommandBridge = {
  isActive: false,
  getNodes: () => [],
  getEdges: () => [],
  setSearchHighlightedNodeIds: () => {},
  hasSearchHighlights: () => false,
  clearSearchHighlights: () => {},
  centerOnNode: () => {},
  hasOpenDialog: () => false,
  addStep: () => null,
  selectNode: () => {},
  getConnectors: () => [],
  isEditable: () => false,
  openRequestEditor: () => {},
  openConditionEditor: () => {},
};

export const workflowCommandBridgeStore = create<WorkflowCommandBridge>(() => ({
  ...INACTIVE_BRIDGE,
}));

export const deactivateWorkflowCommandBridge = () => {
  workflowCommandBridgeStore.setState({ ...INACTIVE_BRIDGE });
};
