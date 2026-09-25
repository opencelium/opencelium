import type { ReactNode } from 'react';

export type TestRunProviderProps = {
	connectionId?: string;
	connectionTitle?: string;
	buildTestPayload: () => unknown | null;
	onResolveStartError?: (error: unknown) => string | null;
	children: ReactNode;
};
