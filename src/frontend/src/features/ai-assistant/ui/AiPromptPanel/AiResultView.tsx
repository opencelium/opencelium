import { useMemo } from 'react';
import { ConnectorIcon } from '@entities/connector/ui/ConnectorIcon';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Icon } from '@shared/ui/primitives/Icon';
import type { GenerateWorkflowResponse } from '../../model/aiGateway.types';
import type { AiConnectorChoice, AiConnectorPair } from '../../utils/aiConnectors.utils';
import { buildDslPreview } from '../../utils/dslPreview.utils';
import { AiStepTree, type ConnectorLookup } from './AiStepTree';
import { AiIssueList } from './AiIssueList';

type Props = {
	prompt: string;
	response: GenerateWorkflowResponse;
	choices: AiConnectorChoice[];
	connectors: AiConnectorPair;
	onEditPrompt: () => void;
};

export function AiResultView({ prompt, response, choices, connectors, onEditPrompt }: Props) {
	const { t } = useI18n('workflow');
	const preview = useMemo(() => buildDslPreview(response.dsl), [response.dsl]);
	const byId = (connectorId: number | null) => choices.find((choice) => choice.connectorId === connectorId);
	const lookup: ConnectorLookup = { from: byId(connectors.fromId), to: byId(connectors.toId) };

	return (
		<div className="aiResult" data-testid="ai-panel-result">
			<div className="aiResultSummary">
				<div className="aiResultSummaryHeader">
					<span className="aiResultConnectors">
						{lookup.from && <ConnectorChip choice={lookup.from} />}
						{lookup.to && (
							<>
								<Icon name="arrow-right" size={12} color="inherit" />
								<ConnectorChip choice={lookup.to} />
							</>
						)}
					</span>
					<Button type="link" onClick={onEditPrompt} testId="ai-panel-edit-prompt">{t('ai.actions.editPrompt')}</Button>
				</div>
				<p className="aiResultPrompt">{prompt}</p>
			</div>

			<section className="aiPanelSection">
				<div className="aiPanelSectionTitle aiPanelSectionTitle--split">
					<span>{t('ai.result.steps')}</span>
					<span className="aiPanelSectionMeta">{t('ai.result.stepCount', { count: preview.stepCount })}</span>
				</div>
				<div className="aiStepTreeCard">
					<AiStepTree steps={response.dsl.steps} preview={preview} connectors={lookup} issues={response.issues} />
				</div>
			</section>

			<AiIssueList issues={response.issues} preview={preview} />
		</div>
	);
}

function ConnectorChip({ choice }: { choice: AiConnectorChoice }) {
	return (
		<span className="aiConnectorChip">
			<ConnectorIcon icon={choice.icon} size={18} isCircled />
			{choice.title}
		</span>
	);
}
