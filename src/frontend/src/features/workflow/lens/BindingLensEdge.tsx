import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { buildDippedArc } from './bindingLensArc';
import { lensEdgeStroke } from './lensEdgeStroke';
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
	const stroke = lensEdgeStroke({ isBroken, hasScript: !!data?.hasScript });

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
	// left to badge. Carrying a script no longer does: the arc's own colour says
	// that, and a badge holding nothing but a ƒx was a second mark for one fact.
	const showBadge = isPair || invalidCount > 0;

	return (
		<>
			<BaseEdge
				id={String(id)}
				path={path}
				className={`bindingLensEdgePath ${data?.isSelected ? 'bindingLensEdgePathSelected' : ''}`}
				style={{
					stroke,
					strokeDasharray: isBroken ? '6 5' : undefined,
				}}
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
