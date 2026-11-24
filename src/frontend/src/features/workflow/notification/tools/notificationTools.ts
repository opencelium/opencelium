import type { NotificationToolId } from '../model/notification.types';
import type { NotificationTool } from './notificationTool.types';
import { genericTool } from './generic.tool';
import { slackTool } from './slack.tool';
import { teamsTool } from './teams.tool';

const TOOLS = {
	slack: slackTool,
	teams: teamsTool,
	generic: genericTool,
} satisfies Record<NotificationToolId, NotificationTool>;

/** Display order of the tool picker. */
export const NOTIFICATION_TOOLS: NotificationTool[] = Object.values(TOOLS);

export const getNotificationTool = (id: NotificationToolId): NotificationTool => TOOLS[id];

export const isNotificationToolId = (value: unknown): value is NotificationToolId =>
	typeof value === 'string' && value in TOOLS;
