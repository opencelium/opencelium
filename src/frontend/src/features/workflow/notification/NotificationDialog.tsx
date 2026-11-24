import { useRef, useState } from 'react';
import { message } from 'antd';
import { Dialog } from '@shared/ui/primitives/Dialog';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { notifyError } from '@shared/ui/feedback/notifyError';
import { PAYLOAD_REFERENCE_RE } from '../api/connectionPayload.references';
import { getNotificationWebhookStatus } from './notificationWebhookStatus';
import { notificationReferenceColor, notificationTools, type NotificationTool, type NotificationToolDraft } from '../nodes/NotificationNode/notificationTools';
import { notificationMessage } from './notificationMessage';
import { NotificationReferenceField } from './NotificationReferenceField';
import { NotificationMessageFields } from './NotificationMessageFields';
import type { NotificationWorkflowNode } from '../types/workflow.types';
import { NotificationWebhookGuide } from './NotificationWebhookGuide';
import { notificationWebhookGuides } from './notificationWebhookGuides';
import { NotificationPreview } from './NotificationPreview';
import { NotificationRequest, type RequestSection } from './NotificationRequest';
import './notificationDialog.css';

export type NotificationStep = 0 | 1 | 2 | 3;
export type NotificationDialogTarget = { id: string; step?: NotificationStep; rename?: boolean; section?: RequestSection };
type Props = {
	node: NotificationWorkflowNode;
	color?: string;
	target: NotificationDialogTarget;
	onClose: () => void;
	onLabelPreview: (label: string) => void;
	onSave: (data: NotificationWorkflowNode['data']) => void;
};

const tools = Object.keys(notificationTools) as NotificationTool[];
const emptyDraft: NotificationToolDraft = { webhookUrl: '', message: {}, extraHeaders: [] };
const stepKeys = ['tool', 'webhook', 'message', 'request'] as const;

