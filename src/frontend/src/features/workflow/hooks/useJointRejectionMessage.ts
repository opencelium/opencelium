import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { JointRejectionReason } from '../utils/jumpValidator';

/**
 * Why the hovered node cannot be the target of the joint currently being drawn.
 * Returns undefined when no joint is in progress, or for the joint's own source.
 */
export const useJointRejectionMessage = (
	reason?: JointRejectionReason,
	blockingLabel?: string,
) => {
	const { t } = useI18n('workflow');
	if (!reason) return undefined;
	switch (reason) {
		case 'self':
			return undefined;
		case 'not-a-method':
			return t('joint.invalid.notAMethod');
		case 'different-loop-scope':
			return t('joint.invalid.differentLoopScope');
		case 'backwards':
			return t('joint.invalid.backwards');
		case 'skips-referenced-method':
			return blockingLabel
				? t('joint.invalid.skipsReferencedMethod', { method: blockingLabel })
				: t('joint.invalid.skipsReferencedMethodUnnamed');
		default: {
			const _exhaustive: never = reason;
			return _exhaustive;
		}
	}
};
