import { useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { notifyError } from '@shared/ui/feedback/notifyError';
import { notificationResponses } from './notificationResponses';
import { NotificationReferenceField } from './NotificationReferenceField';
import type { NotificationTool, NotificationToolDraft } from '../nodes/NotificationNode/notificationTools';

export const requestSections = ['url', 'headers', 'body', 'policy', 'response', 'references'] as const;
export type RequestSection = typeof requestSections[number];


type Props = {
	section?: RequestSection;
	color: string;
	tool: NotificationTool;
	draft: NotificationToolDraft;
	body: string;
	onEditUrl: () => void;
	onEditBody: () => void;
	update: (changes: Partial<NotificationToolDraft>) => void;
};

export function NotificationRequest({ section, color, tool, draft, body, onEditUrl, onEditBody, update }: Props) {
	const { t } = useI18n('workflow');
	const [tab, setTab] = useState<'request' | 'response'>(section === 'response' || section === 'references' ? 'response' : 'request');
	const selected = useRef<HTMLElement | null>(null);
	useEffect(() => {
		selected.current?.scrollIntoView({ block: 'nearest' });
	}, [section, tab]);
	const response = notificationResponses[tool];
	const refs = ['(request).body', '(response).status', '(response).body',
		...(response.fields ?? []).map((field) => '(response).body.' + field)];
	const block = (name: RequestSection) => ({
		ref: section === name ? selected : undefined,
		'data-highlighted': section === name,
		'data-testid': 'notification-request-' + name,
	});
	const copy = async (reference: string) => {
		try {
			await navigator.clipboard.writeText(reference);
			message.success(t('notification.copied'));
		} catch {
			notifyError(t('notification.copyError'));
		}
	};
	return <div className="notificationRequest">
		<nav aria-label={t('notification.stepsLabel.request')}>
			{(['request', 'response'] as const).map((mode) => <button key={mode} type="button"
				data-testid={`notification-request-tab-${mode}`} aria-pressed={tab === mode}
				onClick={() => setTab(mode)}>{t(`notification.requestTab.${mode}`)}</button>)}
		</nav>
		{tab === 'request' && <><section {...block('url')}><h3>{t('notification.requestSections.url')}</h3>
			<p><code>POST {draft.webhookUrl.trim()}</code></p>
			<button type="button" data-testid="notification-request-edit-url" onClick={onEditUrl}>
				{t('notification.editUrl')}</button></section>
		<section {...block('headers')}><h3>{t('notification.requestSections.headers')}</h3>
			<p><code>Content-Type: application/json; charset=utf-8</code></p>
			{draft.extraHeaders.map((header, index) => <div key={index} className="notificationPair">
				{(['name', 'value'] as const).map((key) => <NotificationReferenceField key={key} label={t(`notification.${key}`)}
					testId={`notification-header-${key}`} value={header[key]} onChange={(next) => update({
						extraHeaders: draft.extraHeaders.map((row, i) => i === index ? { ...row, [key]: next } : row),
					})} />)}
				<button type="button" data-testid="notification-remove-header" onClick={() => update({
					extraHeaders: draft.extraHeaders.filter((_, i) => i !== index),
				})}>{t('notification.remove')}</button>
			</div>)}
			<button type="button" data-testid="notification-add-header" onClick={() => update({
				extraHeaders: [...draft.extraHeaders, { name: '', value: '' }],
			})}>{t('notification.addHeader')}</button>
		</section>
		<section {...block('body')}><h3>{t('notification.requestSections.body')}</h3><pre>{body}</pre>
			<button type="button" data-testid="notification-request-edit-body" onClick={onEditBody}>
				{t('notification.editMessage')}</button></section>
		<section {...block('policy')}><h3>{t('notification.requestSections.policy')}</h3>
			<label>{t('notification.onError')} <select data-testid="notification-error-policy" value={draft.onError ?? 'stop'}
				onChange={(event) => update({ onError: event.target.value === 'continue' ? 'continue' : 'stop' })}>
				<option value="stop">{t('notification.stop')}</option>
				<option value="continue">{t('notification.continue')}</option>
			</select></label>
			<label><input type="checkbox" data-testid="notification-retry-429" checked={draft.retry429 ?? true}
				onChange={(event) => update({ retry429: event.target.checked })} /> {t('notification.retry429')}</label>
		</section>
		</>}
		{tab === 'response' && <><section {...block('response')}><h3>{t('notification.requestSections.response')}</h3>
			<code>{response.status}</code>{response.body && <pre>{response.body}</pre>}</section>
		<section {...block('references')}><h3>{t('notification.requestSections.references')}</h3>
			{refs.map((path) => <div key={path} className="notificationPair">
				<code>{color}.{path}</code>
				<button type="button" data-testid="notification-copy-reference"
					aria-label={t('notification.copy') + ' ' + path}
					onClick={() => void copy('{%' + color + '.' + path + '%}')}>{t('notification.copy')}</button>
			</div>)}
		</section></>}
	</div>;
}
