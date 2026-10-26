import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { formatElapsed, useElapsedSeconds } from '../../hooks/useElapsedSeconds';

type Props = {
	startedAt: number;
};

export function AiGeneratingProgress({ startedAt }: Props) {
	const { t } = useI18n('workflow');
	const elapsed = useElapsedSeconds(startedAt);

	return (
		<div className="aiProgress" role="status" aria-live="polite" data-testid="ai-panel-progress">
			<div className="aiProgressHeader">
				<span className="aiProgressTitle">
					<Loading size="xs" inline />
					{t('ai.generating.title')}
				</span>
				<span className="aiProgressElapsed">{formatElapsed(elapsed)}</span>
			</div>
			<div className="aiProgressTrack" aria-hidden><span className="aiProgressBar" /></div>
			<div className="aiProgressHint">{t('ai.generating.hint')}</div>
		</div>
	);
}
