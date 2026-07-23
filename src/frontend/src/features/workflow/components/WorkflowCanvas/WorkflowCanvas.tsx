import { Controls, ReactFlow } from '@xyflow/react';
import type { ReactFlowInstance } from '@xyflow/react';
import { useCallback, useEffect, useRef } from 'react';
import type {
  WorkflowEdgeModel,
  WorkflowNodeModel,
} from '../../types/workflow.types';
import type { WorkflowCanvasProps } from './WorkflowCanvas.types';
import { workflowEdgeTypes, workflowNodeTypes } from './workflowCanvasTypes';
import { prepareWorkflowElements, type PrepareWorkflowCache } from './prepareWorkflowElements';

const START_NODE_SIZE = 62;

const centerStartNode = (
  instance: ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel> | null,
  nodes: WorkflowNodeModel[],
  zoom: number,
) => {
  const startNode = nodes.find((node) => node.type === 'start');
  if (!startNode || !instance) return;

  requestAnimationFrame(() => {
    instance.setCenter(
      startNode.position.x + START_NODE_SIZE / 2,
      startNode.position.y + START_NODE_SIZE / 2,
      { zoom, duration: 0 },
    );
  });
};

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
  const reactFlowInstance = useRef<ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel> | null>(null);
  const restoredViewportKey = restoredViewport
    ? `${viewportRestoreVersion}:${restoredViewport.x}:${restoredViewport.y}:${restoredViewport.zoom}`
    : undefined;
  const appliedViewportKey = useRef<string | undefined>(undefined);
  const centeredStartVersion = useRef<number>(0);
  const prepareCacheRef = useRef<PrepareWorkflowCache>({ nodes: new Map(), edges: new Map() });

  const callbacksRef = useRef({ onOpenAddStep, onOpenContextMenu, onDeleteNode, onOpenAggregatorEditor });
  callbacksRef.current = { onOpenAddStep, onOpenContextMenu, onDeleteNode, onOpenAggregatorEditor };
  const stableOnOpenAddStep = useCallback<NonNullable<typeof onOpenAddStep>>((...args) => callbacksRef.current.onOpenAddStep?.(...args), []);
  const stableOnOpenContextMenu = useCallback<NonNullable<typeof onOpenContextMenu>>((...args) => callbacksRef.current.onOpenContextMenu?.(...args), []);
  const stableOnDeleteNode = useCallback<NonNullable<typeof onDeleteNode>>((...args) => callbacksRef.current.onDeleteNode?.(...args), []);
  const stableOnOpenAggregatorEditor = useCallback<NonNullable<typeof onOpenAggregatorEditor>>((...args) => callbacksRef.current.onOpenAggregatorEditor?.(...args), []);

  const { preparedEdges, preparedNodes } = prepareWorkflowElements({
    nodes,
    edges,
    activeAction,
    isAnyNodeDragging,
    onOpenAddStep: stableOnOpenAddStep,
    onOpenContextMenu: stableOnOpenContextMenu,
    onDeleteNode: stableOnDeleteNode,
    onOpenAggregatorEditor: stableOnOpenAggregatorEditor,
    cache: prepareCacheRef.current,
  });

  useEffect(() => {
    if (!restoredViewport || !reactFlowInstance.current) return;
    if (appliedViewportKey.current === restoredViewportKey) return;
    appliedViewportKey.current = restoredViewportKey;
    requestAnimationFrame(() => {
      reactFlowInstance.current?.setViewport(restoredViewport, { duration: 0 });
    });
  }, [restoredViewport, restoredViewportKey]);

  useEffect(() => {
    if (!centerStartVersion || centeredStartVersion.current === centerStartVersion) return;
    if (!reactFlowInstance.current) return;
    centeredStartVersion.current = centerStartVersion;
    centerStartNode(reactFlowInstance.current, nodes, restoredViewport?.zoom ?? 1);
  }, [centerStartVersion, nodes, restoredViewport?.zoom]);

  return (
    <div className="canvasCard">
      <ReactFlow<WorkflowNodeModel, WorkflowEdgeModel>
        nodes={preparedNodes}
        edges={preparedEdges}
        proOptions={{ hideAttribution: true }}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
          onInit?.(instance);
          if (centerStartVersion && centeredStartVersion.current !== centerStartVersion) {
            centeredStartVersion.current = centerStartVersion;
            centerStartNode(instance, nodes, restoredViewport?.zoom ?? 1);
          }
        }}
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
