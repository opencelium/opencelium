import { useI18n } from '@shared/i18n/hooks/useI18n';
import { AI_EXPECTED_SECONDS, type AiWaitFeature } from '../model/aiExpectedTime';

/** The range alone, for places that only take a string (tooltips). */
export function useAiExpectedTimeText(feature: AiWaitFeature): string {
	const { t } = useI18n('common');
	return t('aiExpectedTime.range', AI_EXPECTED_SECONDS[feature]);
}
