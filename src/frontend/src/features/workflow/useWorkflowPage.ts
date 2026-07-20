import { useRef, useState } from 'react';
import { addEdge, useEdgesState, useNodesState } from '@xyflow/react';
import type { Connection } from '@xyflow/react';
import type { ReactFlowInstance, Viewport } from '@xyflow/react';
import type { InvokerOperation } from '@entities/invoker/model/types';
import { initialEdges, initialNodes } from './data/initialGraph';
import type { WorkflowAction, WorkflowContextMenu, WorkflowEdgeModel, WorkflowNodeModel } from './types/workflow.types';
import type { WorkflowAggregatorEditorState, WorkflowConditionEditorState, WorkflowMethodConfig, WorkflowMethodEditorState } from './types/request-config.types';
import type { ConditionConfig } from './components/condition-builder/conditionBuilder.types';
import { ALL_COLORS } from './constants/colors';
import { createNodeFromAction, deleteNodeGraph } from './utils/graphUtils';
import { collectDescendantNodeIds, getOperatorBottomBranch } from './utils/graph.traversal';
import { OFFSETS } from './utils/graph.constants';
import { getRightSourceHandle } from './utils/graph.handles';
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
  positionsByRealId: Map<string, XY>;
  sourcePositionByDraggedId: Map<string, XY>;
  sourceDimmedPositionByDraggedId: Map<string, XY>;
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

const distanceToSegment = (p: XY, a: XY, b: XY): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
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

const isFinitePosition = (pos?: XY): boolean =>
  !!pos && Number.isFinite(pos.x) && Number.isFinite(pos.y);

const sanitizeGraphNodes = (nodes: WorkflowNodeModel[]): WorkflowNodeModel[] => {
  const seen = new Set<string>();
  const result: WorkflowNodeModel[] = [];
  nodes.forEach((node) => {
    if (!node || typeof node.id !== 'string' || seen.has(node.id)) return;
    seen.add(node.id);
    if (isFinitePosition(node.position)) {
      result.push(node);
      return;
    }
    result.push({
      ...node,
      position: {
        x: Number.isFinite(node.position?.x) ? node.position.x : 0,
        y: Number.isFinite(node.position?.y) ? node.position.y : 0,
      },
    });
  });
  return result;
};

