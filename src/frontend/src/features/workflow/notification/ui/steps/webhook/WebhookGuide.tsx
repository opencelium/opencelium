import { Trans } from 'react-i18next';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Hint } from '@shared/ui/primitives/Hint';
import type { NotificationTool } from '../../../tools/notificationTool.types';
import { useNotificationToolName } from '../../useNotificationToolName';
import { useDismissedGuideHints } from './dismissedGuideHints.store';

const RICH = { b: <b />, code: <code /> };
const range = (count: number) => Array.from({ length: count }, (_, index) => index + 1);

export function WebhookGuide({ tool }: { tool: NotificationTool }) {
	const { t } = useI18n('workflow');
	const toolName = useNotificationToolName();
	const base = `notification.tools.${tool.id}.guide`;
	const dismissed = useDismissedGuideHints((state) => state.dismissed);
	const dismiss = useDismissedGuideHints((state) => state.dismiss);
	return (
		<div className='notificationHelpCard' data-testid={`notification-guide-${tool.id}`}>
			<div className='notificationEyebrow'>{t('notification.webhook.guideEyebrow', { tool: toolName(tool) })}</div>
			<h3>{t(`${base}.title`)}</h3>
			<ol>
				{range(tool.guide.stepCount).map((step) => (
					<li key={step}><Trans ns='workflow' i18nKey={`${base}.steps.${step}`} components={RICH} /></li>
				))}
			</ol>
			<dl className='notificationFactList'>
				{tool.guide.facts.map((fact) => (
					<div key={fact}>
						<dt>{t(`notification.guideFacts.${fact}`)}</dt>
						<dd><Trans ns='workflow' i18nKey={`${base}.facts.${fact}`} components={RICH} /></dd>
					</div>
				))}
			</dl>
			{range(tool.guide.noteCount).filter((note) => !dismissed.includes(`${tool.id}.${note}`)).map((note) => (
				<Hint key={note} closable onClose={() => dismiss(`${tool.id}.${note}`)}>
					<Trans ns='workflow' i18nKey={`${base}.notes.${note}`} components={RICH} />
				</Hint>
			))}
			{tool.guide.docsUrl && (
				<a href={tool.guide.docsUrl} target='_blank' rel='noopener noreferrer' data-testid={`notification-guide-docs-${tool.id}`}>
					{t('notification.webhook.docsLink')}
				</a>
			)}
		</div>
	);
}
