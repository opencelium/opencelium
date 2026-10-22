import type { ReactNode } from 'react';
import { Tooltip } from '@shared/ui/primitives/Tooltip';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

type Props = {
	tone: BadgeTone;
	children: ReactNode;
	hint?: string;
	testId?: string;
};

export function PlaygroundBadge({ tone, children, hint, testId }: Props) {
	const badge = <span className={`rpBadge rpBadge--${tone}`} data-testid={testId}>{children}</span>;
	return hint ? <Tooltip content={hint}>{badge}</Tooltip> : badge;
}
