import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';
import { Button } from '@shared/ui/primitives/Button';
import { Input } from '@shared/ui/primitives/Input';
import { Typography } from '@shared/ui/primitives/Typography';
import { AppStoreBoundary } from '../../../../ai/AppStoreBoundary';
import type { Connection, Enhancement } from '../../../../types/connection';
import { useEnhancementAssistant } from './useEnhancementAssistant';
import './enhancementAssistant.css';

type Props = {
	enhancement: Enhancement;
	connection: Connection | null;
	readOnly?: boolean;
	onApplyScript: (script: string) => void;
};

function EnhancementAssistantContent({ enhancement, connection, readOnly, onApplyScript }: Props) {
	const { t } = useI18n('workflow');
	const assistant = useEnhancementAssistant({ enhancement, connection });
	const { isBroken, isLoading, proposal } = assistant;

	const apply = () => {
		if (!proposal) return;
		onApplyScript(proposal.script);
		assistant.discard();
	};

	return (
		<div className='wfAssistant' data-testid='workflow-enhancement-assistant'>
			{isBroken && !proposal && (
				<Alert
					type='warning'
					showIcon
					message={t('enhancement.assistant.brokenScript')}
					action={<Button type='default' loading={isLoading} disabled={readOnly}
						onClick={assistant.repair} testId='workflow-enhancement-assistant-repair'>
						{t('enhancement.assistant.repair')}
					</Button>}
				/>
			)}

			{!proposal && (
				<div className='wfAssistantPrompt'>
					<Input
						value={assistant.instruction}
						onChange={(event) => assistant.setInstruction(event.target.value)}
						placeholder={t('enhancement.assistant.placeholder')}
						disabled={readOnly}
						testId='workflow-enhancement-assistant-input'
					/>
					<Button type='primary' iconLeft='ai' loading={isLoading}
						disabled={readOnly || !assistant.instruction.trim()}
						onClick={assistant.generate}
						testId='workflow-enhancement-assistant-generate'>
						{t('enhancement.assistant.generate')}
					</Button>
				</div>
			)}

			{assistant.isError && !proposal && (
				<Typography variant='caption' isDanger>{t('enhancement.assistant.failed')}</Typography>
			)}

			{/* The script is proposed, never written straight into the editor: a generated
			    transform the user did not read is the one that silently corrupts a payload. */}
			{proposal && (
				<div className='wfAssistantProposal' data-testid='workflow-enhancement-assistant-proposal'>
					<Typography variant='caption' isSubtle>{proposal.summary}</Typography>
					<pre className='wfAssistantScript'>{proposal.script}</pre>
					<div className='wfAssistantProposalActions'>
						<Button type='primary' onClick={apply} disabled={readOnly}
							testId='workflow-enhancement-assistant-apply'>
							{t('enhancement.assistant.apply')}
						</Button>
						<Button type='text' onClick={assistant.discard}
							testId='workflow-enhancement-assistant-discard'>
							{t('enhancement.assistant.discard')}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

export function EnhancementAssistant(props: Props) {
	return (
		<AppStoreBoundary>
			<EnhancementAssistantContent {...props} />
		</AppStoreBoundary>
	);
}
