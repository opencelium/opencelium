import { useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { formatElapsed, useElapsedSeconds } from '../../hooks/useElapsedSeconds';
import { AI_EXPECTED_SECONDS, type AiWaitFeature } from '../../model/aiExpectedTime';
import '../../styles/ai-expected-time.css';

type Props = {
	feature: AiWaitFeature;
	/** Defaults to when the hint mounts, i.e. when the wait starts. */
	startedAt?: number;
};

/** "Usually 5–15 s · 0:07" while an AI request runs, so a long wait reads as expected rather than stuck. */
export function AiExpectedTime({ feature, startedAt }: Props) {
	const { t } = useI18n('common');
	const [mountedAt] = useState(Date.now);
	const elapsed = useElapsedSeconds(startedAt ?? mountedAt);
	return (
		<span className="aiExpectedTime" title={t('aiExpectedTime.hint')} data-testid={`ai-expected-time-${feature}`}>
			{t('aiExpectedTime.range', AI_EXPECTED_SECONDS[feature])}
			<span className="aiExpectedTimeElapsed">{formatElapsed(elapsed)}</span>
		</span>
	);
}
