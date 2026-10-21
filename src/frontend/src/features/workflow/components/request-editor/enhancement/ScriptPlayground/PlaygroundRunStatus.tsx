import { useEffect, useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { formatRelativeTime } from '@shared/utils/formatRelativeTime';

type Props = {
	status: 'idle' | 'running' | 'done';
	isStale: boolean;
	completedAt?: number;
	blockedReason?: string;
};
export function PlaygroundRunStatus({ status, isStale, completedAt, blockedReason }: Props) {
	const { t, lang } = useI18n('workflow');
	const [now, setNow] = useState(() => Date.now());
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
						: isStale
							? t('sandbox.stale')
							: t('sandbox.lastRun', {
									time: formatRelativeTime(Math.min(completedAt, now), lang, now),
								})}
		</span>
	);
}
