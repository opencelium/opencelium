import { useI18n } from '@shared/i18n/hooks/useI18n';
import { notificationWebhookGuides } from './notificationWebhookGuides';
import type { NotificationTool } from '../nodes/NotificationNode/notificationTools';

export function NotificationWebhookGuide({ tool }: { tool: NotificationTool }) {
	const { t } = useI18n('workflow');
	const { example, docs } = notificationWebhookGuides[tool];
	return <aside className="notificationWebhookGuide">
		<h3>{t('notification.setup')}</h3>
		<ol>{(['first', 'second', 'third'] as const).map((step) =>
			<li key={step}>{t(`notification.guide.${tool}.${step}`)}</li>)}</ol>
		<dl><dt>{t('notification.urlFormat')}</dt><dd><code>{example}</code></dd></dl>
		<p>{t(`notification.guide.${tool}.note`)}</p>
		{docs && <a href={docs} target="_blank" rel="noopener noreferrer"
			data-testid="notification-webhook-guide-docs">{t('notification.documentation')}</a>}
	</aside>;
}
