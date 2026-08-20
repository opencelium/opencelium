import { BaseEdge, EdgeLabelRenderer } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { LensEdgeModel } from './bindingLens.types';

// The arc deliberately does not trace the flow edge between the same two nodes:
// it leaves the provider's bottom handle, dips below the row and arrives at the
// consumer's left handle, so a binding never hides behind the control-flow edge
// it runs alongside.
const ARC_MIN_DIP = 40;
const ARC_MAX_DIP = 160;

export function BindingLensEdge({
	id, sourceX, sourceY, targetX, targetY, data,
}: EdgeProps<LensEdgeModel>) {
	const { t } = useI18n('workflow');
	const dip = Math.min(ARC_MAX_DIP,
		Math.max(ARC_MIN_DIP, Math.hypot(targetX - sourceX, targetY - sourceY) * 0.28));
	const controlX = (sourceX + targetX) / 2;
	const controlY = Math.max(sourceY, targetY) + dip;
	const path = `M ${sourceX},${sourceY} Q ${controlX},${controlY} ${targetX},${targetY}`;
	// Quadratic curve at t = 0.5 — the arc's apex, where the badge belongs.
	const labelX = (sourceX + 2 * controlX + targetX) / 4;
	const labelY = (sourceY + 2 * controlY + targetY) / 4;

	const count = data?.count ?? 0;
	const invalidCount = data?.invalidCount ?? 0;
	const isBroken = count > 0 && invalidCount === count;
	const isPair = data?.variant !== 'reference';
	const stroke = isBroken
		? 'var(--color-status-error-fg)'
		: data?.color || 'var(--color-action-primary)';

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
	// collapsed pair (how many, any script, any break) or a broken reference has
	// something left to badge.
	const showBadge = isPair || isBroken || !!data?.hasScript;

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
							{isPair && (
								<span className='bindingLensBadgeCount' style={{ color: stroke }}>{count}</span>
							)}
							{data?.hasScript && <span className='bindingLensBadgeScript'>ƒx</span>}
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