const sanitizeGraphEdges = (
  nodes: WorkflowNodeModel[],
  edges: WorkflowEdgeModel[],
): WorkflowEdgeModel[] => {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const seen = new Set<string>();
  return edges.filter((edge) => {
    if (!edge || typeof edge.id !== 'string' || seen.has(edge.id)) return false;
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return false;
    seen.add(edge.id);
    return true;
  });
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
    previewNodeKey?: string;
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
  const draggedPositionLockRef = useRef<Set<string> | null>(null);
  const multiDragRef = useRef(false);
  const [isAnyNodeDragging, setIsAnyNodeDragging] = useState(false);
  const handleNodesChange: typeof onNodesChange = (changes) => {
    const locked = draggedPositionLockRef.current;
    if (!locked || locked.size === 0) {
      onNodesChange(changes);
      return;
    }
    onNodesChange(changes.filter((change) =>
      !(change.type === 'position' && locked.has(change.id))));
  };
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowEdgeModel>(initialEdges);
  const [sidebarAction, setSidebarAction] = useState<WorkflowAction | null>(null);
  const [contextMenu, setContextMenu] = useState<WorkflowContextMenu | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [methodEditor, setMethodEditor] = useState<WorkflowMethodEditorState | null>(null);
  const [responseNodeId, setResponseNodeId] = useState<string | null>(null);
  const [conditionEditor, setConditionEditor] = useState<WorkflowConditionEditorState | null>(null);
  const [aggregatorEditor, setAggregatorEditor] = useState<WorkflowAggregatorEditorState | null>(null);
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
      suppressHoverAddControls: false,
      lockVisibleAddControls: false,
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
        const distance = distanceToSegment(point, sourceCenter, targetCenter);
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
    positionByDraggedId?: Map<string, XY>,
  ) => snapshotNodes
    .filter((item) => draggedIds.has(item.id))
    .map((item) => ({
      ...item,
      position: positionByDraggedId?.get(item.id) ?? item.position,
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
    mode: WorkflowDropMode,
    includeRemovalGapFill: boolean,
  ): InsertionLayout => {
    const snapshotById = new Map(snapshotNodes.map((item) => [item.id, item]));
    const draggedIds = getDragSubtreeNodeIds(sourceNodeId, snapshotNodes, snapshotEdges);
    const placeholderIds = getPreviewPlaceholderIds(sourceNodeId, snapshotNodes, snapshotEdges, preview.nodes, 'copy');
    const draggedNodes = snapshotNodes.filter((item) => draggedIds.has(item.id));
    const draggedRoot = snapshotById.get(sourceNodeId);
    const anchorA = snapshotById.get(dropTarget.target.nodeId);
    const direction = dropTarget.target.direction;
    const offset = OFFSETS[direction];

    const nestedOperatorCount = draggedNodes.filter((item) => item.type === 'if' || item.type === 'loop').length;
    if (nestedOperatorCount > 1) {
      const previewPosById = new Map(preview.nodes.map((item) => [item.id, item.position]));
      const positionsByRealId = new Map<string, XY>();
      snapshotNodes
        .filter((item) => !draggedIds.has(item.id))
        .forEach((item) => {
          const p = previewPosById.get(item.id);
          positionsByRealId.set(item.id, p ? { x: p.x, y: p.y } : { x: item.position.x, y: item.position.y });
        });
      const placeholderPositionByDraggedId = new Map<string, XY>();
      const placeholderPositionByPreviewId = new Map<string, XY>();
      preview.nodes
        .filter((item) => placeholderIds.has(item.id))
        .forEach((item) => {
          const pos = { x: item.position.x, y: item.position.y };
          placeholderPositionByDraggedId.set(item.id.slice(COPY_PREVIEW_PREFIX.length), pos);
          placeholderPositionByPreviewId.set(item.id, pos);
        });
      const sourcePositionByDraggedId = new Map<string, XY>();
      const sourceDimmedPositionByDraggedId = new Map<string, XY>();
      draggedNodes.forEach((item) => {
        const p = previewPosById.get(item.id);
        sourcePositionByDraggedId.set(item.id, p ? { x: p.x, y: p.y } : { x: item.position.x, y: item.position.y });
        sourceDimmedPositionByDraggedId.set(item.id, { x: item.position.x, y: item.position.y });
      });
      return {
        draggedIds,
        placeholderIds,
        positionsByRealId,
        sourcePositionByDraggedId,
        sourceDimmedPositionByDraggedId,
        placeholderPositionByDraggedId,
        placeholderPositionByPreviewId,
      };
    }

    const removalShiftById = new Map<string, XY>();
    if (mode === 'move' && includeRemovalGapFill) {
      snapshotEdges
        .filter((item) => draggedIds.has(item.source) && !draggedIds.has(item.target))
        .forEach((exitEdge) => {
          const removed = snapshotById.get(exitEdge.source);
          const filler = snapshotById.get(exitEdge.target);
          if (!removed || !filler) return;
          const isVertical = exitEdge.targetHandle === 'top' || exitEdge.sourceHandle === 'bottom';
          const removalShift = isVertical
            ? { x: 0, y: removed.position.y - filler.position.y }
            : { x: removed.position.x - filler.position.x, y: 0 };
          collectDescendantNodeIds(filler.id, snapshotEdges).forEach((id) => {
            if (!draggedIds.has(id)) removalShiftById.set(id, removalShift);
          });
        });
    }
    const posOf = (node: WorkflowNodeModel): XY => {
      const s = removalShiftById.get(node.id);
      return s ? { x: node.position.x + s.x, y: node.position.y + s.y } : { x: node.position.x, y: node.position.y };
    };

    const continuationTargetHandle = direction === 'bottom' ? 'top' : 'left';
    const continuationEdge = dropTarget.edge ?? snapshotEdges.find((item) =>
      item.source === dropTarget.target.nodeId &&
      (direction === 'bottom'
        ? item.targetHandle === continuationTargetHandle || item.sourceHandle === 'true' || item.sourceHandle === 'bottom'
        : item.targetHandle === continuationTargetHandle || item.sourceHandle === 'false' || item.sourceHandle === 'right' || !item.sourceHandle));
    const downstreamRoot = continuationEdge ? snapshotById.get(continuationEdge.target) : undefined;
    const downstreamIds = downstreamRoot ? collectDescendantNodeIds(downstreamRoot.id, snapshotEdges) : new Set<string>();

    let makeRoomRoot = downstreamRoot;
    if (!makeRoomRoot && direction === 'right') {
      const branchOwners = snapshotNodes.filter((item) => {
        if (item.type !== 'if' && item.type !== 'loop') return false;
        return getOperatorBottomBranch(item.id, snapshotNodes, snapshotEdges).nodeIds.has(dropTarget.target.nodeId);
      });
      const branchOwner = branchOwners.sort((left, right) =>
        getOperatorBottomBranch(left.id, snapshotNodes, snapshotEdges).nodeIds.size -
        getOperatorBottomBranch(right.id, snapshotNodes, snapshotEdges).nodeIds.size)[0];
      const rightEdge = branchOwner
        ? snapshotEdges.find((item) =>
          item.source === branchOwner.id && item.sourceHandle === getRightSourceHandle(branchOwner.type))
        : undefined;
      makeRoomRoot = rightEdge ? snapshotById.get(rightEdge.target) : undefined;
    }

    const anchorDescendants = anchorA ? collectDescendantNodeIds(anchorA.id, snapshotEdges) : new Set<string>();
    const occupiedBounds = snapshotNodes
      .filter((item) => anchorDescendants.has(item.id)
        && item.id !== dropTarget.target.nodeId
        && !downstreamIds.has(item.id)
        && !draggedIds.has(item.id))
      .map((item) => {
        const p = posOf(item);
        const width = item.measured?.width ?? item.width ?? NODE_BOX_SIZE;
        const height = item.measured?.height ?? item.height ?? NODE_BOX_SIZE;
        return { minX: p.x, minY: p.y, maxX: p.x + width, maxY: p.y + height };
      });

    let anchorRightClearX = anchorA ? posOf(anchorA).x : 0;
    if (anchorA && direction === 'right' && (anchorA.type === 'if' || anchorA.type === 'loop')) {
      getOperatorBottomBranch(anchorA.id, snapshotNodes, snapshotEdges).nodeIds.forEach((id) => {
        const branchNode = snapshotById.get(id);
        if (branchNode && !draggedIds.has(id)) anchorRightClearX = Math.max(anchorRightClearX, posOf(branchNode).x);
      });
    }
    const placeholderBase = anchorA && draggedRoot
      ? { x: anchorRightClearX + offset.x, y: posOf(anchorA).y + offset.y }
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
    let makeRoomX = Number.POSITIVE_INFINITY;
    const insertionShiftIds = new Set<string>();
    if (makeRoomRoot && placeholderPositionByDraggedId.size > 0) {
      const placeholderMaxX = Math.max(...[...placeholderPositionByDraggedId.values()].map((pos) => pos.x));
      const requiredX = placeholderMaxX + OFFSETS.right.x;
      makeRoomX = posOf(makeRoomRoot).x;
      shift = { x: Math.max(0, requiredX - makeRoomX), y: 0 };
      if (shift.x !== 0) {
        const ancestors = new Set<string>();
        let frontier: string[] = [makeRoomRoot.id];
        while (frontier.length > 0) {
          const nextFrontier: string[] = [];
          snapshotEdges.forEach((item) => {
            if (frontier.includes(item.target) && !ancestors.has(item.source)) {
              ancestors.add(item.source);
              nextFrontier.push(item.source);
            }
          });
          frontier = nextFrontier;
        }
        snapshotNodes.forEach((item) => {
          if (draggedIds.has(item.id) || ancestors.has(item.id)) return;
          if (posOf(item).x >= makeRoomX) insertionShiftIds.add(item.id);
        });
      }
    }

    const positionsByRealId = new Map<string, XY>();
    snapshotNodes
      .filter((item) => !draggedIds.has(item.id))
      .forEach((item) => {
        const base = posOf(item);
        const insertionShift = insertionShiftIds.has(item.id) ? shift : { x: 0, y: 0 };
        positionsByRealId.set(item.id, {
          x: base.x + insertionShift.x,
          y: base.y + insertionShift.y,
        });
      });
    const sourceDimmedShift = draggedRoot && shift.x !== 0 && draggedRoot.position.x >= makeRoomX
      ? shift
      : { x: 0, y: 0 };
    const sourcePositionByDraggedId = new Map<string, XY>();
    const sourceDimmedPositionByDraggedId = new Map<string, XY>();
    draggedNodes.forEach((item) => {
      const pos = { x: item.position.x + sourceDimmedShift.x, y: item.position.y + sourceDimmedShift.y };
      sourcePositionByDraggedId.set(item.id, pos);
      sourceDimmedPositionByDraggedId.set(item.id, pos);
    });

    return {
      draggedIds,
      placeholderIds,
      positionsByRealId,
      sourcePositionByDraggedId,
      sourceDimmedPositionByDraggedId,
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
      ...buildSourceDimmedNodesFromSnapshot(snapshotNodes, layout.draggedIds, true, layout.sourceDimmedPositionByDraggedId),
      ...buildPlaceholderNodes(preview.nodes, layout.placeholderIds, invalid, layout.placeholderPositionByPreviewId),
    ];
  };

  const buildCopiedPlaceholderPositions = (
    idMap: Map<string, string> | undefined,
    layout: InsertionLayout,
  ) => {
    const copiedPositionByFinalId = new Map<string, XY>();
    (idMap ?? new Map<string, string>()).forEach((finalId, sourceId) => {
      const pos = layout.placeholderPositionByDraggedId.get(sourceId);
      if (pos) copiedPositionByFinalId.set(finalId, pos);
    });
    return copiedPositionByFinalId;
  };

  const applyInsertionPreviewPositions = (
    mode: WorkflowDropMode,
    finalNodes: WorkflowNodeModel[],
    idMap: Map<string, string> | undefined,
    layout: InsertionLayout,
  ) => {
    if (mode === 'move') {
      return finalNodes.map((item) => {
        const moved = layout.placeholderPositionByDraggedId.get(item.id);
        if (moved) return { ...item, position: moved };
        const existing = layout.positionsByRealId.get(item.id);
        return existing ? { ...item, position: existing } : item;
      });
    }
    const copiedPositionByFinalId = buildCopiedPlaceholderPositions(idMap, layout);
    return finalNodes.map((item) => {
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

  const updateDragPreviewNodes = (
    snapshot: NonNullable<typeof dragSnapshot.current>,
    key: string,
    buildNodes: () => WorkflowNodeModel[],
  ) => {
    if (snapshot.previewNodeKey === key) return;
    snapshot.previewNodeKey = key;
    setNodes(buildNodes());
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
    const restoredNodes = sanitizeGraphNodes(clearDragFlags(clearDragPreviewNodes(snapshot.nodes)));
    setNodes(restoredNodes);
    setEdges(sanitizeGraphEdges(restoredNodes, clearEdgeDragFlags(clearDragPreviewEdges(snapshot.edges))));
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
    if (!snapshotRoot || !ghostRoot || !isFinitePosition(ghostRoot)) {
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
    const restoredNodes = sanitizeGraphNodes(clearDragFlags(clearDragPreviewNodes(repositioned)));
    setNodes(restoredNodes);
    setEdges(sanitizeGraphEdges(restoredNodes, clearEdgeDragFlags(clearDragPreviewEdges(snapshot.edges))));
  };

  return {
    nodes,
    edges,
    isAnyNodeDragging,
    sidebarAction,
    contextMenu,
    historyOpen,
    methodEditor,
    responseNodeId,
    conditionEditor,
    aggregatorEditor,
    restoredViewport,
    viewportRestoreVersion,
    centerStartVersion,
    getViewport: () => reactFlowInstance.current?.getViewport(),
    setReactFlowInstance: (instance: ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel>) => {
      reactFlowInstance.current = instance;
    },
    onNodesChange: handleNodesChange,
    onEdgesChange,
    setContextMenu,
    setHistoryOpen,
    setSidebarAction,
    setMethodEditor,
    setConditionEditor,
    setAggregatorEditor,
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
      setIsAnyNodeDragging(true);
      try {
        const selectedNodes = nodes.filter((item) => item.selected && item.type !== 'start');
        if (selectedNodes.length > 1 && selectedNodes.some((item) => item.id === node.id)) {
          multiDragRef.current = true;
          dragSnapshot.current = null;
          draggedPositionLockRef.current = null;
          return;
        }
        multiDragRef.current = false;
        const stableNodes = sanitizeGraphNodes(stabilizeMethodColors(nodes));
        const stableEdges = sanitizeGraphEdges(stableNodes, edges);
        const draggedNode = stableNodes.find((item) => item.id === node.id);
        if (!draggedNode) {
          dragSnapshot.current = null;
          draggedPositionLockRef.current = null;
          return;
        }
        const mode: WorkflowDropMode = event?.ctrlKey ? 'copy' : 'move';
        const draggedIds = getDragSubtreeNodeIds(node.id, stableNodes, stableEdges);
        draggedPositionLockRef.current = new Set(draggedIds);
        const instance = reactFlowInstance.current;
        const pointerOffsetFromRoot = instance
          && typeof event?.clientX === 'number' && typeof event?.clientY === 'number'
          ? (() => {
              const pointer = instance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
              return { x: pointer.x - draggedNode.position.x, y: pointer.y - draggedNode.position.y };
            })()
          : undefined;
        dragSnapshot.current = {
          nodes: stableNodes,
          edges: stableEdges,
          mode,
          operatorConfigs: new Map(
            stableNodes
              .filter((item) => (item.type === 'if' || item.type === 'loop') && item.data.conditionConfig)
              .map((item) => [item.id, item.data.conditionConfig as ConditionConfig]),
          ),
          highlightedNodeIds: new Set<string>(),
          highlightedEdgeIds: new Set<string>(),
          pointerOffsetFromRoot,
          lastGhostRootPosition: { ...draggedNode.position },
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
      } catch {
        dragSnapshot.current = null;
        draggedPositionLockRef.current = null;
      }
    },
    onNodeDrag: (event: any, node: WorkflowNodeModel) => {
      if (multiDragRef.current) return;
      const snapshot = dragSnapshot.current;
      if (!snapshot || node.type === 'start') return;
      try {
        const snapshotRoot = snapshot.nodes.find((item) => item.id === node.id);
        if (!snapshotRoot) return;
        const rootPosition = computeGhostRootPosition(event, snapshot) ?? node.position ?? snapshotRoot.position;
        if (isFinitePosition(rootPosition)) snapshot.lastGhostRootPosition = rootPosition;
        const delta = isFinitePosition(rootPosition)
          ? { x: rootPosition.x - snapshotRoot.position.x, y: rootPosition.y - snapshotRoot.position.y }
          : { x: 0, y: 0 };
        const dropTarget = resolveStickyDropTarget(
          snapshot,
          findDropTarget(event, node.id, snapshot.nodes, snapshot.edges),
        );
        if (!dropTarget) {
          snapshot.activeDropTarget = undefined;
          snapshot.lastInsertionPreview = undefined;
          snapshot.previewNodeKey = undefined;
          const freeNodes = sanitizeGraphNodes(buildFreeDragNodes(node.id, snapshot.nodes, delta));
          setNodes(freeNodes);
          updateDragPreviewEdges(
            snapshot,
            `${snapshot.mode}:free`,
            sanitizeGraphEdges(freeNodes, clearEdgeDragFlags(clearDragPreviewEdges(snapshot.edges))),
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
        const layout = computeInsertionLayout(dropTarget, node.id, snapshot.nodes, snapshot.edges, preview, snapshot.mode, false);
        snapshot.lastInsertionPreview = {
          sourceNodeId: node.id,
          targetNodeId: dropTarget.target.nodeId,
          direction: dropTarget.target.direction,
          layout,
        };
        const previewKey = `${snapshot.mode}:${dropTarget.target.nodeId}:${dropTarget.target.direction}:${invalid}`;
        const previewNodes = sanitizeGraphNodes(buildInsertionPreviewNodes(layout, snapshot.nodes, preview, invalid));
        const previewEdges = sanitizeGraphEdges(
          previewNodes,
          buildInsertionPreviewEdges(node.id, snapshot.nodes, snapshot.edges, preview, invalid),
        );
        updateDragPreviewNodes(snapshot, previewKey, () => previewNodes);
        updateDragPreviewEdges(snapshot, previewKey, previewEdges);
      } catch {
        clearAllDragPreviewState(snapshot);
        snapshot.activeDropTarget = undefined;
        snapshot.lastInsertionPreview = undefined;
        snapshot.previewNodeKey = undefined;
        snapshot.previewEdgeKey = undefined;
      }
    },
    onNodeDragStop: async (event: any, node: WorkflowNodeModel) => {
      setIsAnyNodeDragging(false);
      if (multiDragRef.current) {
        multiDragRef.current = false;
        draggedPositionLockRef.current = null;
        return;
      }
      const snapshot = dragSnapshot.current;
      dragSnapshot.current = null;
      if (!snapshot) {
        draggedPositionLockRef.current = null;
        return;
      }
      if (node.type === 'start') {
        setNodes((currentNodes) => sanitizeGraphNodes(clearDragFlags(clearDragPreviewNodes(currentNodes))));
        draggedPositionLockRef.current = null;
        return;
      }

      try {
        const releaseGhostRoot = computeGhostRootPosition(event, snapshot);
        if (releaseGhostRoot) snapshot.lastGhostRootPosition = releaseGhostRoot;

        const releasedTarget = findDropTarget(event, node.id, snapshot.nodes, snapshot.edges);
        const storedPreview = snapshot.lastInsertionPreview?.sourceNodeId === node.id
          ? snapshot.lastInsertionPreview
          : undefined;

        const commitDropTarget: DragDropTarget | undefined = releasedTarget
          ?? (storedPreview
            ? { target: { nodeId: storedPreview.targetNodeId, direction: storedPreview.direction }, distance: 0 }
            : undefined);
        let commitTarget: { nodeId: string; direction: 'right' | 'bottom' } | undefined;
        let commitLayout: InsertionLayout | undefined;
        if (commitDropTarget) {
          commitTarget = commitDropTarget.target;
          const { preview } = buildPreviewGraphForTarget(
            node.id, commitDropTarget.target, snapshot.mode, snapshot.nodes, snapshot.edges,
          );
          commitLayout = computeInsertionLayout(
            commitDropTarget, node.id, snapshot.nodes, snapshot.edges, preview, snapshot.mode, true,
          );
        }

        if (!commitTarget || !commitLayout) {
          if (snapshot.mode === 'copy') clearAllDragPreviewState(snapshot);
          else commitFreeReposition(snapshot, node.id);
          return;
        }

        const dropArgs = {
          sourceNodeId: node.id,
          target: commitTarget,
          mode: snapshot.mode,
          nodes: snapshot.nodes,
          edges: snapshot.edges,
          fieldBindings: options.fieldBindings,
        };
        const preview = moveOrCopyWorkflowNodes(dropArgs);

        let next = preview;
        if (preview.invalidReferences.length > 0) {
          clearAllDragPreviewState(snapshot);
          const ok = await options.confirmDependencyDrop?.(preview.invalidReferences);
          if (!ok) {
            clearAllDragPreviewState(snapshot);
            return;
          }
          next = moveOrCopyWorkflowNodes({ ...dropArgs, cleanInvalid: true });
        }

        const restored = restoreStableNodeData(next.nodes, snapshot.nodes, snapshot.operatorConfigs);
        const draggedForCommit = getDragSubtreeNodeIds(node.id, snapshot.nodes, snapshot.edges);
        const nestedOperatorCommit = snapshot.nodes
          .filter((item) => draggedForCommit.has(item.id) && (item.type === 'if' || item.type === 'loop')).length > 1;
        const positionedNodes = nestedOperatorCommit
          ? restored
          : applyInsertionPreviewPositions(snapshot.mode, restored, next.idMap, commitLayout);

        const finalNodes = sanitizeGraphNodes(clearDragFlags(positionedNodes));
        setNodes(finalNodes);
        setEdges(sanitizeGraphEdges(finalNodes, clearEdgeDragFlags(next.edges)));
        options.onFieldBindingsChange?.(next.fieldBindings);
      } catch {
        clearAllDragPreviewState(snapshot);
      } finally {
        requestAnimationFrame(() => { draggedPositionLockRef.current = null; });
      }
    },
    onShowResponse: (nodeId: string) => { setResponseNodeId(nodeId); setContextMenu(null); },
    onCloseResponse: () => setResponseNodeId(null),
    onOpenAddStep: (action: WorkflowAction) => { setSidebarAction(action); setContextMenu(null); setHistoryOpen(false); setMethodEditor(null); setConditionEditor(null); setAggregatorEditor(null); },
    onAddStep: (
      kind: WorkflowAction['kind'],
      methodName?: string,
      connector?: WorkflowAction['connector'],
      methodOperation?: InvokerOperation,
      triggerConnection?: WorkflowAction['triggerConnection'],
    ) => {
      if (!sidebarAction || !kind) return;
      const result = createNodeFromAction({ action: { ...sidebarAction, kind, methodName, connector, methodOperation, triggerConnection }, nodes, edges });
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
    onChangeNodeLabel: (nodeId: string, label: string) => setNodes((currentNodes) => currentNodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, subtitle: label, labelEdited: true, hasError: false, errorMessage: undefined } } : node)),
    onSaveMethodConfig: (nodeId: string, methodConfig: WorkflowMethodConfig) => {
      setNodes((currentNodes) => currentNodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, methodConfig: { ...methodConfig, name: methodConfig.name ?? node.data.methodConfig?.name }, hasError: false, errorMessage: undefined } } : node));
      setMethodEditor(null);
    },
    onSaveConditionConfig: (nodeId: string, conditionConfig: ConditionConfig) => {
      setNodes((currentNodes) => currentNodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, conditionConfig, hasError: false, errorMessage: undefined } } : node));
      setConditionEditor(null);
    },
    onSaveDataAggregator: (nodeId: string, dataAggregator: number | null) => {
      setNodes((currentNodes) => currentNodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, dataAggregator, hasError: false, errorMessage: undefined } } : node));
      setAggregatorEditor(null);
    },
    onSetNodeError: (nodeId: string, errorMessage: string) => {
      setNodes((currentNodes) => currentNodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, hasError: true, errorMessage } } : node));
    },
    onClearNodeErrors: () => {
      setNodes((currentNodes) => currentNodes.map((node) => node.data.hasError ? { ...node, data: { ...node.data, hasError: false, errorMessage: undefined } } : node));
    },
  };
}