export function NotificationDialog({ node, color = notificationReferenceColor, target, onClose, onLabelPreview, onSave }: Props) {
	const titleInput = useRef<HTMLInputElement>(null);
	const { t } = useI18n('workflow');
	const [config, setConfig] = useState(node.data.notificationConfig ?? { drafts: {} });
	const originalLabel = node.data.subtitle || node.data.title || t('notification.label');
	const [label, setLabel] = useState(originalLabel);
	const [step, setStep] = useState<NotificationStep>(config.tool ? target.step ?? 2 : 0);
	const [tab, setTab] = useState<'editor' | 'json' | 'preview'>('editor');
	const tool = config.tool;
	const draft = tool ? config.drafts[tool] ?? emptyDraft : emptyDraft;
	const update = (patch: Partial<NotificationToolDraft>) => {
		if (tool) setConfig((previous) => ({ ...previous, drafts: { ...previous.drafts, [tool]: { ...draft, ...patch } } }));
	};
	const url = draft.webhookUrl.trim();
	const urlState = getNotificationWebhookStatus(url, tool);
	const body = draft.jsonOverride ?? JSON.stringify(tool ? notificationMessage[tool].build(draft.message) : {}, null, 2);
	let jsonError = '';
	let parsedBody: unknown;
	try {
		parsedBody = JSON.parse(body);
	} catch (error) {
		jsonError = error instanceof Error ? error.message : String(error);
	}
	const overridden = draft.jsonOverride !== undefined;
	const referenceCount = [...body.matchAll(PAYLOAD_REFERENCE_RE)].length;
	const activeTab = tool === 'generic' && tab === 'editor' ? 'json' : tab;
	const done = [!!tool, !!url, !!tool && !jsonError && (overridden || Object.keys(draft.message).length > 0),
		!!tool && !!url && !jsonError];

	const save = () => {
		if (jsonError) {
			notifyError(jsonError);
			return;
		}
		onSave({ ...node.data, subtitle: label.trim() || t('notification.label'), notificationConfig: config, color: color });
		message.success(t('notification.saved'));
		onClose();
	};

	return <Dialog open onClose={onClose} top={18} width={900} testId="workflow-notification-dialog"
		afterOpenChange={(open) => {
			if (open && target.rename) {
				titleInput.current?.focus();
				titleInput.current?.select();
			}
		}}
		title={<label>{t('notification.label')} <input data-testid="notification-label" value={label}
			ref={titleInput} onChange={(event) => {
				setLabel(event.target.value);
				onLabelPreview(event.target.value);
			}} /></label>}
		footer={<div className="notificationActions">
			<button type="button" data-testid="notification-cancel" onClick={onClose}>{t('actions.cancel')}</button>
			<button type="button" data-testid="notification-back" disabled={!step}
				onClick={() => setStep((step - 1) as NotificationStep)}>{t('notification.back')}</button>
			<button type="button" data-testid="notification-next" disabled={!tool || step === 3}
				onClick={() => setStep((step + 1) as NotificationStep)}>{t('notification.next')}</button>
			<button type="button" data-testid="notification-save" disabled={!tool && label.trim() === originalLabel} onClick={save}>{t('actions.save')}</button>
		</div>}>
		<div className="notificationWizard">
			<nav aria-label={t('notification.steps')}>
				{stepKeys.map((key, index) => <button type="button" key={key} data-testid={`notification-step-${key}`}
					aria-current={step === index ? 'step' : undefined} disabled={index > 0 && !tool}
					onClick={() => setStep(index as NotificationStep)}>
					{done[index] ? '✓' : index + 1} {t(`notification.stepsLabel.${key}`)}
				</button>)}
			</nav>
			{step === 0 && <div className="notificationTools">
				{tools.map((id) => <button key={id} type="button" data-testid={`notification-tool-${id}`}
					aria-pressed={tool === id} onClick={() => setConfig((previous) => ({ ...previous, tool: id }))}>
					<span style={{ backgroundColor: notificationTools[id].color }}>{notificationTools[id].badge}</span>
					{notificationTools[id].name ?? t('notification.generic')}
				</button>)}
			</div>}
			{step === 1 && <div className="notificationWebhook">
				<div><p>{t('notification.webhookUrl')}</p>
					<NotificationReferenceField label={t('notification.webhookUrl')} testId="notification-webhook-url"
						placeholder={tool ? notificationWebhookGuides[tool].example : undefined}
						value={draft.webhookUrl} onChange={(webhookUrl) => update({ webhookUrl })} />
					<p role="status" className="notificationUrlStatus" data-state={urlState}>
						{t(`notification.urlState.${urlState}`)}
					</p>
				</div>
				{tool && <NotificationWebhookGuide tool={tool} />}
			</div>}
			{step === 2 && tool && <>
				<nav aria-label={t('notification.stepsLabel.message')}>
					{(['editor', 'json', 'preview'] as const).filter((mode) => mode !== 'editor' || tool !== 'generic')
						.map((mode) => <button type="button" key={mode} data-testid={`notification-message-${mode}`}
							aria-pressed={activeTab === mode} disabled={mode === 'preview' && !!jsonError}
							onClick={() => setTab(mode)}>{t(`notification.mode.${mode}`)}</button>)}
				</nav>
				<p role="status" className="notificationJsonStatus" data-invalid={!!jsonError}>
					{jsonError || t('notification.validJson') + ' · ' +
						t('notification.referenceCount').replace('{count}', String(referenceCount))}
				</p>
				{overridden && <p role="status">{t('notification.override')} <button type="button"
					data-testid="notification-reset-json" onClick={() => update({ jsonOverride: undefined })}>
					{t('notification.reset')}</button></p>}
				<div className={activeTab === 'preview' || tool === 'generic' ? undefined : 'notificationMessageLayout'}>
					{activeTab === 'editor' && <NotificationMessageFields tool={tool} value={draft.message}
						disabled={overridden} onChange={(value) => update({ message: value })} />}
					{activeTab === 'json' && <NotificationReferenceField label={t('notification.mode.json')} area json invalid={!!jsonError} testId="notification-json"
						value={body} onChange={(jsonOverride) => update({ jsonOverride })} />}
					{!jsonError && (tool !== 'generic' || activeTab === 'preview') &&
						<NotificationPreview tool={tool} json={parsedBody} />}
				</div>
			</>}
			{step === 3 && tool && <NotificationRequest section={target.section} tool={tool}
				color={color} draft={draft} body={body} update={update}
				onEditUrl={() => setStep(1)} onEditBody={() => setStep(2)} />}
		</div>
	</Dialog>;
}
