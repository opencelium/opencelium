import { useI18n } from '@shared/i18n/hooks/useI18n';
import { PAYLOAD_REFERENCE_RE } from '../api/connectionPayload.references';
import { notificationPreviewStrategies } from './notificationPreviewModel';
import { notificationTools, type NotificationTool } from '../nodes/NotificationNode/notificationTools';

function PreviewText({ value }: { value: string }) {
	const tokens = [...value.matchAll(PAYLOAD_REFERENCE_RE)];
	let offset = 0;
	const parts = tokens.map((token) => {
		const prefix = value.slice(offset, token.index);
		offset = token.index + token[0].length;
		return <span key={token.index}>{prefix}<code className="notificationPreviewReference">{token[0]}</code></span>;
	});
	return <>{parts}{value.slice(offset)}</>;
}

export function NotificationPreview({ tool, json }: { tool: NotificationTool; json: unknown }) {
	const { t } = useI18n('workflow');
	const definition = notificationTools[tool];
	const model = notificationPreviewStrategies[tool](json);
	const { card, push } = model;
	const hasCard = card && (card.title || card.subtitle || card.text || card.button || card.facts?.length);
	const toolName = definition.name ?? t('notification.generic');
	return <section className="notificationPreview" data-testid="notification-preview">
		<div className="notificationPreviewBadge" style={{ backgroundColor: definition.color }}>{definition.badge}</div>
		<div className="notificationPreviewContent">
			<strong>{model.author || toolName}</strong>
			{push?.topic && <p><PreviewText value={push.topic} /></p>}
			{tool === 'generic' ? <pre>{JSON.stringify(json, null, 2)}</pre> : <>
				{!push && model.text && <p><PreviewText value={model.text} /></p>}
				{hasCard && <div className="notificationPreviewCard" style={{ borderInlineStartColor: card.color || definition.color }}>
					{card.title && <strong><PreviewText value={card.title} /></strong>}
					{card.subtitle && <p><PreviewText value={card.subtitle} /></p>}
					{card.text && <p><PreviewText value={card.text} /></p>}
					{!!card.facts?.length && <dl>{card.facts.map(({ label, value }, index) => <div key={index}>
						<dt><PreviewText value={label} /></dt><dd><PreviewText value={value} /></dd>
					</div>)}</dl>}
					{card.button && <span className="notificationPreviewButton"><PreviewText value={card.button} /></span>}
				</div>}
				{push && model.text && <p><PreviewText value={model.text} /></p>}
				{push?.priority && <p>{t('notification.fields.priority')} {push.priority}</p>}
				{!!push?.tags.length && <p>{t('notification.fields.tags')} {push.tags.join(', ')}</p>}
				{!hasCard && !model.text && !push && <p>{t('notification.emptyPreview')}</p>}
			</>}
			<p className="notificationPreviewNote">{t('notification.previewNote')}</p>
		</div>
	</section>;
}
