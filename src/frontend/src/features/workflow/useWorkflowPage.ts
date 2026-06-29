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
import { collectDescendantNodeIds, getOperatorBottomBranch } from './utils/graph.traversal';
import { OFFSETS } from './utils/graph.constants';
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

type XY = { x: number; y: number };

type InsertionLayout = {
  draggedIds: Set<string>;
  placeholderIds: Set<string>;
  draggedOrder: string[];
  positionsByRealId: Map<string, XY>;
  sourcePositionByDraggedId: Map<string, XY>;
  placeholderPositionByDraggedId: Map<string, XY>;
  placeholderPositionByPreviewId: Map<string, XY>;
};

const DROP_EDGE_MAX_DISTANCE = 90;
const DROP_LEAF_MAX_DISTANCE = 70;
const DROP_PLACEHOLDER_PREFIX = '__workflow-drop-placeholder__';
const COPY_PREVIEW_PREFIX = '__workflow-copy-preview__';

const NODE_BOX_SIZE = 96;
const COLLISION_PADDING = 56;
const COLLISION_MAX_STEPS = 24;

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

const getNodeBounds = (node: WorkflowNodeModel): Bounds => {
  const width = node.measured?.width ?? node.width ?? NODE_BOX_SIZE;
  const height = node.measured?.height ?? node.height ?? NODE_BOX_SIZE;
  return { minX: node.position.x, minY: node.position.y, maxX: node.position.x + width, maxY: node.position.y + height };
};

const boundsFromPosition = (pos: XY): Bounds => ({
  minX: pos.x,
  minY: pos.y,
  maxX: pos.x + NODE_BOX_SIZE,
  maxY: pos.y + NODE_BOX_SIZE,
});

const boundsIntersect = (a: Bounds, b: Bounds, pad = 0) =>
  a.minX - pad < b.maxX && a.maxX + pad > b.minX && a.minY - pad < b.maxY && a.maxY + pad > b.minY;

