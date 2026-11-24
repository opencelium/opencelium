import { createContext } from 'react';
import type { NotificationDialogTarget } from './NotificationDialog';

export const NotificationOpenContext = createContext<((target: NotificationDialogTarget) => void) | null>(null);
