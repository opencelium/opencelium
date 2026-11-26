import type { PropsWithChildren } from 'react';
import type { useTransformationState } from './useTransformationState';
import { NotificationTransformationContext } from './notificationTransformationContextValue';

type Props = PropsWithChildren<{ state: ReturnType<typeof useTransformationState>; isReadOnly: boolean }>;

export function NotificationTransformationProvider({ state, isReadOnly, children }: Props) {
	return (
		<NotificationTransformationContext.Provider value={{ ...state.context, isReadOnly }}>
			{children}
		</NotificationTransformationContext.Provider>
	);
}
