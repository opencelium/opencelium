import { Controls, MarkerType, Panel, ReactFlow } from '@xyflow/react';
import type { ReactFlowInstance } from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  WorkflowEdgeModel,
  WorkflowNodeModel,
} from '../../types/workflow.types';
import { useTestRun } from '../../test-run/useTestRun';
import type { WorkflowCanvasProps } from './WorkflowCanvas.types';
import { workflowEdgeTypes, workflowNodeTypes } from './workflowCanvasTypes';
import { prepareWorkflowElements, type PrepareWorkflowCache } from './prepareWorkflowElements';
import { EMPTY_TEST_RUN_SCOPE, getTestRunScope } from './testRunScope.utils';
import { TestRunAnimationHint } from './TestRunAnimationHint';
import { TestRunDebugControls } from './TestRunDebugControls';

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
  jointSourceId,
  jointTargetIds,
  onConfirmJoint,
  onCancelJoint,
  onRemoveJoint,
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

  // null outside a TestRunProvider (e.g. a canvas reused without the page wiring).
  const testRun = useTestRun();
  // While a test run is actively RUNNING (starting/running/stopping, and not
  // paused) the graph must not be editable — the payload was already sent to
  // the backend, so any edit would silently diverge from what is actually
  // executing. Pausing the replay (see TestRunProvider.pauseAnimation) is
  // treated the same as idle here: the backend keeps executing in the
  // background regardless, but a paused debugging session is exactly when the
  // user wants to inspect/adjust the graph again — double-click still opens
  // MethodConfigDialog in a read-only mode for CONNECTOR/method nodes though
  // (see index.tsx), since persisting a config edit mid-execution would still
  // diverge from what the backend is actually running.
  const isEditLocked = !!testRun && testRun.phase !== 'idle' && !testRun.isPaused;
  const liveGraphStatus = testRun?.liveGraphStatus;
  // In live mode there is no "currently executing" token to show at all — no
  // dot, no node ring, no iteration counter, no branch label — only the
  // failure marking (if any) still renders. Passing a null step reuses
  // getTestRunScope's own "nothing is current" fallback, which already
  // returns exactly that (see its EMPTY_TEST_RUN_SCOPE-with-failures branch).
  const currentStep = testRun?.isLiveAnimation ? null : testRun?.currentStep ?? null;
  const testRunScope = useMemo(
    () => (liveGraphStatus ? getTestRunScope(nodes, edges, liveGraphStatus, currentStep) : EMPTY_TEST_RUN_SCOPE),
    [nodes, edges, liveGraphStatus, currentStep],
  );

  const callbacksRef = useRef({ onOpenAddStep, onOpenContextMenu, onDeleteNode, onOpenAggregatorEditor, onRemoveJoint });
  callbacksRef.current = { onOpenAddStep, onOpenContextMenu, onDeleteNode, onOpenAggregatorEditor, onRemoveJoint };
  const stableOnOpenAddStep = useCallback<NonNullable<typeof onOpenAddStep>>((...args) => callbacksRef.current.onOpenAddStep?.(...args), []);
  const stableOnOpenContextMenu = useCallback<NonNullable<typeof onOpenContextMenu>>((...args) => callbacksRef.current.onOpenContextMenu?.(...args), []);
  const stableOnDeleteNode = useCallback<NonNullable<typeof onDeleteNode>>((...args) => callbacksRef.current.onDeleteNode?.(...args), []);
  const stableOnOpenAggregatorEditor = useCallback<NonNullable<typeof onOpenAggregatorEditor>>((...args) => callbacksRef.current.onOpenAggregatorEditor?.(...args), []);
  const stableOnRemoveJoint = useCallback((nodeId: string) => callbacksRef.current.onRemoveJoint?.(nodeId), []);

  // The failed node's red ring + pulse (testRunScope.utils.ts) otherwise stays
  // up for the rest of the run, but the user can dismiss it early with
  // Escape. Re-armed on the next failure (nonce bump) so a second failed run
  // shows its own highlight even if the first was dismissed.
  const [testRunFailureDismissed, setTestRunFailureDismissed] = useState(false);
  useEffect(() => {
    if (testRun?.errorRevealNonce) setTestRunFailureDismissed(false);
  }, [testRun?.errorRevealNonce]);
  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTestRunFailureDismissed(true);
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, []);

  const { preparedEdges, preparedNodes } = prepareWorkflowElements({
    nodes,
    edges,
    activeAction,
    isAnyNodeDragging,
    onOpenAddStep: stableOnOpenAddStep,
    onOpenContextMenu: stableOnOpenContextMenu,
    onDeleteNode: stableOnDeleteNode,
    onOpenAggregatorEditor: stableOnOpenAggregatorEditor,
    jointSourceId,
    jointTargetIds,
    onRemoveJoint: stableOnRemoveJoint,
    cache: prepareCacheRef.current,
    testRunScope,
    isEditLocked,
    testRunFailureDismissed,
  });

  const nodeIdSet = new Set(nodes.map((node) => node.id));
  const jumpEdges = nodes.flatMap((node) => {
    const targetId = node.data.jumpTo;
    if (!targetId || targetId === node.id || !nodeIdSet.has(targetId)) return [];
    return [{
      id: `jump-${node.id}`,
      source: node.id,
      target: targetId,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'default',
      selectable: false,
      deletable: false,
      focusable: false,
      animated: false,
      style: { stroke: 'var(--color-status-success-fg, #52c41a)', strokeWidth: 1.5, strokeDasharray: '5 4' },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-status-success-fg, #52c41a)' },
      data: { jump: true },
    }];
  });
  const renderedEdges = [...preparedEdges, ...jumpEdges] as unknown as WorkflowEdgeModel[];

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

  // errorRevealNonce bumps once per failed run (after the same ~1.5s pause the
  // logs panel waits out before revealing the failing element — see
  // TestRunProvider). By then testRunScope.failedNodeIds already reflects the
  // failure, so pan the canvas to it too. Guarded by nonce so this only fires
  // once per failure, not on every render while the nonce stays the same.
  const revealedFailureNonce = useRef(0);
  useEffect(() => {
    const nonce = testRun?.errorRevealNonce;
    if (!nonce || revealedFailureNonce.current === nonce) return;
    const failedNodeId = [...testRunScope.failedNodeIds][0];
    if (!failedNodeId || !reactFlowInstance.current) return;
    revealedFailureNonce.current = nonce;
    reactFlowInstance.current.fitView({ nodes: [{ id: failedNodeId }], duration: 600, maxZoom: 1.5 });
  }, [testRun?.errorRevealNonce, testRunScope]);

  return (
    <div className="canvasCard">
      <ReactFlow<WorkflowNodeModel, WorkflowEdgeModel>
        nodes={preparedNodes}
        edges={renderedEdges}
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
        onConnect={isEditLocked ? undefined : onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={(_, node) => {
          if (!jointSourceId) return;
          if (jointTargetIds?.has(node.id)) onConfirmJoint?.(node.id);
          else onCancelJoint?.();
        }}
        onNodeDoubleClick={isEditLocked ? undefined : onNodeDoubleClick}
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
        {/* One top-left Panel hosts both the zoom Controls and the test-run
            debug controls (pause/play + speed, see TestRunDebugControls) as
            flex siblings, so the debug card docks to the right of Controls
            instead of below them — Controls' own position:absolute is
            neutralized (see .workflowControls in canvas-controls.css) so it
            participates in this flex row rather than positioning itself. */}
        <Panel position="top-left" className="canvasTopLeftPanel">
          <Controls className="workflowControls" />
          <TestRunDebugControls />
        </Panel>
      </ReactFlow>
      <TestRunAnimationHint />
    </div>
  );
}
