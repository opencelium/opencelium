import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Checkbox } from '@shared/ui/primitives/Checkbox';
import { Select } from '@shared/ui/primitives/Select';
import { getActiveDraft } from '../../../model/notificationConfig';
import { isBodyOverridden } from '../../../model/notificationBody';
import type { NotificationErrorPolicy } from '../../../model/notification.types';
import type { NotificationDialogState } from '../../dialog/useNotificationDialog';
import { useNotificationReferences } from '../../references/notificationReferenceContextValue';
import { renderPreviewMarkup } from '../message/previewMarkup';
import { RequestHeadersTable } from './RequestHeadersTable';
import { HighlightedJson } from './HighlightedJson';
import { useSectionFocus } from './useSectionFocus';

const POLICIES: NotificationErrorPolicy[] = ['stop', 'continue', 'retry'];

export function RequestPanel({ state }: { state: NotificationDialogState }) {
	const { t } = useI18n('workflow');
	const { describe } = useNotificationReferences();
	const sectionRef = useSectionFocus(state.sectionFocus, state.clearSectionFocus);
	const url = getActiveDraft(state.config)?.webhookUrl ?? '';
	return (
		<div className='notificationFieldGrid'>
			<section ref={sectionRef('url')} className='notificationField' data-testid='notification-request-url'>
				<span className='notificationFieldLabel'>{t('notification.request.url')}</span>
				<div className='notificationUrlBar'>
					<span className='notificationMethod'>POST</span>
					<span className='notificationUrlValue'>
						{url ? renderPreviewMarkup(url, 'markdown', describe) : <span className='notificationMuted'>{t('notification.request.noUrl')}</span>}
					</span>
					<Button onClick={() => state.goTo(2)} testId='notification-request-edit-url'>{t('actions.edit')}</Button>
				</div>
			</section>
			<section ref={sectionRef('headers')} className='notificationField' data-testid='notification-request-headers'>
				<span className='notificationFieldLabel'>{t('notification.request.headers')}</span>
				<RequestHeadersTable state={state} />
			</section>
			<section ref={sectionRef('body')} className='notificationField' data-testid='notification-request-body'>
				<span className='notificationFieldLabel'>
					{t('notification.request.body')}
					<span className='notificationTag'>
						{t(isBodyOverridden(state.config) ? 'notification.request.bodyOverridden' : 'notification.request.bodyGenerated')}
					</span>
				</span>
				<HighlightedJson text={state.bodyText} />
				<div><Button onClick={() => state.goTo(3)} testId='notification-request-edit-body'>{t('notification.request.editBody')}</Button></div>
			</section>
			<div className='notificationFieldRow'>
				<div className='notificationField'>
					<span className='notificationFieldLabel'>{t('notification.request.errorPolicy')}</span>
					<Select value={state.config.errorPolicy} sortOptions={false} testId='notification-request-error-policy'
						options={POLICIES.map((policy) => ({ value: policy, label: t(`notification.request.errorPolicies.${policy}`) }))}
						onChange={state.setErrorPolicy} />
				</div>
				<div className='notificationField'>
					<span className='notificationFieldLabel'>{t('notification.request.rateLimits')}</span>
					<Checkbox checked={state.config.retryOn429} label={t('notification.request.retryOn429')}
						testId='notification-request-retry-429' onChange={state.setRetryOn429} />
				</div>
			</div>
		</div>
	);
}
