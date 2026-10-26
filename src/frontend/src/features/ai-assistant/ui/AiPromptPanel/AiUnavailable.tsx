import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Icon } from '@shared/ui/primitives/Icon';

type Props = {
	isChecking: boolean;
	onCheckAgain: () => void;
};

export function AiUnavailable({ isChecking, onCheckAgain }: Props) {
	const { t } = useI18n('workflow');
	return (
		<div className="aiUnavailable" data-testid="ai-panel-unavailable">
			<span className="aiUnavailableIcon" aria-hidden><Icon name="plug-off" size={20} color="inherit" /></span>
			<div className="aiUnavailableTitle">{t('ai.unavailable.title')}</div>
			<p className="aiUnavailableText">{t('ai.unavailable.text')}</p>
			<ol className="aiUnavailableSteps">
				<li>
					<span className="aiUnavailableStepNumber" aria-hidden>1</span>
					<div className="aiUnavailableStepBody">
						<span className="aiUnavailableStepTitle">{t('ai.unavailable.startModel')}</span>
						<code className="aiCommand">brew services start ollama</code>
					</div>
				</li>
				<li>
					<span className="aiUnavailableStepNumber" aria-hidden>2</span>
					<div className="aiUnavailableStepBody">
						<span className="aiUnavailableStepTitle">
							{t('ai.unavailable.startGateway')} <code>src/ai-gateway</code>
						</span>
						<code className="aiCommand">npm start</code>
					</div>
				</li>
			</ol>
			<Button iconLeft="refresh" loading={isChecking} onClick={onCheckAgain} className="aiUnavailableCheck"
				testId="ai-panel-check-again">
				{t('ai.actions.checkAgain')}
			</Button>
		</div>
	);
}
