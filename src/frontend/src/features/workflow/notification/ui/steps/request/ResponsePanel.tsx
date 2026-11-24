import { message } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { notifyError } from '@shared/ui/feedback/notifyError';
import { copyToClipboard } from '@shared/utils/copyToClipboard';
import type { NotificationTool } from '../../../tools/notificationTool.types';
import { wrapReference } from '../../../model/notificationBody';
import { HighlightedJson } from './HighlightedJson';

type Props = { tool: NotificationTool; nodeColor?: string };

export function ResponsePanel({ tool, nodeColor }: Props) {
	const { t } = useI18n('workflow');
	const { response } = tool;
	const rows = [
		...response.params.map((param) => ({ path: param.path, label: t(param.labelKey), example: param.example })),
		{ path: '(request).body', label: t('notification.response.params.requestBody'), example: t('notification.response.sentJson') },
	];
	const copy = async (token: string) => {
		if (await copyToClipboard(token)) message.success(t('notification.response.copied'));
		else notifyError(t('notification.response.copyFailed'));
	};

	return (
		<div className='notificationFieldGrid'>
			<div className='notificationFieldRow'>
				<div className='notificationField'>
					<span className='notificationFieldLabel'>{t('notification.response.expectedStatus')}</span>
					<div className='notificationUrlBar' data-testid='notification-response-status'><span className='notificationMethod'>{response.status}</span></div>
				</div>
				<div className='notificationField'>
					<span className='notificationFieldLabel'>Content-Type</span>
					<div className='notificationUrlBar'>{response.contentType ?? '—'}</div>
				</div>
			</div>
			<div className='notificationField'>
				<span className='notificationFieldLabel'>{t('notification.response.sampleBody')}</span>
				{response.sampleBody
					? <HighlightedJson text={response.sampleBody} testId='notification-response-sample' />
					: <span className='notificationMuted'>{t('notification.response.emptyBody')}</span>}
			</div>
			<div className='notificationField'>
				<span className='notificationFieldLabel'>{t('notification.response.parameters')}</span>
				<span className='notificationFieldHelp'>{t('notification.response.parametersHint')}</span>
				<table className='notificationTable' data-testid='notification-response-params'>
					<thead>
						<tr>
							<th>{t('notification.response.parameter')}</th>
							<th>{t('notification.response.reference')}</th>
							<th>{t('notification.response.example')}</th>
							<th aria-label={t('notification.response.copy')} />
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => {
							const reference = nodeColor ? `${nodeColor}.${row.path}` : row.path;
							return (
								<tr key={row.path}>
									<td>{row.label}</td>
									<td><code>{reference}</code></td>
									<td>{row.example}</td>
									<td>
										<Button disabled={!nodeColor} onClick={() => void copy(wrapReference(reference))}
											testId={`notification-response-copy-${row.path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}`}>
											{t('notification.response.copy')}
										</Button>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
