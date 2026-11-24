import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Input } from '@shared/ui/primitives/Input';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { NOTIFICATION_CONTENT_TYPE } from '../../../model/notificationMethodConfig';
import type { NotificationDialogState } from '../../dialog/useNotificationDialog';
import { ReferenceTextField } from '../../references/ReferenceTextField';

export function RequestHeadersTable({ state }: { state: NotificationDialogState }) {
	const { t } = useI18n('workflow');
	return (
		<>
			<table className='notificationTable'>
				<thead>
					<tr>
						<th>{t('notification.request.headerName')}</th>
						<th>{t('notification.request.headerValue')}</th>
						<th aria-label={t('notification.request.headerActions')} />
					</tr>
				</thead>
				<tbody>
					<tr data-testid='notification-header-content-type'>
						<td><code>Content-Type</code></td>
						<td><code>{NOTIFICATION_CONTENT_TYPE}</code></td>
						<td><span className='notificationTag'>{t('notification.request.fixed')}</span></td>
					</tr>
					{state.config.extraHeaders.map((header, index) => (
						<tr key={header.id}>
							<td>
								<Input value={header.name} placeholder='Authorization' testId={`notification-header-name-${index}`}
									onChange={(event) => state.updateHeader(header.id, { name: event.target.value })} />
							</td>
							<td>
								<ReferenceTextField id={`notification-header-value-${header.id}`} value={header.value}
									ariaLabel={t('notification.request.headerValue')} testId={`notification-header-value-${index}`}
									onChange={(value) => state.updateHeader(header.id, { value })} />
							</td>
							<td>
								<Tooltip content={t('notification.request.removeHeader')}>
									<DeleteIconButton testId={`notification-header-remove-${index}`} onClick={() => state.removeHeader(header.id)} />
								</Tooltip>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<div>
				<Button type='link' iconLeft='plus' onClick={state.addHeader} testId='notification-header-add'>
					{t('notification.request.addHeader')}
				</Button>
			</div>
		</>
	);
}
