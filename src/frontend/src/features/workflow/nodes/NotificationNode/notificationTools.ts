export const notificationReferenceColor = '#f5a623';

export const notificationTools = {
	slack: { name: 'Slack', badge: 'Sl', color: '#5b2a64', webhook: /^https:\/\/hooks\.slack\.com\/services\// },
	teams: { name: 'Microsoft Teams', badge: 'Te', color: '#4b53bc', webhook: /^https:\/\/[^/]+\.(logic\.azure\.com|powerplatform\.com)\// },
	gchat: { name: 'Google Chat', badge: 'GC', color: '#1e8e3e', webhook: /^https:\/\/chat\.googleapis\.com\/v1\/spaces\// },
	discord: { name: 'Discord', badge: 'Dc', color: '#5865f2', webhook: /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\// },
	mattermost: { name: 'Mattermost', badge: 'Mm', color: '#1e325c', webhook: /^https?:\/\/[^/]+\/hooks\/[a-z0-9]+$/i },
	rocket: { name: 'Rocket.Chat', badge: 'RC', color: '#c8102e', webhook: /^https?:\/\/[^/]+\/hooks\/[^/]+\/[^/]+/ },
	webex: { name: 'Webex', badge: 'Wx', color: '#0b7a75', webhook: /^https:\/\/webexapis\.com\/v1\/webhooks\/incoming\// },
	ntfy: { name: 'ntfy', badge: 'nt', color: '#317f6f', webhook: /^https?:\/\/[^/]+\/?$/ },
	generic: { name: null, badge: '{ }', color: '#56606b', webhook: /^https?:\/\// },
} as const;

export type NotificationTool = keyof typeof notificationTools;

export type NotificationToolDraft = {
	webhookUrl: string;
	message: Record<string, string | boolean | [string, string][]>;
	jsonOverride?: string;
	extraHeaders: { name: string; value: string }[];
	onError?: 'stop' | 'continue';
	retry429?: boolean;
};

export type WorkflowNotificationConfig = {
	tool?: NotificationTool;
	drafts: Partial<Record<NotificationTool, NotificationToolDraft>>;
};
