import { Segmented } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { countReferences, parseBody } from '../../../model/notificationBody';
import type { NotificationEditMode } from '../../../model/notification.types';
import type { NotificationTool } from '../../../tools/notificationTool.types';
import { useNotificationToolName } from '../../useNotificationToolName';
import { StatusPill } from '../../shared/StatusPill';
import { useBrokenReferences } from './useBrokenReferences';

type Props = {
	mode: NotificationEditMode;
	tool: NotificationTool;
	bodyText: string;
	onModeChange: (mode: NotificationEditMode) => void;
};

export function MessageToolbar({ mode, tool, bodyText, onModeChange }: Props) {
	const { t } = useI18n('workflow');
	const toolName = useNotificationToolName();
	const parsed = parseBody(bodyText);
	const brokenCount = useBrokenReferences(bodyText).length;
	const editorLabel = <span data-testid='notification-message-mode-editor'>{t('notification.message.modeEditor')}</span>;
	return (
		<div className='notificationMessageBar'>
			<Segmented<NotificationEditMode> value={mode} onChange={onModeChange} data-testid='notification-message-mode'
				aria-label={t('notification.message.modeLabel')}
				options={[
					{ value: 'editor', disabled: tool.isJsonOnly, label: tool.isJsonOnly
						? <Tooltip content={t('notification.message.jsonOnlyHint')}>{editorLabel}</Tooltip> : editorLabel },
					{ value: 'json', label: <span data-testid='notification-message-mode-json'>{t('notification.message.modeJson')}</span> },
				]} />
			<span className='notificationMuted'>
				{mode === 'editor' ? t('notification.message.editorHint', { tool: toolName(tool) }) : t('notification.message.jsonHint')}
			</span>
			<span className='notificationSpacer' />
			{parsed.ok && brokenCount > 0 && (
				<StatusPill tone='warning' testId='notification-json-status-broken-references'>
					{t('notification.message.brokenReferences', { count: brokenCount })}
				</StatusPill>
			)}
			{parsed.ok && brokenCount === 0 && (
				<StatusPill tone='success' testId='notification-json-status-valid'>
					{t('notification.message.validJson', { count: countReferences(bodyText) })}
				</StatusPill>
			)}
			{!parsed.ok && (
				<StatusPill tone='error' testId='notification-json-status-invalid'>
					{t('notification.message.invalidJson', { error: parsed.error })}
				</StatusPill>
			)}
		</div>
	);
}
