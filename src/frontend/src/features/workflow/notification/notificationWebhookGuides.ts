import type { NotificationTool } from '../nodes/NotificationNode/notificationTools';

export const notificationWebhookGuides: Record<NotificationTool, { example: string; docs?: string }> = {
	slack: { example: 'https://hooks.slack.com/services/T…/B…/…', docs: 'https://api.slack.com/messaging/webhooks' },
	teams: { example: 'https://….logic.azure.com/workflows/…', docs: 'https://support.microsoft.com/office/8ae491c7-0394-4861-ba59-055e33f75498' },
	gchat: { example: 'https://chat.googleapis.com/v1/spaces/…/messages?key=…&token=…', docs: 'https://developers.google.com/workspace/chat/quickstart/webhooks' },
	discord: { example: 'https://discord.com/api/webhooks/{id}/{token}', docs: 'https://support.discord.com/hc/articles/228383668' },
	mattermost: { example: 'https://chat.example.com/hooks/{id}', docs: 'https://developers.mattermost.com/integrate/webhooks/incoming/' },
	rocket: { example: 'https://chat.example.com/hooks/{id}/{token}', docs: 'https://docs.rocket.chat/docs/integrations' },
	webex: { example: 'https://webexapis.com/v1/webhooks/incoming/…', docs: 'https://apphub.webex.com/applications/incoming-webhooks-cisco-systems-38054-23307-75252' },
	ntfy: { example: 'https://ntfy.sh', docs: 'https://docs.ntfy.sh/publish/#publish-as-json' },
	generic: { example: 'https://example.com/webhook' },
};
