import { useRef, useState } from 'react';
import { addEdge, useEdgesState, useNodesState } from '@xyflow/react';
import type { Connection } from '@xyflow/react';
import type { ReactFlowInstance, Viewport } from '@xyflow/react';
import type { InvokerOperation } from '@entities/invoker/model/types';
import { initialEdges, initialNodes } from './data/initialGraph';
import type { WorkflowAction, WorkflowContextMenu, WorkflowEdgeModel, WorkflowNodeModel } from './types/workflow.types';
import type { WorkflowConditionEditorState, WorkflowMethodConfig, WorkflowMethodEditorState } from './types/request-config.types';
import type { ConditionConfig } from './components/condition-builder/conditionBuilder.types';
import { ALL_COLORS } from './constants/colors';
import { createNodeFromAction, deleteNodeGraph } from './utils/graphUtils';
import { getOperatorBottomBranch } from './utils/graph.traversal';
import {
  moveOrCopyWorkflowNodes,
  type InvalidReference,
  type WorkflowDropMode,
  type WorkflowDropResult,
} from './utils/graph.dragDrop';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type UseWorkflowPageOptions = {
  onDeleteNodes?: (deletedNodeIds: string[], previousNodes: WorkflowNodeModel[]) => void;
  fieldBindings?: any[];
  onFieldBindingsChange?: (fieldBindings: any[] | undefined) => void;
  confirmDependencyDrop?: (invalidReferences: InvalidReference[]) => Promise<boolean>;
};

type DragDropTarget = {
  edge?: WorkflowEdgeModel;
  target: { nodeId: string; direction: 'right' | 'bottom' };
  distance: number;
};

const DROP_EDGE_MAX_DISTANCE = 90;
const DROP_LEAF_MAX_DISTANCE = 70;
const DRAG_GHOST_PREFIX = '__workflow-drag-ghost__';
const DROP_PLACEHOLDER_PREFIX = '__workflow-drop-placeholder__';
const COPY_PREVIEW_PREFIX = '__workflow-copy-preview__';

