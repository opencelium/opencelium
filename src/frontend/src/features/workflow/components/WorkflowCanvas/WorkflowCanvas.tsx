import { Controls, ReactFlow } from '@xyflow/react';
import { useRef } from 'react';
import type {
  WorkflowEdgeModel,
  WorkflowNodeModel,
} from '../../types/workflow.types';
import type { WorkflowCanvasProps } from './WorkflowCanvas.types';
import { workflowEdgeTypes, workflowNodeTypes } from './workflowCanvasTypes';
import { prepareWorkflowElements, type PrepareWorkflowCache } from './prepareWorkflowElements';
import { useWorkflowCanvasViewport } from './useWorkflowCanvasViewport';
import { useStableWorkflowCanvasActions } from './useStableWorkflowCanvasActions';

export function WorkflowCanvas({
  nodes,
  edges,
  isAnyNodeDragging = false,
  activeAction,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeDragStart,
  onNodeDrag,
  onNodeDragStop,
  onOpenAddStep,
  onOpenContextMenu,
  onNodeDoubleClick,
  onDeleteNode,
  onOpenAggregatorEditor,
  onPaneClick,
  restoredViewport,
  viewportRestoreVersion = 0,
  centerStartVersion = 0,
  onInit,
  children,
}: WorkflowCanvasProps) {
  const prepareCacheRef = useRef<PrepareWorkflowCache>({ nodes: new Map(), edges: new Map() });

  const stableActions = useStableWorkflowCanvasActions({
    onOpenAddStep, onOpenContextMenu, onDeleteNode, onOpenAggregatorEditor,
  });

  const { preparedEdges, preparedNodes } = prepareWorkflowElements({
    nodes,
    edges,
    activeAction,
    isAnyNodeDragging,
    ...stableActions,
    cache: prepareCacheRef.current,
  });
  const { handleInit } = useWorkflowCanvasViewport({ nodes, restoredViewport,
    viewportRestoreVersion, centerStartVersion, onInit });

  return (
    <div className="canvasCard">
      <ReactFlow<WorkflowNodeModel, WorkflowEdgeModel>
        nodes={preparedNodes}
        edges={preparedEdges}
        proOptions={{ hideAttribution: true }}
        onInit={handleInit}
        nodeTypes={workflowNodeTypes}
        edgeTypes={workflowEdgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        nodeDragThreshold={4}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        selectionOnDrag={false}
        selectionKeyCode={null}
        deleteKeyCode={null}
        panOnDrag
        zoomOnScroll
      >
        {children}
        <Controls position="top-left" className="workflowControls" />
      </ReactFlow>
    </div>
  );
}
