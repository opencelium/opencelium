import { useEffect, useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = {
	status: 'idle' | 'running' | 'done';
	stale: boolean;
	completedAt?: number;
	blockedReason?: string;
};
export function PlaygroundRunStatus({ status, stale, completedAt, blockedReason }: Props) {
	const { t } = useI18n('workflow');
	const [now, setNow] = useState(0);
	useEffect(() => {
		if (completedAt === undefined) return;
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, [completedAt]);

	return (
		<span className="scriptPlaygroundRunStatus" data-testid="script-playground-run-status">
			{status === 'running'
				? t('sandbox.running')
				: blockedReason
					? blockedReason
					: completedAt === undefined
						? t('sandbox.notRun')
						: stale
							? t('sandbox.stale')
							: t('sandbox.lastRun', {
									seconds: Math.max(0, (now - completedAt) / 1000).toFixed(1),
								})}
		</span>
	);
}