export function useWorkflowPage(options: UseWorkflowPageOptions = {}) {
  const confirm = useConfirm();
  const { t } = useI18n('workflow');
  const reactFlowInstance = useRef<ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel> | null>(null);
  const dragSnapshot = useRef<{
    nodes: WorkflowNodeModel[];
    edges: WorkflowEdgeModel[];
    mode: WorkflowDropMode;
    operatorConfigs: Map<string, ConditionConfig>;
    highlightedNodeIds: Set<string>;
    highlightedEdgeIds: Set<string>;
    previewEdgeKey?: string;
    activeDropTarget?: DragDropTarget;
  } | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNodeModel>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowEdgeModel>(initialEdges);
  const [sidebarAction, setSidebarAction] = useState<WorkflowAction | null>(null);
  const [contextMenu, setContextMenu] = useState<WorkflowContextMenu | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [methodEditor, setMethodEditor] = useState<WorkflowMethodEditorState | null>(null);
  const [conditionEditor, setConditionEditor] = useState<WorkflowConditionEditorState | null>(null);
  const [restoredViewport, setRestoredViewport] = useState<Viewport | undefined>();
  const [viewportRestoreVersion, setViewportRestoreVersion] = useState(0);
  const [centerStartVersion, setCenterStartVersion] = useState(1);

  const stabilizeMethodColors = (sourceNodes: WorkflowNodeModel[]) => {
    let methodIndex = 0;
    const usedColors = new Set<string>();
    return sourceNodes.map((item) => {
      if (item.type !== 'connector' && item.type !== 'system') return item;
      let color = item.data.color;
      if (!color || usedColors.has(color.toLowerCase())) {
        color = ALL_COLORS.find((candidate) => !usedColors.has(candidate.toLowerCase()))
          ?? ALL_COLORS[methodIndex % ALL_COLORS.length];
      }
      usedColors.add(color.toLowerCase());
      methodIndex += 1;
      if (item.data.color === color) return item;
      return {
        ...item,
        data: {
          ...item.data,
          color,
        },
      };
    });
  };

  const restoreStableNodeData = (
    nextNodes: WorkflowNodeModel[],
    previousNodes: WorkflowNodeModel[],
    operatorConfigs?: Map<string, ConditionConfig>,
  ) => {
    const stablePreviousNodes = stabilizeMethodColors(previousNodes);
    const previousById = new Map(stablePreviousNodes.map((item) => [item.id, item]));
    return nextNodes.map((item) => {
      const savedConfig = operatorConfigs?.get(item.id);
      const previous = previousById.get(item.id);
      if ((item.type === 'connector' || item.type === 'system')) {
        const color = previous?.data.color ?? item.data.color;
        if (!color) return item;
        return {
          ...item,
          data: {
            ...item.data,
            color,
          },
        };
      }
      if (item.type !== 'if' && item.type !== 'loop') return item;
      const conditionConfig = item.data.conditionConfig ?? savedConfig ?? previous?.data.conditionConfig;
      if (!conditionConfig) return item;
      return {
        ...item,
        data: {
          ...item.data,
          conditionConfig,
        },
      };
    });
  };

  const clearDragFlags = (sourceNodes: WorkflowNodeModel[]) => sourceNodes.map((item) => ({
    ...item,
    data: {
      ...item.data,
      highlighted: false,
      dropTarget: false,
      dropInvalid: false,
    },
  }));

  const clearDragPreviewNodes = (sourceNodes: WorkflowNodeModel[]) =>
    sourceNodes.filter((item) => !item.data.dragGhost && !item.data.dropPlaceholder);

  const clearDragPreviewEdges = (sourceEdges: WorkflowEdgeModel[]) =>
    sourceEdges.filter((item) => !item.data?.dragGhost && !item.data?.dropPlaceholder);

  const clearEdgeDragFlags = (sourceEdges: WorkflowEdgeModel[]) => sourceEdges.map((item) => ({
    ...item,
    data: {
      ...item.data,
      highlighted: false,
      dropTarget: false,
      dropInvalid: false,
    },
  }));

  const mapEdgeIds = (
    sourceEdges: WorkflowEdgeModel[],
    nodeIds: Set<string>,
    idPrefix: string,
    dataPatch: Partial<WorkflowEdgeModel['data']>,
  ) => sourceEdges
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map((edge) => ({
      ...edge,
      id: `${idPrefix}${edge.id}`,
      source: `${idPrefix}${edge.source}`,
      target: `${idPrefix}${edge.target}`,
      selected: false,
      data: {
        ...edge.data,
        ...dataPatch,
        highlighted: false,
        dropTarget: false,
        dropInvalid: false,
      },
    })) as WorkflowEdgeModel[];

  const findDropTarget = (
    event: { clientX?: number; clientY?: number } | undefined,
    sourceNodeId: string,
    snapshotNodes: WorkflowNodeModel[],
    snapshotEdges: WorkflowEdgeModel[],
  ) => {
    const instance = reactFlowInstance.current;
    if (!instance || typeof event?.clientX !== 'number' || typeof event?.clientY !== 'number') return undefined;
    const point = instance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const nodeById = new Map(snapshotNodes.map((item) => [item.id, item]));
    const source = nodeById.get(sourceNodeId);
    const sourceBranch = source && (source.type === 'if' || source.type === 'loop')
      ? getOperatorBottomBranch(source.id, snapshotNodes, snapshotEdges)
      : { nodeIds: new Set<string>() };
    const movedNodeIds = new Set([sourceNodeId, ...sourceBranch.nodeIds]);

    const closestEdge = snapshotEdges
      .filter((edge) => !movedNodeIds.has(edge.source) && !movedNodeIds.has(edge.target))
      .map<DragDropTarget | undefined>((edge) => {
        const sourceNode = nodeById.get(edge.source);
        const targetNode = nodeById.get(edge.target);
        if (!sourceNode || !targetNode || sourceNode.type === 'start' && targetNode.type === 'start') return undefined;
        const sourceWidth = sourceNode.measured?.width ?? sourceNode.width ?? 80;
        const sourceHeight = sourceNode.measured?.height ?? sourceNode.height ?? 80;
        const targetWidth = targetNode.measured?.width ?? targetNode.width ?? 80;
        const targetHeight = targetNode.measured?.height ?? targetNode.height ?? 80;
        const sourceCenter = {
          x: sourceNode.position.x + sourceWidth / 2,
          y: sourceNode.position.y + sourceHeight / 2,
        };
        const targetCenter = {
          x: targetNode.position.x + targetWidth / 2,
          y: targetNode.position.y + targetHeight / 2,
        };
        const mid = {
          x: (sourceCenter.x + targetCenter.x) / 2,
          y: (sourceCenter.y + targetCenter.y) / 2,
        };
        const distance = Math.hypot(point.x - mid.x, point.y - mid.y);
        const direction = edge.targetHandle === 'top' || edge.sourceHandle === 'true' || edge.sourceHandle === 'bottom'
          ? 'bottom'
          : 'right';
        return { edge, target: { nodeId: edge.source, direction } as const, distance };
      })
      .filter((item): item is DragDropTarget => item !== undefined)
      .sort((left, right) => left.distance - right.distance)[0];
    if (closestEdge && closestEdge.distance <= DROP_EDGE_MAX_DISTANCE) return closestEdge;

    return snapshotNodes
      .filter((item) => item.type !== 'start' && !movedNodeIds.has(item.id))
      .map((item) => {
        const width = item.measured?.width ?? item.width ?? 80;
        const height = item.measured?.height ?? item.height ?? 80;
        const center = {
          x: item.position.x + width / 2,
          y: item.position.y + height / 2,
        };
        const direction = (item.type === 'if' || item.type === 'loop') && Math.abs(point.x - center.x) < width && point.y > center.y
          ? 'bottom'
          : 'right';
        const anchor = direction === 'bottom'
          ? { x: center.x, y: item.position.y + height + 30 }
          : { x: item.position.x + width + 30, y: center.y };
        return {
          target: { nodeId: item.id, direction } as const,
          distance: Math.hypot(point.x - anchor.x, point.y - anchor.y),
        };
      })
      .filter((item): item is DragDropTarget => Boolean(item))
      .sort((left, right) => left.distance - right.distance)
      .find((item) => item.distance <= DROP_LEAF_MAX_DISTANCE);
  };

  const resolveStickyDropTarget = (
    snapshot: NonNullable<typeof dragSnapshot.current>,
    nextDropTarget: DragDropTarget | undefined,
  ) => {
    const activeEdge = snapshot.activeDropTarget?.edge;
    if (
      activeEdge &&
      nextDropTarget &&
      !nextDropTarget.edge &&
      nextDropTarget.target.direction === 'right' &&
      nextDropTarget.target.nodeId === activeEdge.target
    ) {
      return snapshot.activeDropTarget;
    }
    snapshot.activeDropTarget = nextDropTarget;
    return nextDropTarget;
  };

  const getDragSubtreeNodeIds = (
    sourceNodeId: string,
    sourceNodes: WorkflowNodeModel[],
    sourceEdges: WorkflowEdgeModel[],
  ) => {
    const source = sourceNodes.find((item) => item.id === sourceNodeId);
    if (!source) return new Set<string>();
    if (source.type !== 'if' && source.type !== 'loop') return new Set([sourceNodeId]);
    return new Set([sourceNodeId, ...getOperatorBottomBranch(source.id, sourceNodes, sourceEdges).nodeIds]);
  };

  const buildCopyGhostNodes = (
    sourceNodeId: string,
    draggedNode: WorkflowNodeModel,
    sourceNodes: WorkflowNodeModel[],
    sourceEdges: WorkflowEdgeModel[],
  ) => {
    const source = sourceNodes.find((item) => item.id === sourceNodeId);
    if (!source) return [];
    const delta = {
      x: draggedNode.position.x - source.position.x,
      y: draggedNode.position.y - source.position.y,
    };
    const subtreeIds = getDragSubtreeNodeIds(sourceNodeId, sourceNodes, sourceEdges);

    return sourceNodes
      .filter((item) => subtreeIds.has(item.id))
      .map((item) => ({
        ...item,
        id: `${DRAG_GHOST_PREFIX}${item.id}`,
        selected: false,
        draggable: false,
        selectable: false,
        position: {
          x: item.position.x + delta.x,
          y: item.position.y + delta.y,
        },
        data: {
          ...item.data,
          dragGhost: true,
          highlighted: false,
          dropTarget: false,
          dropInvalid: false,
          suppressHoverAddControls: true,
          lockVisibleAddControls: false,
        },
      })) as WorkflowNodeModel[];
  };

  const buildCopyGhostEdges = (
    sourceNodeId: string,
    sourceNodes: WorkflowNodeModel[],
    sourceEdges: WorkflowEdgeModel[],
  ) => mapEdgeIds(
    sourceEdges,
    getDragSubtreeNodeIds(sourceNodeId, sourceNodes, sourceEdges),
    DRAG_GHOST_PREFIX,
    { dragGhost: true },
  );

  const getPreviewPlaceholderIds = (
    sourceNodeId: string,
    snapshotNodes: WorkflowNodeModel[],
    snapshotEdges: WorkflowEdgeModel[],
    previewNodes: WorkflowNodeModel[],
    mode: WorkflowDropMode,
  ) => {
    if (mode === 'move') return getDragSubtreeNodeIds(sourceNodeId, snapshotNodes, snapshotEdges);
    const snapshotIds = new Set(snapshotNodes.map((item) => item.id));
    return new Set(previewNodes.filter((item) => !snapshotIds.has(item.id)).map((item) => item.id));
  };

  const buildDropPlaceholderNodes = (
    previewNodes: WorkflowNodeModel[],
    placeholderIds: Set<string>,
    invalid: boolean,
  ) => previewNodes
    .filter((item) => placeholderIds.has(item.id))
    .map((item) => ({
      ...item,
      id: `${DROP_PLACEHOLDER_PREFIX}${item.id}`,
      selected: false,
      draggable: false,
      selectable: false,
      data: {
        ...item.data,
        title: '',
        subtitle: '',
        dragGhost: false,
        dropPlaceholder: true,
        highlighted: false,
        dropTarget: true,
        dropInvalid: invalid,
        suppressHoverAddControls: true,
        lockVisibleAddControls: false,
      },
    })) as WorkflowNodeModel[];

  const buildDropPlaceholderEdges = (
    previewEdges: WorkflowEdgeModel[],
    placeholderIds: Set<string>,
    invalid: boolean,
  ) => previewEdges
    .filter((edge) => placeholderIds.has(edge.source) || placeholderIds.has(edge.target))
    .map((edge) => ({
      ...edge,
      id: `${DROP_PLACEHOLDER_PREFIX}${edge.id}`,
      source: placeholderIds.has(edge.source) ? `${DROP_PLACEHOLDER_PREFIX}${edge.source}` : edge.source,
      target: placeholderIds.has(edge.target) ? `${DROP_PLACEHOLDER_PREFIX}${edge.target}` : edge.target,
      selected: false,
      data: {
        ...edge.data,
        dragGhost: false,
        dropPlaceholder: true,
        highlighted: false,
        dropTarget: true,
        dropInvalid: invalid,
      },
    })) as WorkflowEdgeModel[];

  const buildCopyDragNodes = (
    sourceNodeId: string,
    draggedNode: WorkflowNodeModel,
    snapshotNodes: WorkflowNodeModel[],
    snapshotEdges: WorkflowEdgeModel[],
    preview?: WorkflowDropResult,
    invalid = false,
  ) => {
    const placeholderIds = preview
      ? getPreviewPlaceholderIds(sourceNodeId, snapshotNodes, snapshotEdges, preview.nodes, 'copy')
      : new Set<string>();
    const baseNodes = clearDragPreviewNodes(preview?.nodes ?? snapshotNodes)
      .filter((item) => !placeholderIds.has(item.id))
      .map((item) => ({
      ...item,
      data: {
        ...item.data,
        highlighted: false,
        dropTarget: false,
        dropInvalid: false,
      },
    }));
    const ghostNodes = buildCopyGhostNodes(sourceNodeId, draggedNode, snapshotNodes, snapshotEdges);
    const placeholderNodes = preview ? buildDropPlaceholderNodes(preview.nodes, placeholderIds, invalid) : [];
    return [...baseNodes, ...ghostNodes, ...placeholderNodes];
  };

  const buildDragPreviewEdges = (
    sourceNodeId: string,
    snapshotNodes: WorkflowNodeModel[],
    snapshotEdges: WorkflowEdgeModel[],
    mode: WorkflowDropMode,
    preview?: WorkflowDropResult,
    invalid = false,
  ) => {
    const placeholderIds = preview
      ? getPreviewPlaceholderIds(sourceNodeId, snapshotNodes, snapshotEdges, preview.nodes, mode)
      : new Set<string>();
    const baseEdges = clearDragPreviewEdges(preview?.edges ?? snapshotEdges)
      .filter((item) => !placeholderIds.has(item.source) && !placeholderIds.has(item.target))
      .map((item) => ({
      ...item,
      data: {
        ...item.data,
        highlighted: false,
        dropTarget: false,
        dropInvalid: false,
      },
    }));
    return [
      ...baseEdges,
      ...(mode === 'copy' ? buildCopyGhostEdges(sourceNodeId, snapshotNodes, snapshotEdges) : []),
      ...(preview ? buildDropPlaceholderEdges(preview.edges, placeholderIds, invalid) : []),
    ];
  };

  const buildMoveDragNodes = (
    sourceNodeId: string,
    currentNodes: WorkflowNodeModel[],
    snapshotNodes: WorkflowNodeModel[],
    snapshotEdges: WorkflowEdgeModel[],
    preview: WorkflowDropResult,
    invalid: boolean,
  ) => {
    const placeholderIds = getPreviewPlaceholderIds(sourceNodeId, snapshotNodes, snapshotEdges, preview.nodes, 'move');
    const currentById = new Map(clearDragPreviewNodes(currentNodes).map((item) => [item.id, item]));
    const movingNodes = [...placeholderIds]
      .map((id) => currentById.get(id))
      .filter((item): item is WorkflowNodeModel => Boolean(item));
    const baseNodes = clearDragPreviewNodes(preview.nodes)
      .filter((item) => !placeholderIds.has(item.id))
      .map((item) => ({
      ...item,
      data: {
        ...item.data,
        highlighted: false,
        dropTarget: false,
        dropInvalid: false,
      },
    }));
    return [
      ...baseNodes,
      ...movingNodes,
      ...buildDropPlaceholderNodes(preview.nodes, placeholderIds, invalid),
    ];
  };

  const restoreNoDropMoveNodes = (
    sourceNodeId: string,
    currentNodes: WorkflowNodeModel[],
    snapshotNodes: WorkflowNodeModel[],
    snapshotEdges: WorkflowEdgeModel[],
  ) => {
    const movedIds = getDragSubtreeNodeIds(sourceNodeId, snapshotNodes, snapshotEdges);
    const currentById = new Map(clearDragPreviewNodes(currentNodes).map((item) => [item.id, item]));
    return clearDragFlags(snapshotNodes.map((item) => {
      const current = currentById.get(item.id);
      if (!current || !movedIds.has(item.id)) return item;
      return {
        ...item,
        position: current.position,
        selected: current.selected,
      };
    }));
  };

  const stabilizeCopyPreviewIds = (
    sourceNodeId: string,
    snapshotNodes: WorkflowNodeModel[],
    snapshotEdges: WorkflowEdgeModel[],
    preview: WorkflowDropResult,
  ): WorkflowDropResult => {
    const snapshotIds = new Set(snapshotNodes.map((item) => item.id));
    const copiedNodes = preview.nodes.filter((item) => !snapshotIds.has(item.id));
    if (copiedNodes.length === 0) return preview;

    const sourceSubtreeIds = getDragSubtreeNodeIds(sourceNodeId, snapshotNodes, snapshotEdges);
    const sourceNodeIds = snapshotNodes.filter((item) => sourceSubtreeIds.has(item.id)).map((item) => item.id);
    const idMap = new Map(copiedNodes.map((item, index) => [
      item.id,
      `${COPY_PREVIEW_PREFIX}${sourceNodeIds[index] ?? index}`,
    ]));

    return {
      ...preview,
      nodes: preview.nodes.map((item) => idMap.has(item.id) ? { ...item, id: idMap.get(item.id) ?? item.id } : item),
      edges: preview.edges.map((item) => {
        const source = idMap.get(item.source) ?? item.source;
        const target = idMap.get(item.target) ?? item.target;
        if (source === item.source && target === item.target) return item;
        return {
          ...item,
          id: `edge-${source}-${target}-${item.sourceHandle ?? 'default'}-${item.targetHandle ?? 'default'}`,
          source,
          target,
        };
      }),
    };
  };

  const updateDragPreviewEdges = (
    snapshot: NonNullable<typeof dragSnapshot.current>,
    key: string,
    nextEdges: WorkflowEdgeModel[],
  ) => {
    if (snapshot.previewEdgeKey === key) return;
    snapshot.previewEdgeKey = key;
    setEdges(nextEdges);
  };

  return {
    nodes,
    edges,
    sidebarAction,
    contextMenu,
    historyOpen,
    methodEditor,
    conditionEditor,
    restoredViewport,
    viewportRestoreVersion,
    centerStartVersion,
    getViewport: () => reactFlowInstance.current?.getViewport(),
    setReactFlowInstance: (instance: ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel>) => {
      reactFlowInstance.current = instance;
    },
    onNodesChange,
    onEdgesChange,
    setContextMenu,
    setHistoryOpen,
    setSidebarAction,
    setMethodEditor,
    setConditionEditor,
    setWorkflowGraph: (
      nextNodes: WorkflowNodeModel[],
      nextEdges: WorkflowEdgeModel[],
      nextViewport?: Viewport,
      options?: { centerStart?: boolean },
    ) => {
      setNodes(nextNodes);
      setEdges(nextEdges);
      setRestoredViewport(nextViewport);
      if (nextViewport) setViewportRestoreVersion((version) => version + 1);
      if (options?.centerStart) setCenterStartVersion((version) => version + 1);
    },
    onConnect: (connection: Connection) => setEdges((currentEdges) => addEdge({ ...connection, type: 'workflow-edge' }, currentEdges) as WorkflowEdgeModel[]),
    onNodeDragStart: (event: any, node: WorkflowNodeModel) => {
      const stableNodes = stabilizeMethodColors(nodes);
      const draggedNode = stableNodes.find((item) => item.id === node.id);
      const highlightedBranch = draggedNode && (draggedNode.type === 'if' || draggedNode.type === 'loop')
        ? getOperatorBottomBranch(draggedNode.id, stableNodes, edges)
        : { nodeIds: new Set<string>(), edgeIds: new Set<string>() };
      dragSnapshot.current = {
        nodes: stableNodes,
        edges,
        mode: event?.ctrlKey ? 'copy' : 'move',
        operatorConfigs: new Map(
          stableNodes
            .filter((item) => (item.type === 'if' || item.type === 'loop') && item.data.conditionConfig)
            .map((item) => [item.id, item.data.conditionConfig as ConditionConfig]),
        ),
        highlightedNodeIds: highlightedBranch.nodeIds,
        highlightedEdgeIds: highlightedBranch.edgeIds,
      };
      if (highlightedBranch.nodeIds.size > 0) {
        setNodes((currentNodes) => currentNodes.map((item) => ({
          ...item,
          data: {
            ...item.data,
            highlighted: highlightedBranch.nodeIds.has(item.id),
          },
        })));
        setEdges((currentEdges) => currentEdges.map((item) => ({
          ...item,
          data: {
            ...item.data,
            highlighted: highlightedBranch.edgeIds.has(item.id),
          },
        })));
      }
    },
    onNodeDrag: (event: any, node: WorkflowNodeModel) => {
      const snapshot = dragSnapshot.current;
      if (!snapshot || node.type === 'start') return;
      const dropTarget = resolveStickyDropTarget(
        snapshot,
        findDropTarget(event, node.id, snapshot.nodes, snapshot.edges),
      );
      if (!dropTarget) {
        snapshot.activeDropTarget = undefined;
        if (snapshot.mode === 'copy') {
          setNodes(buildCopyDragNodes(node.id, node, snapshot.nodes, snapshot.edges));
          updateDragPreviewEdges(
            snapshot,
            `${snapshot.mode}:none`,
            buildDragPreviewEdges(node.id, snapshot.nodes, snapshot.edges, snapshot.mode),
          );
          return;
        }
        setNodes((currentNodes) => restoreNoDropMoveNodes(node.id, currentNodes, snapshot.nodes, snapshot.edges).map((item) => ({
          ...item,
          data: {
            ...item.data,
            highlighted: snapshot.highlightedNodeIds.has(item.id),
          },
        })));
        updateDragPreviewEdges(
          snapshot,
          `${snapshot.mode}:none`,
          clearEdgeDragFlags(snapshot.edges).map((item) => ({
            ...item,
            data: {
              ...item.data,
              highlighted: snapshot.highlightedEdgeIds.has(item.id),
            },
          })),
        );
        return;
      }
      const preview = moveOrCopyWorkflowNodes({
        sourceNodeId: node.id,
        target: dropTarget.target,
        mode: snapshot.mode,
        nodes: snapshot.nodes,
        edges: snapshot.edges,
        fieldBindings: options.fieldBindings,
      });
      if (snapshot.mode === 'copy') {
        const stablePreview = stabilizeCopyPreviewIds(node.id, snapshot.nodes, snapshot.edges, preview);
        setNodes(buildCopyDragNodes(
          node.id,
          node,
          snapshot.nodes,
          snapshot.edges,
          stablePreview,
          preview.invalidReferences.length > 0,
        ));
        updateDragPreviewEdges(
          snapshot,
          `${snapshot.mode}:${dropTarget.target.nodeId}:${dropTarget.target.direction}:${preview.invalidReferences.length > 0}`,
          buildDragPreviewEdges(node.id, snapshot.nodes, snapshot.edges, snapshot.mode, stablePreview, preview.invalidReferences.length > 0),
        );
        return;
      }
      setNodes((currentNodes) => buildMoveDragNodes(
        node.id,
        currentNodes,
        snapshot.nodes,
        snapshot.edges,
        preview,
        preview.invalidReferences.length > 0,
      ).map((item) => ({
        ...item,
        data: {
          ...item.data,
          highlighted: item.data.dropPlaceholder ? false : snapshot.highlightedNodeIds.has(item.id),
        },
      })));
      updateDragPreviewEdges(
        snapshot,
        `${snapshot.mode}:${dropTarget.target.nodeId}:${dropTarget.target.direction}:${preview.invalidReferences.length > 0}`,
        buildDragPreviewEdges(node.id, snapshot.nodes, snapshot.edges, snapshot.mode, preview, preview.invalidReferences.length > 0),
      );
    },
    onNodeDragStop: async (event: any, node: WorkflowNodeModel) => {
      const snapshot = dragSnapshot.current;
      dragSnapshot.current = null;
      if (!snapshot || node.type === 'start') return;

      const dropTarget = findDropTarget(event, node.id, snapshot.nodes, snapshot.edges);
      if (!dropTarget) {
        if (snapshot.mode === 'copy') {
          setNodes(clearDragFlags(snapshot.nodes));
        } else {
          setNodes((currentNodes) => restoreNoDropMoveNodes(node.id, currentNodes, snapshot.nodes, snapshot.edges));
        }
        setEdges(clearEdgeDragFlags(snapshot.edges));
        return;
      }
      const preview = moveOrCopyWorkflowNodes({
        sourceNodeId: node.id,
        target: dropTarget.target,
        mode: snapshot.mode,
        nodes: snapshot.nodes,
        edges: snapshot.edges,
        fieldBindings: options.fieldBindings,
      });

      let next = preview;
      if (preview.invalidReferences.length > 0) {
        setNodes(clearDragFlags(snapshot.nodes));
        setEdges(clearEdgeDragFlags(snapshot.edges));
        const ok = await options.confirmDependencyDrop?.(preview.invalidReferences);
        if (!ok) {
          setNodes(clearDragFlags(snapshot.nodes));
          setEdges(clearEdgeDragFlags(snapshot.edges));
          return;
        }
        next = moveOrCopyWorkflowNodes({
          sourceNodeId: node.id,
          target: dropTarget.target,
          mode: snapshot.mode,
          nodes: snapshot.nodes,
          edges: snapshot.edges,
          fieldBindings: options.fieldBindings,
          cleanInvalid: true,
        });
      }

      setNodes(clearDragFlags(restoreStableNodeData(next.nodes, snapshot.nodes, snapshot.operatorConfigs)));
      setEdges(clearEdgeDragFlags(next.edges));
      options.onFieldBindingsChange?.(next.fieldBindings);
    },
    onOpenAddStep: (action: WorkflowAction) => { setSidebarAction(action); setContextMenu(null); setHistoryOpen(false); setMethodEditor(null); setConditionEditor(null); },
    onAddStep: (
      kind: WorkflowAction['kind'],
      methodName?: string,
      connector?: WorkflowAction['connector'],
      methodOperation?: InvokerOperation,
    ) => {
      if (!sidebarAction || !kind) return;
      const result = createNodeFromAction({ action: { ...sidebarAction, kind, methodName, connector, methodOperation }, nodes, edges });
      setNodes(result.nodes);
      setEdges(result.edges);
      setSidebarAction(null);
    },
    onDeleteNode: async (nodeId: string) => {
      const targetNode = nodes.find((node) => node.id === nodeId);
      if (!targetNode || targetNode.type === 'start') return;
      const confirmed = await confirm({
        title: t('confirmDelete.title'),
        message: t('confirmDelete.message'),
        confirmText: t('actions.delete'),
        cancelText: t('actions.cancel'),
        confirmVariant: 'solid',
      });
      if (!confirmed) return;
      const result = deleteNodeGraph(nodeId, nodes, edges);
      const nextNodeIds = new Set(result.nodes.map((node) => node.id));
      const deletedNodeIds = nodes
        .filter((node) => !nextNodeIds.has(node.id))
        .map((node) => node.id);
      if (deletedNodeIds.length > 0) {
        options.onDeleteNodes?.(deletedNodeIds, nodes);
      }
      setNodes(result.nodes);
      setEdges(result.edges);
      setContextMenu(null);
    },
    onChangeNodeLabel: (nodeId: string, label: string) => setNodes((currentNodes) => currentNodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, subtitle: label, labelEdited: true } } : node)),
    onSaveMethodConfig: (nodeId: string, methodConfig: WorkflowMethodConfig) => {
      // The request editor rebuilds the config without the operation `name`;
      // keep the existing one so it stays read-only across method-config edits.
      setNodes((currentNodes) => currentNodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, methodConfig: { ...methodConfig, name: methodConfig.name ?? node.data.methodConfig?.name } } } : node));
      setMethodEditor(null);
    },
    onSaveConditionConfig: (nodeId: string, conditionConfig: ConditionConfig) => {
      setNodes((currentNodes) => currentNodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, conditionConfig } } : node));
      setConditionEditor(null);
    },
  };
}