const resolvePlaceholderCollision = (
  placeholderBounds: Bounds[],
  occupied: Bounds[],
  direction: 'right' | 'bottom',
): XY => {
  if (placeholderBounds.length === 0 || occupied.length === 0) return { x: 0, y: 0 };
  const step = direction === 'right' ? { x: OFFSETS.right.x, y: 0 } : { x: 0, y: OFFSETS.bottom.y };
  let shift: XY = { x: 0, y: 0 };
  for (let iteration = 0; iteration < COLLISION_MAX_STEPS; iteration += 1) {
    const collides = placeholderBounds.some((box) => {
      const moved: Bounds = {
        minX: box.minX + shift.x,
        minY: box.minY + shift.y,
        maxX: box.maxX + shift.x,
        maxY: box.maxY + shift.y,
      };
      return occupied.some((other) => boundsIntersect(moved, other, COLLISION_PADDING));
    });
    if (!collides) break;
    shift = { x: shift.x + step.x, y: shift.y + step.y };
  }
  return shift;
};

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
    pointerOffsetFromRoot?: { x: number; y: number };
    lastGhostRootPosition?: { x: number; y: number };
    lastInsertionPreview?: {
      sourceNodeId: string;
      targetNodeId: string;
      direction: 'right' | 'bottom';
      layout: InsertionLayout;
    };
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
      hideAddControls: false,
      dragSourceMoving: false,
      dragSourceFaint: false,
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

  const buildFreeDragNodes = (
    sourceNodeId: string,
    snapshotNodes: WorkflowNodeModel[],
    delta: { x: number; y: number },
  ) => snapshotNodes.map((item) => {
    const isGrabbed = item.id === sourceNodeId;
    return {
      ...item,
      position: isGrabbed
        ? { x: item.position.x + delta.x, y: item.position.y + delta.y }
        : item.position,
      data: {
        ...item.data,
        highlighted: false,
        dropTarget: false,
        dropInvalid: false,
        dragGhost: false,
        dropPlaceholder: false,
        dragSourceMoving: false,
        dragSourceFaint: false,
        hideAddControls: isGrabbed,
        suppressHoverAddControls: isGrabbed,
      },
    };
  }) as WorkflowNodeModel[];

  const buildSourceDimmedNodesFromSnapshot = (
    snapshotNodes: WorkflowNodeModel[],
    draggedIds: Set<string>,
    faint: boolean,
  ) => snapshotNodes
    .filter((item) => draggedIds.has(item.id))
    .map((item) => ({
      ...item,
      selected: false,
      draggable: false,
      selectable: false,
      data: {
        ...item.data,
        dragGhost: false,
        dropPlaceholder: false,
        dragSourceMoving: true,
        dragSourceFaint: faint,
        hideAddControls: true,
        suppressHoverAddControls: true,
        lockVisibleAddControls: false,
        highlighted: false,
        dropTarget: false,
        dropInvalid: false,
      },
    })) as WorkflowNodeModel[];

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

  const buildPlaceholderNodes = (
    previewNodes: WorkflowNodeModel[],
    placeholderIds: Set<string>,
    invalid: boolean,
    positionById?: Map<string, { x: number; y: number }>,
  ) => previewNodes
    .filter((item) => placeholderIds.has(item.id))
    .map((item) => ({
      ...item,
      id: `${DROP_PLACEHOLDER_PREFIX}${item.id}`,
      position: positionById?.get(item.id) ?? item.position,
      selected: false,
      draggable: false,
      selectable: false,
      data: {
        ...item.data,
        dragGhost: false,
        dropPlaceholder: true,
        dragSourceMoving: false,
        dragSourceFaint: false,
        highlighted: false,
        dropTarget: true,
        dropInvalid: invalid,
        suppressHoverAddControls: true,
        lockVisibleAddControls: false,
        hideAddControls: true,
      },
    })) as WorkflowNodeModel[];

  const buildPlaceholderEdges = (
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

  const computeInsertionLayout = (
    dropTarget: DragDropTarget,
    sourceNodeId: string,
    snapshotNodes: WorkflowNodeModel[],
    snapshotEdges: WorkflowEdgeModel[],
    preview: WorkflowDropResult,
  ): InsertionLayout => {
    const snapshotById = new Map(snapshotNodes.map((item) => [item.id, item]));
    const draggedIds = getDragSubtreeNodeIds(sourceNodeId, snapshotNodes, snapshotEdges);
    const placeholderIds = getPreviewPlaceholderIds(sourceNodeId, snapshotNodes, snapshotEdges, preview.nodes, 'copy');
    const draggedNodes = snapshotNodes.filter((item) => draggedIds.has(item.id));
    const draggedOrder = draggedNodes.map((item) => item.id);
    const draggedRoot = snapshotById.get(sourceNodeId);
    const anchorA = snapshotById.get(dropTarget.target.nodeId);
    const direction = dropTarget.target.direction;
    const offset = OFFSETS[direction];

    const downstreamRoot = dropTarget.edge ? snapshotById.get(dropTarget.edge.target) : undefined;
    const downstreamIds = downstreamRoot ? collectDescendantNodeIds(downstreamRoot.id, snapshotEdges) : new Set<string>();
    const occupiedBounds = snapshotNodes
      .filter((item) => !draggedIds.has(item.id)
        && item.id !== dropTarget.target.nodeId
        && !downstreamIds.has(item.id))
      .map(getNodeBounds);

    const placeholderBase = anchorA && draggedRoot
      ? { x: anchorA.position.x + offset.x, y: anchorA.position.y + offset.y }
      : undefined;
    const placeholderPositionByDraggedId = new Map<string, XY>();
    const placeholderPositionByPreviewId = new Map<string, XY>();
    if (placeholderBase && draggedRoot) {
      const basePositionByDraggedId = new Map<string, XY>();
      draggedNodes.forEach((item) => {
        basePositionByDraggedId.set(item.id, {
          x: placeholderBase.x + (item.position.x - draggedRoot.position.x),
          y: placeholderBase.y + (item.position.y - draggedRoot.position.y),
        });
      });
      const collisionShift = resolvePlaceholderCollision(
        [...basePositionByDraggedId.values()].map(boundsFromPosition),
        occupiedBounds,
        direction,
      );
      draggedNodes.forEach((item) => {
        const base = basePositionByDraggedId.get(item.id) ?? placeholderBase;
        placeholderPositionByDraggedId.set(item.id, {
          x: base.x + collisionShift.x,
          y: base.y + collisionShift.y,
        });
      });
      preview.nodes
        .filter((item) => placeholderIds.has(item.id))
        .forEach((item) => {
          const pos = placeholderPositionByDraggedId.get(item.id.slice(COPY_PREVIEW_PREFIX.length));
          if (pos) placeholderPositionByPreviewId.set(item.id, pos);
        });
    }

    let shift: XY = { x: 0, y: 0 };
    if (downstreamRoot && placeholderPositionByDraggedId.size > 0) {
      const placeholderPositions = [...placeholderPositionByDraggedId.values()];
      if (direction === 'right') {
        const placeholderMaxX = Math.max(...placeholderPositions.map((pos) => pos.x));
        const requiredX = placeholderMaxX + OFFSETS.right.x;
        shift = { x: Math.max(0, requiredX - downstreamRoot.position.x), y: 0 };
      } else {
        const placeholderMaxY = Math.max(...placeholderPositions.map((pos) => pos.y));
        const requiredY = placeholderMaxY + OFFSETS.bottom.y;
        shift = { x: 0, y: Math.max(0, requiredY - downstreamRoot.position.y) };
      }
    }

    const positionsByRealId = new Map<string, XY>();
    snapshotNodes
      .filter((item) => !draggedIds.has(item.id))
      .forEach((item) => {
        positionsByRealId.set(item.id, downstreamIds.has(item.id)
          ? { x: item.position.x + shift.x, y: item.position.y + shift.y }
          : { x: item.position.x, y: item.position.y });
      });
    const sourcePositionByDraggedId = new Map<string, XY>();
    draggedNodes.forEach((item) => sourcePositionByDraggedId.set(item.id, { x: item.position.x, y: item.position.y }));

    return {
      draggedIds,
      placeholderIds,
      draggedOrder,
      positionsByRealId,
      sourcePositionByDraggedId,
      placeholderPositionByDraggedId,
      placeholderPositionByPreviewId,
    };
  };

  const buildInsertionPreviewNodes = (
    layout: InsertionLayout,
    snapshotNodes: WorkflowNodeModel[],
    preview: WorkflowDropResult,
    invalid: boolean,
  ) => {
    const existingNodes = snapshotNodes
      .filter((item) => !layout.draggedIds.has(item.id))
      .map((item) => ({
        ...item,
        position: layout.positionsByRealId.get(item.id) ?? item.position,
        data: {
          ...item.data,
          highlighted: false,
          dropTarget: false,
          dropInvalid: false,
          dragGhost: false,
          dropPlaceholder: false,
          dragSourceMoving: false,
          dragSourceFaint: false,
        },
      }));
    return [
      ...existingNodes,
      ...buildSourceDimmedNodesFromSnapshot(snapshotNodes, layout.draggedIds, true),
      ...buildPlaceholderNodes(preview.nodes, layout.placeholderIds, invalid, layout.placeholderPositionByPreviewId),
    ];
  };

  const applyInsertionPreviewPositions = (
    mode: WorkflowDropMode,
    nextNodes: WorkflowNodeModel[],
    snapshotNodes: WorkflowNodeModel[],
    layout: InsertionLayout,
  ) => {
    if (mode === 'move') {
      return nextNodes.map((item) => {
        const moved = layout.placeholderPositionByDraggedId.get(item.id);
        if (moved) return { ...item, position: moved };
        const existing = layout.positionsByRealId.get(item.id);
        return existing ? { ...item, position: existing } : item;
      });
    }
    const snapshotIds = new Set(snapshotNodes.map((item) => item.id));
    const copiedPositionByFinalId = new Map<string, XY>();
    nextNodes
      .filter((item) => !snapshotIds.has(item.id))
      .forEach((item, index) => {
        const pos = layout.placeholderPositionByDraggedId.get(layout.draggedOrder[index]);
        if (pos) copiedPositionByFinalId.set(item.id, pos);
      });
    return nextNodes.map((item) => {
      const copied = copiedPositionByFinalId.get(item.id);
      if (copied) return { ...item, position: copied };
      const original = layout.sourcePositionByDraggedId.get(item.id);
      if (original) return { ...item, position: original };
      const existing = layout.positionsByRealId.get(item.id);
      return existing ? { ...item, position: existing } : item;
    });
  };

  const buildInsertionPreviewEdges = (
    sourceNodeId: string,
    snapshotNodes: WorkflowNodeModel[],
    snapshotEdges: WorkflowEdgeModel[],
    preview: WorkflowDropResult,
    invalid: boolean,
  ) => {
    const placeholderIds = getPreviewPlaceholderIds(sourceNodeId, snapshotNodes, snapshotEdges, preview.nodes, 'copy');
    const baseEdges = clearDragPreviewEdges(preview.edges)
      .filter((item) => !placeholderIds.has(item.source) && !placeholderIds.has(item.target))
      .map((item) => ({
        ...item,
        data: {
          ...item.data,
          highlighted: false,
          dropTarget: false,
          dropInvalid: false,
          dragGhost: false,
          dropPlaceholder: false,
        },
      }));
    return [
      ...baseEdges,
      ...buildPlaceholderEdges(preview.edges, placeholderIds, invalid),
    ];
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

  const buildPreviewGraphForTarget = (
    sourceNodeId: string,
    target: DragDropTarget['target'],
    mode: WorkflowDropMode,
    snapshotNodes: WorkflowNodeModel[],
    snapshotEdges: WorkflowEdgeModel[],
  ): { preview: WorkflowDropResult; invalid: boolean } => {
    const layout = moveOrCopyWorkflowNodes({
      sourceNodeId,
      target,
      mode: 'copy',
      nodes: snapshotNodes,
      edges: snapshotEdges,
      fieldBindings: options.fieldBindings,
    });
    const preview = stabilizeCopyPreviewIds(sourceNodeId, snapshotNodes, snapshotEdges, layout);
    const invalid = mode === 'copy'
      ? layout.invalidReferences.length > 0
      : moveOrCopyWorkflowNodes({
          sourceNodeId,
          target,
          mode,
          nodes: snapshotNodes,
          edges: snapshotEdges,
          fieldBindings: options.fieldBindings,
        }).invalidReferences.length > 0;
    return { preview, invalid };
  };

  const clearAllDragPreviewState = (snapshot: NonNullable<typeof dragSnapshot.current>) => {
    setNodes(clearDragFlags(clearDragPreviewNodes(snapshot.nodes)));
    setEdges(clearEdgeDragFlags(clearDragPreviewEdges(snapshot.edges)));
  };

  const computeGhostRootPosition = (
    event: { clientX?: number; clientY?: number } | undefined,
    snapshot: NonNullable<typeof dragSnapshot.current>,
  ) => {
    const instance = reactFlowInstance.current;
    const offset = snapshot.pointerOffsetFromRoot;
    if (!instance || !offset || typeof event?.clientX !== 'number' || typeof event?.clientY !== 'number') {
      return undefined;
    }
    const pointer = instance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    return { x: pointer.x - offset.x, y: pointer.y - offset.y };
  };

  const commitFreeReposition = (
    snapshot: NonNullable<typeof dragSnapshot.current>,
    sourceNodeId: string,
  ) => {
    const snapshotRoot = snapshot.nodes.find((item) => item.id === sourceNodeId);
    const ghostRoot = snapshot.lastGhostRootPosition;
    if (!snapshotRoot || !ghostRoot) {
      clearAllDragPreviewState(snapshot);
      return;
    }
    const delta = {
      x: ghostRoot.x - snapshotRoot.position.x,
      y: ghostRoot.y - snapshotRoot.position.y,
    };
    const repositioned = snapshot.nodes.map((item) => item.id === sourceNodeId
      ? { ...item, position: { x: item.position.x + delta.x, y: item.position.y + delta.y } }
      : item);
    setNodes(clearDragFlags(clearDragPreviewNodes(repositioned)));
    setEdges(clearEdgeDragFlags(clearDragPreviewEdges(snapshot.edges)));
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
      const mode: WorkflowDropMode = event?.ctrlKey ? 'copy' : 'move';
      const draggedIds = getDragSubtreeNodeIds(node.id, stableNodes, edges);
      const instance = reactFlowInstance.current;
      const pointerOffsetFromRoot = draggedNode && instance
        && typeof event?.clientX === 'number' && typeof event?.clientY === 'number'
        ? (() => {
            const pointer = instance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
            return { x: pointer.x - draggedNode.position.x, y: pointer.y - draggedNode.position.y };
          })()
        : undefined;
      dragSnapshot.current = {
        nodes: stableNodes,
        edges,
        mode,
        operatorConfigs: new Map(
          stableNodes
            .filter((item) => (item.type === 'if' || item.type === 'loop') && item.data.conditionConfig)
            .map((item) => [item.id, item.data.conditionConfig as ConditionConfig]),
        ),
        highlightedNodeIds: highlightedBranch.nodeIds,
        highlightedEdgeIds: highlightedBranch.edgeIds,
        pointerOffsetFromRoot,
        lastGhostRootPosition: draggedNode ? { ...draggedNode.position } : undefined,
      };

      setNodes((currentNodes) => currentNodes.map((item) => ({
        ...item,
        data: {
          ...item.data,
          highlighted: false,
          hideAddControls: draggedIds.has(item.id),
          suppressHoverAddControls: draggedIds.has(item.id),
          dragSourceMoving: false,
          dragSourceFaint: false,
        },
      })));
    },
    onNodeDrag: (event: any, node: WorkflowNodeModel) => {
      const snapshot = dragSnapshot.current;
      if (!snapshot || node.type === 'start') return;
      const snapshotRoot = snapshot.nodes.find((item) => item.id === node.id);
      const rootPosition = computeGhostRootPosition(event, snapshot) ?? node.position ?? snapshotRoot?.position;
      if (rootPosition) snapshot.lastGhostRootPosition = rootPosition;
      const delta = rootPosition && snapshotRoot
        ? { x: rootPosition.x - snapshotRoot.position.x, y: rootPosition.y - snapshotRoot.position.y }
        : { x: 0, y: 0 };
      const dropTarget = resolveStickyDropTarget(
        snapshot,
        findDropTarget(event, node.id, snapshot.nodes, snapshot.edges),
      );
      if (!dropTarget) {
        snapshot.activeDropTarget = undefined;
        snapshot.lastInsertionPreview = undefined;
        setNodes(buildFreeDragNodes(node.id, snapshot.nodes, delta));
        updateDragPreviewEdges(
          snapshot,
          `${snapshot.mode}:free`,
          clearEdgeDragFlags(clearDragPreviewEdges(snapshot.edges)),
        );
        return;
      }
      const { preview, invalid } = buildPreviewGraphForTarget(
        node.id,
        dropTarget.target,
        snapshot.mode,
        snapshot.nodes,
        snapshot.edges,
      );
      const layout = computeInsertionLayout(dropTarget, node.id, snapshot.nodes, snapshot.edges, preview);
      snapshot.lastInsertionPreview = {
        sourceNodeId: node.id,
        targetNodeId: dropTarget.target.nodeId,
        direction: dropTarget.target.direction,
        layout,
      };
      setNodes(buildInsertionPreviewNodes(layout, snapshot.nodes, preview, invalid));
      updateDragPreviewEdges(
        snapshot,
        `${snapshot.mode}:${dropTarget.target.nodeId}:${dropTarget.target.direction}:${invalid}`,
        buildInsertionPreviewEdges(node.id, snapshot.nodes, snapshot.edges, preview, invalid),
      );
    },
    onNodeDragStop: async (event: any, node: WorkflowNodeModel) => {
      const snapshot = dragSnapshot.current;
      dragSnapshot.current = null;
      if (!snapshot || node.type === 'start') return;

      const releaseGhostRoot = computeGhostRootPosition(event, snapshot);
      if (releaseGhostRoot) snapshot.lastGhostRootPosition = releaseGhostRoot;

      const dropTarget = snapshot.activeDropTarget
        ?? findDropTarget(event, node.id, snapshot.nodes, snapshot.edges);

      if (!dropTarget) {
        if (snapshot.mode === 'copy') {
          clearAllDragPreviewState(snapshot);
          return;
        }
        commitFreeReposition(snapshot, node.id);
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
        clearAllDragPreviewState(snapshot);
        const ok = await options.confirmDependencyDrop?.(preview.invalidReferences);
        if (!ok) {
          clearAllDragPreviewState(snapshot);
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

      const insertion = snapshot.lastInsertionPreview;
      const positionedNodes = insertion
        && insertion.sourceNodeId === node.id
        && insertion.targetNodeId === dropTarget.target.nodeId
        && insertion.direction === dropTarget.target.direction
        ? applyInsertionPreviewPositions(snapshot.mode, next.nodes, snapshot.nodes, insertion.layout)
        : next.nodes;

      setNodes(clearDragFlags(restoreStableNodeData(positionedNodes, snapshot.nodes, snapshot.operatorConfigs)));
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
      setNodes((currentNodes) => currentNodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, methodConfig: { ...methodConfig, name: methodConfig.name ?? node.data.methodConfig?.name } } } : node));
      setMethodEditor(null);
    },
    onSaveConditionConfig: (nodeId: string, conditionConfig: ConditionConfig) => {
      setNodes((currentNodes) => currentNodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, conditionConfig } } : node));
      setConditionEditor(null);
    },
  };
}
