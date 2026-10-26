import { useMemo } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { GenerateWorkflowResponse } from '../../model/aiGateway.types';
import type { AiConnectorChoice, AiConnectorPair } from '../../utils/aiConnectors.utils';
import { buildDslPreview } from '../../utils/dslPreview.utils';
import { AiStepTree, type ConnectorLookup } from './AiStepTree';
import { AiIssueList } from './AiIssueList';
import { AiRequestSummary } from './AiRequestSummary';

type Props = {
	prompt: string;
	response: GenerateWorkflowResponse;
	choices: AiConnectorChoice[];
	connectors: AiConnectorPair;
	onEditPlan: () => void;
};

export function AiResultView({ prompt, response, choices, connectors, onEditPlan }: Props) {
	const { t } = useI18n('workflow');
	const preview = useMemo(() => buildDslPreview(response.dsl), [response.dsl]);
	const byId = (connectorId: number | null) => choices.find((choice) => choice.connectorId === connectorId);
	const lookup: ConnectorLookup = { from: byId(connectors.fromId), to: byId(connectors.toId) };

	return (
		<div className="aiResult" data-testid="ai-panel-result">
			<AiRequestSummary prompt={prompt} from={lookup.from} to={lookup.to} actionLabel={t('ai.actions.editPlan')}
				actionTestId="ai-panel-edit-plan" onAction={onEditPlan} />

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
