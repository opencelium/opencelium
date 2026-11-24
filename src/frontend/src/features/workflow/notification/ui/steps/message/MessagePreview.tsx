import { useI18n } from '@shared/i18n/hooks/useI18n';
import { parseBody } from '../../../model/notificationBody';
import type { NotificationTool } from '../../../tools/notificationTool.types';
import { useNotificationToolName } from '../../useNotificationToolName';
import { useNotificationReferences } from '../../references/notificationReferenceContextValue';
import { readableTextColor } from '../../../../utils/methodColor';
import { renderPreviewMarkup } from './previewMarkup';
import { PreviewCard } from './PreviewCard';

type Props = { tool: NotificationTool; bodyText: string };

export function MessagePreview({ tool, bodyText }: Props) {
	const { t } = useI18n('workflow');
	const toolName = useNotificationToolName()(tool);
	const { describe } = useNotificationReferences();
	const parsed = parseBody(bodyText);
	const render = (value: string) => renderPreviewMarkup(value, tool.markup, describe);
	const preview = parsed.ok ? tool.toPreview(parsed.value) : null;

	const body = (() => {
		if (!preview) return <div className='notificationPreviewEmpty' data-testid='notification-preview-disabled'>{t('notification.preview.invalid')}</div>;
		switch (preview.kind) {
			case 'raw':
				return <pre className='notificationCode'>{render(preview.json)}</pre>;
			case 'chat': {
				const hasContent = preview.lead || preview.card;
				return (
					<div className='notificationChat'>
						<span className='notificationChatAvatar' style={{ background: tool.brandColor, color: readableTextColor(tool.brandColor) }}>OC</span>
						<div className='notificationChatBody'>
							<div className='notificationChatAuthor'>OpenCelium</div>
							{preview.lead && <div className='notificationPreText'>{render(preview.lead)}</div>}
							{preview.card && <PreviewCard card={preview.card} render={render} />}
							{!hasContent && <div className='notificationPreviewEmpty'>{t('notification.preview.empty')}</div>}
						</div>
					</div>
				);
			}
			default: {
				const _exhaustive: never = preview;
				return _exhaustive;
			}
		}
	})();

	return (
		<div data-testid='notification-preview'>
			<div className='notificationEyebrow'>{t('notification.preview.eyebrow', { tool: toolName })}</div>
			{body}
			<p className='notificationFieldHelp'>{t('notification.preview.disclaimer', { tool: toolName })}</p>
		</div>
	);
}
