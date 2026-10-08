import { useRef, type PointerEvent } from 'react';
import { useReactFlow, useStore } from '@xyflow/react';
import type { ThemeMode } from '@shared/theme/types';
import type { MinimapDot, MinimapGroup, MinimapModel } from './minimap.model';
import { contains, fitViewBox, flowViewRect, type MinimapViewBox } from './minimapGeometry';
import { groupColor } from './minimapPalette';
import { useElementSize } from './useElementSize';

/**
 * Marker sizes in map pixels, converted to flow units per render so they never scale
 * with the graph. A marker shrinks toward the minimum once the graph is zoomed out
 * far enough that its closest neighbours would otherwise touch.
 */
const MAX_DOT_RADIUS_PX = 6;
const MIN_DOT_RADIUS_PX = 2.5;
const ISSUE_RING_PX = 2.5;
/** Share of the tightest gap a marker (with its ring) may fill. */
const GAP_FILL = 0.4;

const dotRadiusPx = (tightestGap: number | null, unitsPerPx: number) => tightestGap === null
	? MAX_DOT_RADIUS_PX
	: Math.min(MAX_DOT_RADIUS_PX, Math.max(MIN_DOT_RADIUS_PX, (tightestGap / unitsPerPx) * GAP_FILL - ISSUE_RING_PX));

type Props = {
	model: MinimapModel;
	issueNodeIds: ReadonlySet<string>;
	currentIssueNodeId: string | null;
	themeMode: ThemeMode;
	ariaLabel: string;
};

type Drag = { pointerId: number; lastX: number; lastY: number; unitsPerPx: number };

const diamondPath = (x: number, y: number, r: number) => `M ${x} ${y - r} L ${x + r} ${y} L ${x} ${y + r} L ${x - r} ${y} Z`;

function MinimapMarker({ dot, color, radius }: { dot: MinimapDot; color: string | undefined; radius: number }) {
	switch (dot.shape) {
		case 'start': return <circle className="workflowMinimapStart" cx={dot.x} cy={dot.y} r={radius} />;
		case 'circle': return <circle cx={dot.x} cy={dot.y} r={radius} fill={color} />;
		case 'diamond': return <path d={diamondPath(dot.x, dot.y, radius)} fill={color} />;
		default: {
			const _exhaustive: never = dot.shape;
			return _exhaustive;
		}
	}
}

export function MinimapCanvas({ model, issueNodeIds, currentIssueNodeId, themeMode, ariaLabel }: Props) {
	const { ref, width: mapWidth, height: mapHeight } = useElementSize<SVGSVGElement>();
	const transform = useStore((state) => state.transform);
	const paneWidth = useStore((state) => state.width);
	const paneHeight = useStore((state) => state.height);
	const { setViewport } = useReactFlow();
	const drag = useRef<Drag | null>(null);

	const view = flowViewRect(transform, paneWidth, paneHeight);
	const box: MinimapViewBox = fitViewBox(model.bounds, view, mapWidth || 1, mapHeight || 1);
	const colors = new Map(model.groups.map((group: MinimapGroup) => [group.key, groupColor(group, themeMode)]));
	const radius = dotRadiusPx(model.tightestGap, box.unitsPerPx) * box.unitsPerPx;
	const zoom = transform[2];

	const centreViewOn = (x: number, y: number) =>
		setViewport({ x: paneWidth / 2 - x * zoom, y: paneHeight / 2 - y * zoom, zoom });

	// Clicking outside the viewport jumps it there; dragging then moves it by the
	// pointer's travel, measured in the scale the drag started at — the view box
	// grows and shrinks with the viewport, so re-projecting every move would drift.
	const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
		if (event.button !== 0) return;
		const bounds = event.currentTarget.getBoundingClientRect();
		const x = box.x + (event.clientX - bounds.left) * box.unitsPerPx;
		const y = box.y + (event.clientY - bounds.top) * box.unitsPerPx;
		if (!contains(view, x, y)) centreViewOn(x, y);
		drag.current = { pointerId: event.pointerId, lastX: event.clientX, lastY: event.clientY, unitsPerPx: box.unitsPerPx };
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
		const current = drag.current;
		if (!current || current.pointerId !== event.pointerId) return;
		const dx = (event.clientX - current.lastX) * current.unitsPerPx;
		const dy = (event.clientY - current.lastY) * current.unitsPerPx;
		drag.current = { ...current, lastX: event.clientX, lastY: event.clientY };
		centreViewOn(view.x + view.width / 2 + dx, view.y + view.height / 2 + dy);
	};

	const onPointerEnd = (event: PointerEvent<SVGSVGElement>) => {
		if (drag.current?.pointerId !== event.pointerId) return;
		drag.current = null;
		if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
	};

	return (
		<svg ref={ref} className="workflowMinimapCanvas" role="img" aria-label={ariaLabel}
			viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
			onPointerDown={onPointerDown} onPointerMove={onPointerMove}
			onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}
			data-testid="workflow-minimap-canvas">
			{model.lines.map((line) => (
				<polyline key={line.id} className="workflowMinimapLine" points={line.points.join(' ')}
					vectorEffect="non-scaling-stroke" />
			))}
			{model.dots.map((dot) => {
				const hasIssue = issueNodeIds.has(dot.id);
				const isCurrent = dot.id === currentIssueNodeId;
				const isOutside = !contains(view, dot.x, dot.y);
				return (
					<g key={dot.id} className={`workflowMinimapDot${isOutside ? ' workflowMinimapDotOutside' : ''}`}
						data-testid={`workflow-minimap-dot-${dot.id}`} data-issue={hasIssue || undefined}>
						{hasIssue && (
							<circle className={`workflowMinimapIssueRing${isCurrent ? ' workflowMinimapIssueRingCurrent' : ''}`}
								cx={dot.x} cy={dot.y} r={radius + ISSUE_RING_PX * box.unitsPerPx}
								vectorEffect="non-scaling-stroke" />
						)}
						<MinimapMarker dot={dot} color={dot.groupKey ? colors.get(dot.groupKey) : undefined} radius={radius} />
					</g>
				);
			})}
			<rect className="workflowMinimapViewport" x={view.x} y={view.y} width={view.width} height={view.height}
				rx={4 * box.unitsPerPx} vectorEffect="non-scaling-stroke" />
		</svg>
	);
}
