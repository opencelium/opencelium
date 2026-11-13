import { createContext, useContext } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import type { ExecutionPlaygroundLocation } from '../model/executionPlayground';

export const LogPlaygroundOpenContext = createContext<((location: ExecutionPlaygroundLocation) => void) | null>(null);
export const LogPlaygroundRootContext = createContext<Pick<ExecutionPlaygroundLocation, 'direction' | 'executionId'> | null>(null);

export function LogPlaygroundAction({ elementId, indexPath, loopIndex }: Pick<ExecutionPlaygroundLocation, 'elementId' | 'indexPath' | 'loopIndex'>) {
	const open = useContext(LogPlaygroundOpenContext);
	const root = useContext(LogPlaygroundRootContext);
	const { t } = useI18n('logs');
	if (!open || !root || !elementId || !indexPath) return null;
	return <Button testId='logs-open-in-playground' onClick={() => open({ ...root, elementId, indexPath, loopIndex })}>
		{t('openInPlayground')}
	</Button>;
}
