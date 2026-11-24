import type { NotificationTool } from '../nodes/NotificationNode/notificationTools';

export const notificationResponses: Record<NotificationTool, { status: string; body?: string; fields?: string[] }> = {
	slack: { status: '200 OK', body: 'ok' },
	teams: { status: '202 Accepted' },
	gchat: { status: '200 OK', body: '{ "name": "spaces/AAAA9/messages/Xy1.Xy1", "thread": { "name": "spaces/AAAA9/threads/Xy1" } }',
		fields: ['name', 'thread.name', 'createTime'] },
	discord: { status: '200 / 204', body: '{ "id": "1309812345678901234", "channel_id": "1187000000000000000" }', fields: ['id', 'channel_id'] },
	mattermost: { status: '200 OK', body: 'ok' },
	rocket: { status: '200 OK', body: '{ "success": true }', fields: ['success'] },
	webex: { status: '204 No Content' },
	ntfy: { status: '200 OK', body: '{ "id": "hwQ2YpKdmg", "time": 1795166043 }', fields: ['id', 'time'] },
	generic: { status: '2xx' },
};
