import { Panel } from '@xyflow/react';
import { Button } from '@shared/ui/primitives/Button';
import { Icon } from '@shared/ui/primitives/Icon';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { JointTargetVerdict } from '../../utils/jumpValidator';

type JointPickingBarProps = {
	verdicts?: Map<string, JointTargetVerdict>;
	onCancel?: () => void;
};

export function JointPickingBar({ verdicts, onCancel }: JointPickingBarProps) {
	const { t } = useI18n('workflow');
	const hasTargets = [...(verdicts?.values() ?? [])].some((verdict) => verdict.valid);
	return (
		<Panel position='top-center' className='jointPickingPanel'>
			<div className={`jointPickingBar ${hasTargets ? '' : 'jointPickingBarEmpty'}`} data-testid='workflow-joint-picking-bar'>
				<Icon name='link' size={14} />
				<span>{hasTargets ? t('joint.picking.hint') : t('joint.noTargets')}</span>
				<Button type='text' onClick={onCancel} testId='workflow-joint-picking-cancel'>
					{t('actions.cancel')}
				</Button>
			</div>
		</Panel>
	);
}
