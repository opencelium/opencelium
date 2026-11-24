import type { NotificationToolId } from '../model/notification.types';
import type { NotificationTool } from './notificationTool.types';
import { discordTool } from './discord.tool';
import { genericTool } from './generic.tool';
import { googleChatTool } from './googleChat.tool';
import { mattermostTool } from './mattermost.tool';
import { ntfyTool } from './ntfy.tool';
import { rocketChatTool } from './rocketChat.tool';
import { slackTool } from './slack.tool';
import { teamsTool } from './teams.tool';
import { webexTool } from './webex.tool';

const TOOLS = {
	slack: slackTool,
	teams: teamsTool,
	'google-chat': googleChatTool,
	discord: discordTool,
	mattermost: mattermostTool,
	'rocket-chat': rocketChatTool,
	webex: webexTool,
	ntfy: ntfyTool,
	generic: genericTool,
} satisfies Record<NotificationToolId, NotificationTool>;

/** Display order of the tool picker. */
export const NOTIFICATION_TOOLS: NotificationTool[] = Object.values(TOOLS);

export const getNotificationTool = (id: NotificationToolId): NotificationTool => TOOLS[id];

export const isNotificationToolId = (value: unknown): value is NotificationToolId =>
	typeof value === 'string' && value in TOOLS;
