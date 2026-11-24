import { createContext, useContext } from 'react';
import type { NotificationDialogTarget } from '../model/notification.types';

export type OpenNotificationEditor = (nodeId: string, target?: NotificationDialogTarget) => void;

/**
 * Lets the canvas node open its dialog (Enter, toolbar) without threading another
 * callback through node data — node data is diffed for undo and cached by the canvas.
 * Null while the graph is not editable.
 */
export const NotificationEditorContext = createContext<OpenNotificationEditor | null>(null);

export const useOpenNotificationEditor = () => useContext(NotificationEditorContext);
