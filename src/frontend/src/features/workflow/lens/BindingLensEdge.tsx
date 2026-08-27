import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { buildDippedArc } from './bindingLensArc';
import { lensEdgeStyle } from './lensEdgeStyle';
import type { LensEdgeModel } from './bindingLens.types';

export function BindingLensEdge({
	id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data,
}: EdgeProps<LensEdgeModel>) {
	const { t } = useI18n('workflow');
	const count = data?.count ?? 0;
	const invalidCount = data?.invalidCount ?? 0;
	const isBroken = count > 0 && invalidCount === count;
	const isPair = data?.variant !== 'reference';

	// A pair arc has to dodge the control-flow edge between the same two nodes, so
	// it bows below the row. A field arc lands on a card's own row handles, where
	// nothing else runs — there the ordinary bezier between those two handle sides
	// is both shorter and stable, instead of a hook sized from the whole span.
	const [bezierPath, bezierLabelX, bezierLabelY] = getBezierPath({
		sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
	});
	const dipped = buildDippedArc(sourceX, sourceY, targetX, targetY);
	const path = isPair ? dipped.path : bezierPath;
	const labelX = isPair ? dipped.labelX : bezierLabelX;
	const labelY = isPair ? dipped.labelY : bezierLabelY;
	const { stroke, strokeDasharray } = lensEdgeStyle({
		isBroken, hasScript: !!data?.hasScript,
	});
	// One marker per edge rather than three shared defs: a marker is referenced by
	// document id, and defs parked in an SVG of their own resolve inconsistently
	// once that SVG is hidden. Inline here, they live in the same <svg> xyflow
	// draws the edge into and cannot go missing.
	const markerId = `lensArrow-${String(id)}`;

	const tooltip = [
		t('bindingLens.pairTooltip', {
			provider: data?.providerLabel ?? t('bindingLens.unknownMethod'),
			consumer: data?.consumerLabel ?? t('bindingLens.unknownMethod'),
		}),
		isPair
			? t('bindingLens.bindingCount', { count })
			: `${data?.sourcePath ?? ''} → ${data?.targetPath ?? ''}`,
		invalidCount > 0 ? t('bindingLens.brokenCount', { count: invalidCount }) : '',
		t(data?.activates === 'expand' ? 'bindingLens.expandHint' : 'bindingLens.editHint'),
	].filter(Boolean).join(' · ');

	// An expanded arc already says everything on its two field rows; only a
	// collapsed pair (how many, any break) or a broken reference has something
	// left to badge. Carrying a script no longer does: the arc's own colour and
	// dotting say that, and a badge holding nothing but a ƒx was a second mark
	// for one fact.
	const showBadge = isPair || invalidCount > 0;

	return (
		<>
			{/* Which end is the provider and which the consumer is the first thing an
			    arc has to say, and the shape alone never said it. userSpaceOnUse so
			    the head keeps its size instead of scaling with the 2px stroke, and
			    the colour comes through `style` — a var() in a presentation
			    attribute is not reliably honoured. */}
			<defs>
				<marker
					id={markerId}
					markerUnits='userSpaceOnUse'
					markerWidth={9}
					markerHeight={9}
					refX={8}
					refY={4.5}
					orient='auto'
				>
					<path d='M0,0.5 L8,4.5 L0,8.5 z' style={{ fill: stroke }} />
				</marker>
			</defs>
			<BaseEdge
				id={String(id)}
				path={path}
				className={`bindingLensEdgePath ${data?.isSelected ? 'bindingLensEdgePathSelected' : ''}`}
				markerEnd={`url(#${markerId})`}
				style={{ stroke, strokeDasharray }}
			/>
			{/* The arc's own hit target: a lens edge is not xyflow-selectable (its
			    selection would land in the graph's edge state), so activation is a
			    transparent fat stroke of its own rather than onEdgeClick. */}
			<path
				d={path}
				className='bindingLensEdgeHit'
				onClick={data?.onActivate}
				data-testid={`workflow-binding-lens-hit-${data?.bindingKeys[0] ?? id}`}
			/>
			{showBadge && (
				<EdgeLabelRenderer>
					<Tooltip content={tooltip}>
						<div
							className={[
								'bindingLensBadge nodrag nopan',
								isBroken ? 'bindingLensBadgeBroken' : '',
								isPair ? 'bindingLensBadgeExpandable' : '',
							].filter(Boolean).join(' ')}
							style={{
								transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
								borderColor: stroke,
							}}
							onClick={data?.onActivate}
							data-testid={`workflow-binding-lens-edge-${data?.bindingKeys[0] ?? id}`}
						>
							{/* The count stays plain text: the arc it sits on and the badge's
							    border already carry the kind's colour, and neither of those has
							    to be read to be seen. */}
							{isPair && <span className='bindingLensBadgeCount'>{count}</span>}
							{invalidCount > 0 && (isPair ? !isBroken : true) && (
								<span className='bindingLensBadgeWarning'>
									{isPair ? `!${invalidCount}` : '!'}
								</span>
							)}
						</div>
					</Tooltip>
				</EdgeLabelRenderer>
			)}
		</>
	);
}
