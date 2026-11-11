import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { isAiConfigured, useExplainConnectorErrorMutation, useGetAiHealthQuery } from '../../api/aiApi';
import { isAiFeatureOn } from '../../api/useIsAiFeatureOn';
import type { ConnectorErrorExplanation } from '../../model/aiGateway.types';
import { AiExpectedTime } from '../AiExpectedTime/AiExpectedTime';
import '../../styles/ai-connector-error.css';

type Props = {
	connector: { connectorId: number; title: string; invokerName: string };
	status: 'DOWN' | 'AUTH_FAILED';
	lastError: string | null;
};

type State =
	| { status: 'idle' }
	| { status: 'explaining' }
	| { status: 'explained'; explanation: ConnectorErrorExplanation }
	| { status: 'error' };

/**
 * "Explain with AI" under a connector that cannot connect. Only the connector's name, system, status and stored error
 * text are sent; its settings never are (the gateway reads which settings exist from the invoker).
 */
export function AiConnectorErrorExplain({ connector, status, lastError }: Props) {
	const { t, lang } = useI18n('workflow');
	const navigate = useNavigate();
	const isConfigured = isAiConfigured();
	const health = useGetAiHealthQuery(undefined, { skip: !isConfigured });
	const [explain] = useExplainConnectorErrorMutation();
	const [state, setState] = useState<State>({ status: 'idle' });
	const isAvailable = isConfigured && health.data?.ollama.reachable === true && health.data.workflowModel.available && isAiFeatureOn(health.data, 'explain-connector-error');
	if (!isAvailable) return null;

	const run = async () => {
		setState({ status: 'explaining' });
		try {
			const explanation = await explain({ language: lang.startsWith('de') ? 'de' : 'en', connector: connector.title,
				invoker: connector.invokerName, status, error: lastError ?? '' }).unwrap();
			setState({ status: 'explained', explanation });
		} catch {
			setState({ status: 'error' });
		}
	};

	if (state.status !== 'explained') {
		return (
			<div className="aiConnectorError">
				<Button type="link" iconLeft="sparkles" onClick={() => void run()} loading={state.status === 'explaining'}
					testId={`ai-connector-explain-${connector.connectorId}`}>{t('ai.connectorError.explain')}</Button>
				{state.status === 'explaining' && <AiExpectedTime feature="connectorError" />}
				{state.status === 'error' && <div className="aiConnectorErrorFailed">{t('ai.connectorError.failed')}</div>}
			</div>
		);
	}
	const { explanation } = state;
	return (
		<div className="aiConnectorError aiConnectorErrorResult" data-testid={`ai-connector-explanation-${connector.connectorId}`}>
			<p className="aiConnectorErrorSummary">{explanation.summary}</p>
			<p className="aiConnectorErrorCause">{explanation.cause}</p>
			<div className="aiConnectorErrorLabel">{t(`ai.connectorError.fixIn.${explanation.fixIn}`)}</div>
			<ol className="aiConnectorErrorChecks">{explanation.checks.map((check) => <li key={check}>{check}</li>)}</ol>
			{explanation.fixIn === 'connector' && (
				<Button type="link" onClick={() => navigate(`/connector/update/${connector.connectorId}`)}
					testId={`ai-connector-open-${connector.connectorId}`}>{t('ai.connectorError.openConnector', { name: connector.title })}</Button>
			)}
		</div>
	);
}
