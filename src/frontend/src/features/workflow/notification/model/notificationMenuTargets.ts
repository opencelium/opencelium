import type { NotificationMenuActionId } from '../../components/context-menu/contextMenuData';
import type { NotificationDialogTarget } from './notification.types';

export const NOTIFICATION_MENU_TARGETS: Record<NotificationMenuActionId, NotificationDialogTarget> = {
	'notification-open': { kind: 'default' },
	'notification-tool': { kind: 'step', step: 1 },
	'notification-webhook': { kind: 'step', step: 2 },
	'notification-message': { kind: 'step', step: 3 },
	'notification-request-url': { kind: 'request', section: 'url' },
	'notification-request-headers': { kind: 'request', section: 'headers' },
	'notification-request-body': { kind: 'request', section: 'body' },
	'notification-response': { kind: 'response' },
	'notification-rename': { kind: 'rename' },
};
