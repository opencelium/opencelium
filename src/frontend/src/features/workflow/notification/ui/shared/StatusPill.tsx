import type { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{ tone: 'success' | 'warning' | 'error'; testId?: string }>;

export function StatusPill({ tone, testId, children }: Props) {
	return <span className={`notificationStatusPill notificationStatusPill--${tone}`} role='status' data-testid={testId}>{children}</span>;
}
