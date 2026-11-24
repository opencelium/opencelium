import type { ReactNode } from 'react';
import { parseGlobalReference } from '@entities/globalVariable/lib/globalReference';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { MethodWithId } from '../../../types/connection';
import { extractWebhookValue } from '../../request-editor/body-editor/bodyWebhook';
import { ReferenceChip } from '../../reference-chip/ReferenceChip';
import { ReferenceChipActions } from '../../reference-chip/ReferenceChipActions';
import { formatStepReferencePath, GLOBAL_CHIP_COLOR, WEBHOOK_CHIP_COLOR } from '../../reference-chip/referenceChip.utils';
import { useReferenceSourceLabels } from '../../reference-chip/ReferenceSourceContext';

export type ConditionReferenceKind = 'step' | 'webhook' | 'global';

type Props = {
	side: 'left' | 'right';
	kind: ConditionReferenceKind;
	fieldValue: string;
	method?: MethodWithId;
	/** Shown on hover, e.g. the live value while a test run is paused. */
	tooltip?: ReactNode;
	onHoverChange?: (isHovered: boolean) => void;
	onEdit: () => void;
	onRemove: () => void;
};

/** A chosen condition reference, shown as the shared chip; Edit brings back the selects. */
export function ConditionReferenceChip({ side, kind, fieldValue, method, tooltip, onHoverChange, onEdit, onRemove }: Props) {
	const labels = useReferenceSourceLabels();
	const chipProps = (() => {
		switch (kind) {
			case 'webhook': return { color: WEBHOOK_CHIP_COLOR, source: labels.webhook, path: extractWebhookValue(fieldValue) };
			case 'global': return { color: GLOBAL_CHIP_COLOR, source: labels.global,
				path: parseGlobalReference(fieldValue)?.name ?? fieldValue };
			case 'step': return { color: method?.color ?? 'var(--color-text-disabled)', source: method?.label || method?.name,
				path: formatStepReferencePath(fieldValue) };
			default: {
				const _exhaustive: never = kind;
				return _exhaustive;
			}
		}
	})();
	const chip = <ReferenceChip {...chipProps} title={tooltip ? undefined : fieldValue} />;
	return (
		<div className='conditionValueInput conditionValueChip'
			onMouseEnter={() => onHoverChange?.(true)} onMouseLeave={() => onHoverChange?.(false)}>
			<ReferenceChipActions testId={`workflow-condition-${side}-reference`} onEdit={onEdit} onRemove={onRemove}>
				{tooltip ? <Tooltip content={tooltip} maxWidth={320}>{chip}</Tooltip> : chip}
			</ReferenceChipActions>
		</div>
	);
}
