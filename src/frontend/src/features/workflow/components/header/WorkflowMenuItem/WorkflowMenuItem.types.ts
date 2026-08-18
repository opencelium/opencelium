import type { ReactNode } from 'react';

export type WorkflowMenuItemProps = {
	label: ReactNode;
	onClick: () => void;
	className?: string;
	loading?: boolean;
	disabled?: boolean;
	tooltip?: ReactNode;
	badge?: ReactNode;
	testId?: string;
};
