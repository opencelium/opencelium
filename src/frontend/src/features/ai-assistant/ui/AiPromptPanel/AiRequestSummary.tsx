import { ConnectorIcon } from '@entities/connector/ui/ConnectorIcon';
import { Button } from '@shared/ui/primitives/Button';
import { Icon } from '@shared/ui/primitives/Icon';
import type { AiConnectorChoice } from '../../utils/aiConnectors.utils';

type Props = {
	prompt: string;
	from?: AiConnectorChoice;
	to?: AiConnectorChoice;
	actionLabel: string;
	actionTestId: string;
	onAction: () => void;
};

/** The request a plan or result was made for, with the way back to change it. */
export function AiRequestSummary({ prompt, from, to, actionLabel, actionTestId, onAction }: Props) {
	return (
		<div className="aiResultSummary">
			<div className="aiResultSummaryHeader">
				<span className="aiResultConnectors">
					{from && <ConnectorChip choice={from} />}
					{to && (
						<>
							<Icon name="arrow-right" size={12} color="inherit" />
							<ConnectorChip choice={to} />
						</>
					)}
				</span>
				<Button type="link" onClick={onAction} testId={actionTestId}>{actionLabel}</Button>
			</div>
			<p className="aiResultPrompt">{prompt}</p>
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
