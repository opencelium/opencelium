import { useState } from 'react';
import { Dialog } from '@shared/ui/primitives/Dialog';
import { Button } from '@shared/ui/primitives/Button';
import { Radio } from '@shared/ui/primitives/Radio';
import { Typography } from '@shared/ui/primitives/Typography';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { WorkflowRunConflictPolicy } from '../../../types/workflow.types';
import { DEFAULT_RUN_CONFLICT_POLICY } from '../../../utils/runConflictPolicy';

type Props = {
	open: boolean;
	value: WorkflowRunConflictPolicy | undefined;
	readOnly: boolean;
	onClose: () => void;
	onSave: (policy: WorkflowRunConflictPolicy) => void;
};

const POLICIES: WorkflowRunConflictPolicy[] = ['QUEUE', 'REJECT'];

export function RunSettingsDialog(props: Props) {
	if (!props.open) return null;
	return <RunSettingsContent {...props} />;
}

function RunSettingsContent({ value, readOnly, onClose, onSave }: Props) {
	const { t } = useI18n('workflow');
	const [policy, setPolicy] = useState<WorkflowRunConflictPolicy>(value ?? DEFAULT_RUN_CONFLICT_POLICY);
	return (
		<Dialog open onClose={onClose} title={t('runSettings.title')} width={560} testId="workflow-run-settings-dialog"
			footer={readOnly ? null : (
				<Button type="primary" onClick={() => onSave(policy)} testId="workflow-run-settings-save">
					{t('runSettings.save')}
				</Button>
			)}>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
				<Typography variant="body">{t('runSettings.intro')}</Typography>
				<Typography variant="label">{t('runSettings.question')}</Typography>
				{POLICIES.map((option) => (
					<div key={option}>
						<Radio name="run-conflict-policy" value={option} checked={policy === option} disabled={readOnly}
							onChange={() => setPolicy(option)} label={t(`runSettings.policy.${option}.label`)} />
						<div style={{ paddingInlineStart: 24 }}>
							<Typography variant="caption" isSubtle>{t(`runSettings.policy.${option}.hint`)}</Typography>
						</div>
					</div>
				))}
			</div>
		</Dialog>
	);
}
