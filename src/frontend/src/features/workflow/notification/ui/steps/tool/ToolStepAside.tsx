import { Trans } from 'react-i18next';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';

const FACTS = ['request', 'references', 'response'] as const;

export function ToolStepAside() {
	const { t } = useI18n('workflow');
	return (
		<div className='notificationHelpCard'>
			<div className='notificationEyebrow'>{t('notification.howItWorks.eyebrow')}</div>
			<h3>{t('notification.howItWorks.title')}</h3>
			<p><Trans ns='workflow' i18nKey='notification.howItWorks.text' components={{ code: <code /> }} /></p>
			<dl className='notificationFactList'>
				{FACTS.map((fact) => (
					<div key={fact}>
						<dt>{t(`notification.howItWorks.facts.${fact}.label`)}</dt>
						<dd><Trans ns='workflow' i18nKey={`notification.howItWorks.facts.${fact}.value`} components={{ code: <code /> }} /></dd>
					</div>
				))}
			</dl>
			<Alert type='warning' showIcon message={t('notification.howItWorks.secretWarning')} />
		</div>
	);
}
