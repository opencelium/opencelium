import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { NotificationEditorState } from '../model/notification.types';
import type { OpenNotificationEditor } from './NotificationEditorContext';

type Setter<T> = Dispatch<SetStateAction<T | null>>;

type Args = {
	setNotificationEditor: Setter<NotificationEditorState>;
	closeOtherEditors: () => void;
};

export const useNotificationEditorOpener = ({ setNotificationEditor, closeOtherEditors }: Args): OpenNotificationEditor =>
	useCallback((nodeId, target = { kind: 'default' }) => {
		closeOtherEditors();
		setNotificationEditor({ nodeId, target });
	}, [setNotificationEditor, closeOtherEditors]);
