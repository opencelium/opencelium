import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { NotificationToolId } from '../../../model/notification.types';
import { NOTIFICATION_TOOLS } from '../../../tools/notificationTools';
import { NotificationToolMark } from '../../NotificationToolMark';
import { useNotificationToolName } from '../../useNotificationToolName';

type Props = { selected: NotificationToolId | null; onSelect: (toolId: NotificationToolId) => void };

export function ToolStep({ selected, onSelect }: Props) {
	const { t } = useI18n('workflow');
	const toolName = useNotificationToolName();
	return (
		<section>
			<h2 className='notificationSectionTitle'>{t('notification.tool.title')}</h2>
			<p className='notificationLead'>{t('notification.tool.lead')}</p>
			<div className='notificationToolGrid' role='group' aria-label={t('notification.tool.title')}>
				{NOTIFICATION_TOOLS.map((tool) => (
					<button key={tool.id} type='button' aria-pressed={selected === tool.id}
						className={`notificationToolCard ${selected === tool.id ? 'notificationToolCard--selected' : ''}`}
						data-testid={`notification-tool-${tool.id}`} onClick={() => onSelect(tool.id)}>
						<NotificationToolMark tool={tool} className='notificationToolMark' />
						<span className='notificationToolCardName'>
							{toolName(tool)}
							<span className='notificationToolTag'>{t(`notification.tools.${tool.id}.tag`)}</span>
						</span>
						<small>{t(`notification.tools.${tool.id}.description`)}</small>
					</button>
				))}
			</div>
		</section>
	);
}
