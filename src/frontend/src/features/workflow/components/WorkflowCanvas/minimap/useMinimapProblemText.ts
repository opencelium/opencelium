import { useCallback } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { LensInvalidReason } from '../../../lens/bindingLens.types';
import { extractConnectorErrorReason } from '../../../connector-status/ConnectorStatusDot/connectorStatusDot.utils';
import type { MinimapProblem } from './minimapIssues';

const REASON_KEY: Record<LensInvalidReason, string> = {
	'out-of-scope': 'bindingLens.reasonOutOfScope',
	'missing-method': 'bindingLens.reasonMissingMethod',
	'missing-variable': 'bindingLens.reasonMissingVariable',
};

/** Reuses the copy the node badges and the binding lens already show for the same problem. */
export const useMinimapProblemText = () => {
	const { t } = useI18n('workflow');
	return useCallback((problem: MinimapProblem): string => {
		switch (problem.kind) {
			case 'validation': return problem.message;
			case 'test-run': return problem.message ?? t('minimap.problems.testRunFailed');
			case 'connector':
				return problem.lastError
					? t('sidebar.connectorStatus.failedWithReason', { reason: extractConnectorErrorReason(problem.lastError) })
					: t(problem.status === 'DOWN' ? 'sidebar.connectorStatus.down' : 'sidebar.connectorStatus.authFailed');
			case 'binding':
				return t('minimap.problems.binding', { count: problem.count, reason: t(REASON_KEY[problem.reason]) });
			case 'operator-unconfigured':
				return t(problem.operator === 'if' ? 'minimap.problems.ifUnconfigured' : 'minimap.problems.loopUnconfigured');
			default: {
				const _exhaustive: never = problem;
				return _exhaustive;
			}
		}
	}, [t]);
};
