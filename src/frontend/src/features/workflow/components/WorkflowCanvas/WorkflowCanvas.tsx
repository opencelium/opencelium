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

// Where the graph's top-left-most point lands in the viewport on open —
// offset from the pane's top-left corner rather than dead center, clear of
// the top-left zoom Controls.
const GRAPH_VIEWPORT_OFFSET = { x: 200, y: 140 };

// Some workflows have nodes positioned above/left of the start node (e.g. a
// branch dragged upward), so anchoring on the start node alone can push that
// node off-screen above/left of the viewport. Anchor on the whole graph's
// bounding-box corner instead — `node.position` is already each node's own
// top-left corner, so the min across all nodes is the graph's top-left corner.
const positionGraphNearTopLeft = (
  instance: ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel> | null,
  nodes: WorkflowNodeModel[],
  zoom: number,
) => {
  if (!instance || nodes.length === 0) return;

  const minX = Math.min(...nodes.map((node) => node.position.x));
  const minY = Math.min(...nodes.map((node) => node.position.y));

  requestAnimationFrame(() => {
    instance.setViewport(
      {
        x: GRAPH_VIEWPORT_OFFSET.x - minX * zoom,
        y: GRAPH_VIEWPORT_OFFSET.y - minY * zoom,
        zoom,
      },
      { duration: 0 },
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
    positionGraphNearTopLeft(reactFlowInstance.current, nodes, restoredViewport?.zoom ?? 1);
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
            positionGraphNearTopLeft(instance, nodes, restoredViewport?.zoom ?? 1);
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
