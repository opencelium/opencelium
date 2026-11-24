import { createContext, useContext } from 'react';
import type { Connection, MethodWithId } from '../../../types/connection';
import type { ReferenceDescription } from './referenceDescription';

export type NotificationReferenceContextValue = {
	connection: Connection;
	currentMethod: MethodWithId | null;
	describe: (reference: string) => ReferenceDescription;
	/** Only one inline picker is open at a time across the whole dialog. */
	activePickerId: string | null;
	setActivePickerId: (id: string | null) => void;
};

export const NotificationReferenceContext = createContext<NotificationReferenceContextValue | null>(null);

export const useNotificationReferences = () => {
	const value = useContext(NotificationReferenceContext);
	if (!value) throw new Error('useNotificationReferences must be used inside NotificationReferenceProvider');
	return value;
};
