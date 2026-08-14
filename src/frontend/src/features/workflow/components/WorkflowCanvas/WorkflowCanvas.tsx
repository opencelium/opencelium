import { Controls, Panel, ReactFlow } from '@xyflow/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  WorkflowEdgeModel,
  WorkflowNodeModel,
} from '../../types/workflow.types';
import type { WorkflowCanvasProps } from './WorkflowCanvas.types';
import { workflowEdgeTypes, workflowNodeTypes } from './workflowCanvasTypes';
import { prepareWorkflowElements, type PrepareWorkflowCache } from './prepareWorkflowElements';
import { useWorkflowCanvasViewport } from './useWorkflowCanvasViewport';
import { useStableWorkflowCanvasActions } from './useStableWorkflowCanvasActions';
import { useTestRun } from '../../test-run/useTestRun';
import { EMPTY_TEST_RUN_SCOPE, getTestRunScope } from './testRunScope.utils';
import { TestRunAnimationHint } from './TestRunAnimationHint';
import { TestRunSpeedControl } from './TestRunSpeedControl';

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

  const testRun = useTestRun();
  const isEditLocked = !!testRun && testRun.phase !== 'idle';
  const currentStep = testRun?.isLiveAnimation ? null : testRun?.currentStep ?? null;
  const testRunScope = useMemo(() => testRun?.liveGraphStatus
    ? getTestRunScope(nodes, edges, testRun.liveGraphStatus, currentStep)
    : EMPTY_TEST_RUN_SCOPE, [nodes, edges, testRun?.liveGraphStatus, currentStep]);
  const [testRunFailureDismissed, setTestRunFailureDismissed] = useState(false);
  useEffect(() => {
    if (testRun?.errorRevealNonce) setTestRunFailureDismissed(false);
  }, [testRun?.errorRevealNonce]);
  useEffect(() => {
    const dismissFailure = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTestRunFailureDismissed(true);
    };
    window.addEventListener('keydown', dismissFailure);
    return () => window.removeEventListener('keydown', dismissFailure);
  }, []);

  const { preparedEdges, preparedNodes } = prepareWorkflowElements({
    nodes,
    edges,
    activeAction,
    isAnyNodeDragging,
    ...stableActions,
    cache: prepareCacheRef.current,
    testRunScope,
    isEditLocked,
    testRunFailureDismissed,
  });
  const { handleInit, instanceRef } = useWorkflowCanvasViewport({ nodes, restoredViewport,
    viewportRestoreVersion, centerStartVersion, onInit });
  const revealedFailureNonce = useRef(0);
  useEffect(() => {
    const nonce = testRun?.errorRevealNonce;
    if (!nonce || revealedFailureNonce.current === nonce) return;
    const failedNodeId = [...testRunScope.failedNodeIds][0];
    if (!failedNodeId || !instanceRef.current) return;
    revealedFailureNonce.current = nonce;
    instanceRef.current.fitView({ nodes: [{ id: failedNodeId }], duration: 600, maxZoom: 1.5 });
  }, [instanceRef, testRun?.errorRevealNonce, testRunScope]);

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
        onConnect={isEditLocked ? undefined : onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
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
        <Panel position="top-left" className="canvasTopLeftPanel">
          <Controls className="workflowControls" />
          <TestRunSpeedControl />
        </Panel>
      </ReactFlow>
      <TestRunAnimationHint />
    </div>
  );
}
