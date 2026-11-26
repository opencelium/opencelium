import { createContext, useContext } from 'react';
import type { createLegacyStore } from '../../../store';
import type { MethodWithId } from '../../../types/connection';
import type { NotificationMessageValues, NotificationToolId } from '../../model/notification.types';
import type { TransformTarget } from '../../model/notificationTransformTargets';

export type NotificationTransformationContextValue = {
	/** The per-dialog legacy store the reused Enhancement editor reads its connection from. */
	store: ReturnType<typeof createLegacyStore>;
	method: MethodWithId | null;
	toolId: NotificationToolId | null;
	message: NotificationMessageValues;
	isReadOnly: boolean;
	getEnhanceId: (target: TransformTarget) => string | undefined;
	/** Turns the target into a transformation; returns the value the field keeps (its references only). */
	add: (target: TransformTarget, value: string) => string | null;
	remove: (target: TransformTarget) => void;
	/** Keeps the script's inputs in step with the references of a transformed field. */
	syncInputs: (target: TransformTarget, value: string) => void;
	/** Only one script editor is open at a time across the dialog. */
	openEditorId: string | null;
	setOpenEditorId: (enhanceId: string | null) => void;
};

export const NotificationTransformationContext = createContext<NotificationTransformationContextValue | null>(null);

export const useNotificationTransformations = () => {
	const value = useContext(NotificationTransformationContext);
	if (!value) throw new Error('useNotificationTransformations must be used inside NotificationTransformationProvider');
	return value;
};
