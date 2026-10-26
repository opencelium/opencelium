import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';
import { Button } from '@shared/ui/primitives/Button';
import type { AiGenerationFailure } from '../../model/aiPanelState';

type Props = {
	failure: AiGenerationFailure;
	/** The gateway's own message, shown as technical detail under the translated explanation. */
	detail?: string;
	onRetry: () => void;
};

const MESSAGE_KEY = {
	'generation-failed': 'ai.error.generationFailed',
	'unknown-invoker': 'ai.error.unknownInvoker',
	unreachable: 'ai.error.unreachable',
} as const satisfies Record<AiGenerationFailure, string>;

export function AiGenerationErrorAlert({ failure, detail, onRetry }: Props) {
	const { t } = useI18n('workflow');
	return (
		<Alert type="error" showIcon className="aiErrorAlert" message={t('ai.error.title')}
			description={(
				<div className="aiErrorBody">
					<span>{t(MESSAGE_KEY[failure])}</span>
					{detail && <code className="aiErrorDetail">{detail}</code>}
					<div>
						<Button iconLeft="refresh" onClick={onRetry} testId="ai-panel-retry">{t('ai.actions.tryAgain')}</Button>
					</div>
				</div>
			)} />
	);
}
