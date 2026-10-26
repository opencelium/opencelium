import { useState } from 'react';
import { message } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Dialog } from '@shared/ui/primitives/Dialog';
import { Splitter } from '@shared/ui/primitives/Splitter';
import type { WorkflowMethodConfig } from '../../types/request-config.types';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import { ensureMethodConfig } from '../../utils/requestConfig';
import type { PlaygroundSession } from '../hooks/usePlaygroundSession';
import { usePlaygroundSend } from '../hooks/usePlaygroundSend';
import { usePlaygroundValues } from '../hooks/usePlaygroundValues';
import { findMissingInputKeys } from '../model/buildPlaygroundRequest';
import type { PlaygroundResponse, PlaygroundSettings } from '../model/playground.types';
import { defaultSettings, withSampleResponse } from '../model/playgroundSettings';
import { previewRequest } from '../model/previewRequest';
import { applyRequestEdits, type RequestEdits } from '../model/requestEdits';
import { buildCurl } from '../model/resolveRequest';
import { PlaygroundCurl } from './PlaygroundCurl';
import { PlaygroundFooter } from './PlaygroundFooter';
import { PlaygroundTitle } from './PlaygroundTitle';
import { PlaygroundUrlBar } from './PlaygroundUrlBar';
import { RequestTabs, type RequestTab } from './request/RequestTabs';
import type { FocusRequest } from './request/TestValuesTab';
import { ResponsePanel } from './response/ResponsePanel';
import './requestPlayground.css';
import './requestPlaygroundTables.css';

// Fits method, a usable URL, cURL and the longest Send label (de) on one line.
const REQUEST_PANE_MIN_WIDTH = 640;

type Props = {
	session: PlaygroundSession;
	// The step as it is now — Apply and Save as sample write onto it, not onto the snapshot.
	liveNode: WorkflowNodeModel;
	connectionId: number | null;
	isReadOnly: boolean;
	onApplyConfig: (nodeId: string, config: WorkflowMethodConfig) => void;
	onClose: () => void;
};

export function RequestPlaygroundContent({ session, liveNode, connectionId, isReadOnly, onApplyConfig, onClose }: Props) {
	const { t } = useI18n('workflow');
	const [tab, setTab] = useState<RequestTab>('values');
	const [focus, setFocus] = useState<FocusRequest | null>(null);
	const [isCurlVisible, setIsCurlVisible] = useState(false);
	const [settings, setSettings] = useState<PlaygroundSettings>(() => defaultSettings(session.connector));
	const [appliedEdits, setAppliedEdits] = useState<RequestEdits | null>(null);
	const values = usePlaygroundValues({ inputs: session.inputs, connection: session.connection,
		currentMethod: session.currentMethod, storageKey: session.storageKey });
	const stepName = liveNode.data.subtitle || session.draft.name;

	const selectInput = (key: string) => {
		setTab('values');
		setFocus((current) => ({ key, nonce: (current?.nonce ?? 0) + 1 }));
	};
	const saveSample = (result: Extract<PlaygroundResponse, { kind: 'success' }>) => {
		onApplyConfig(liveNode.id, withSampleResponse(ensureMethodConfig(liveNode.data.methodConfig), liveNode.id, result));
		message.success(t('requestPlayground.response.sampleSaved'));
	};
	const apply = () => {
		onApplyConfig(liveNode.id, applyRequestEdits(ensureMethodConfig(liveNode.data.methodConfig), session.edits));
		setAppliedEdits(session.edits);
		message.success(t('requestPlayground.footer.applied', { name: stepName }));
	};
	const send = usePlaygroundSend({ session, values, settings, connectionId,
		onInvalidInputs: (keys) => selectInput(keys[0]),
		onSaveSample: (result) => { if (!isReadOnly) saveSample(result); } });

	const missingKeys = findMissingInputKeys(session.inputs, values.values, values.prefillSource);
	const preview = previewRequest({ draft: session.draft, inputs: session.inputs, values: values.values,
		connector: session.connector, requestData: values.requestData });
	const upstreamMethods = Array.from(new Set(session.inputs.references
		.map(({ sourceMethod }) => sourceMethod && (sourceMethod.label || sourceMethod.name)).filter(Boolean)));
	const sendingText = values.prefillSource === 'upstream' && upstreamMethods.length
		? t('requestPlayground.response.sendingUpstream', { methods: upstreamMethods.join(' → ') })
		: session.connector
			? t('requestPlayground.response.sending', { connection: session.connector.title })
			: t('requestPlayground.response.sendingDirect');

	const requestPane = (
		<div className='rpRequest'>
			<PlaygroundUrlBar method={session.draft.request.method || 'GET'} url={session.draft.request.endpoint} previewUrl={preview.url}
				onUrlChange={(url) => session.setEdits((current) => ({ ...current, url, paramRows: undefined }))} prefillSource={values.prefillSource}
				isCurlVisible={isCurlVisible} isSending={send.isSending}
				onMethodChange={(method) => session.setEdits((current) => ({ ...current, method }))}
				onToggleCurl={() => setIsCurlVisible((isVisible) => !isVisible)} onSend={send.send} />
			{isCurlVisible && <PlaygroundCurl command={buildCurl(preview)} />}
			<RequestTabs session={session} values={values} settings={settings} missingKeys={missingKeys}
				tab={tab} focus={focus} onTabChange={setTab} onSelectInput={selectInput}
				onSettingsChange={(patch) => setSettings((current) => ({ ...current, ...patch }))} />
		</div>
	);

	return (
		<Dialog open onClose={onClose} width='90vw' top={18} maximizable testId='request-playground-dialog'
			title={<PlaygroundTitle session={session} />}
			footer={<PlaygroundFooter onApply={apply} onClose={onClose}
				canApply={!isReadOnly && session.hasEdits && appliedEdits !== session.edits} />}>
			<div className='rpBody'>
				<div className='rpSplit'>
					<Splitter panels={[
						{ key: 'request', defaultSize: '58%', min: REQUEST_PANE_MIN_WIDTH, content: requestPane },
						{ key: 'response', min: 320, content: (
							<ResponsePanel result={send.result} isSending={send.isSending} sendingText={sendingText}
								run={send.run} canSaveSample={!isReadOnly} onSaveSample={() => {
									if (send.result?.kind === 'success') saveSample(send.result);
								}} />
						) },
					]} />
				</div>
			</div>
		</Dialog>
	);
}
