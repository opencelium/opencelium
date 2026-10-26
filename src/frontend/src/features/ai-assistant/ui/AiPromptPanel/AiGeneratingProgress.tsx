import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { formatElapsed, useElapsedSeconds } from '../../hooks/useElapsedSeconds';
import type { AiGenerationStage } from '../../model/aiPanelState';

type Props = {
	stage: AiGenerationStage;
	startedAt: number;
};

const COPY = {
	plan: { title: 'ai.planning.title', hint: 'ai.planning.hint' },
	build: { title: 'ai.generating.title', hint: 'ai.generating.hint' },
} as const;

export function AiGeneratingProgress({ stage, startedAt }: Props) {
	const { t } = useI18n('workflow');
	const elapsed = useElapsedSeconds(startedAt);

	return (
		<div className="aiProgress" role="status" aria-live="polite" data-testid="ai-panel-progress">
			<div className="aiProgressHeader">
				<span className="aiProgressTitle">
					<Loading size="xs" inline />
					{t(COPY[stage].title)}
				</span>
				<span className="aiProgressElapsed">{formatElapsed(elapsed)}</span>
			</div>
			<div className="aiProgressTrack" aria-hidden><span className="aiProgressBar" /></div>
			<div className="aiProgressHint">{t(COPY[stage].hint)}</div>
		</div>
	);
}
