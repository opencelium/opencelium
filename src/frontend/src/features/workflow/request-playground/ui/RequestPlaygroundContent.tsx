import type { LoggedExecution } from '@features/logs';
import { useState } from 'react';
import { message } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Dialog } from '@shared/ui/primitives/Dialog';
import { Splitter } from '@shared/ui/primitives/Splitter';
import type { WorkflowMethodConfig } from '../../types/request-config.types';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import { ensureMethodConfig } from '../../utils/requestConfig';
import type { PlaygroundSession } from '../hooks/usePlaygroundSession';
import { usePlaygroundCurl } from '../hooks/usePlaygroundCurl';
import { usePlaygroundSend } from '../hooks/usePlaygroundSend';
import { usePlaygroundValues } from '../hooks/usePlaygroundValues';
import { findMissingInputKeys, listStaticInputKeys } from '../model/methodTestRefs';
import type { PlaygroundResult } from '../model/playground.types';
import { withSampleResponse } from '../model/sampleResponse';
import { buildReferencePreview } from '../model/bodyPreview';
import { buildChipInputs, previewRequest } from '../model/previewRequest';
import { applyRequestEdits, type RequestEdits } from '../model/requestEdits';
import { PlaygroundCurl } from './PlaygroundCurl';
import { PlaygroundFooter } from './PlaygroundFooter';
import { PlaygroundTitle } from './PlaygroundTitle';
import { PlaygroundUrlBar } from './PlaygroundUrlBar';
import { RequestTabs, type RequestTab } from './request/RequestTabs';
import type { FocusRequest } from './request/TestValuesTab';
import { buildValueRows } from './request/valueRows';
import { ResponsePanel } from './response/ResponsePanel';
import './requestPlayground.css';
import './requestPlaygroundTables.css';

// Fits method, a usable URL, cURL and the longest Send label (de) on one line.
const REQUEST_PANE_MIN_WIDTH = 640;

type Props = {
	session: PlaygroundSession;
	execution?: LoggedExecution;
	// The step as it is now — Apply and Save as sample write onto it, not onto the snapshot.
	liveNode: WorkflowNodeModel;
	isReadOnly: boolean;
	onApplyConfig: (nodeId: string, config: WorkflowMethodConfig) => void;
	onClose: () => void;
};

export function RequestPlaygroundContent({ session, execution, liveNode, isReadOnly, onApplyConfig, onClose }: Props) {
	const { t } = useI18n('workflow');
	const [tab, setTab] = useState<RequestTab>('values');
	const [focus, setFocus] = useState<FocusRequest | null>(null);
	const [isCurlVisible, setIsCurlVisible] = useState(false);
	const [appliedEdits, setAppliedEdits] = useState<RequestEdits | null>(null);
	const values = usePlaygroundValues({ inputs: session.inputs, connection: session.connection,
		currentMethod: session.currentMethod, storageKey: session.storageKey,
		execution, staticKeys: session.refs.refs ? listStaticInputKeys(session.refs.refs) : [] });
	const stepName = liveNode.data.subtitle || session.draft.name;

	const selectInput = (key: string) => {
		setTab('values');
		setFocus((current) => ({ key, nonce: (current?.nonce ?? 0) + 1 }));
	};
	const saveSample = (result: Extract<PlaygroundResult, { kind: 'sent' }>) => {
		onApplyConfig(liveNode.id, withSampleResponse(ensureMethodConfig(liveNode.data.methodConfig), liveNode.id, result));
		message.success(t('requestPlayground.response.sampleSaved'));
	};
	const apply = () => {
		onApplyConfig(liveNode.id, applyRequestEdits(ensureMethodConfig(liveNode.data.methodConfig), session.edits));
		setAppliedEdits(session.edits);
		message.success(t('requestPlayground.footer.applied', { name: stepName }));
	};
	const send = usePlaygroundSend({ session, values, onInvalidInputs: (keys) => selectInput(keys[0]) });
	const curl = usePlaygroundCurl({ session, values });
	const toggleCurl = () => {
		if (!isCurlVisible) curl.generateIfIdle();
		setIsCurlVisible(!isCurlVisible);
	};

	const rows = buildValueRows({ inputs: session.inputs, refs: session.refs.refs, draft: session.draft,
		connectors: session.allConnectors, methods: session.connection.fromConnector.method }, t);
	const missingKeys = findMissingInputKeys(rows.filter(({ kind }) => kind === 'input').map(({ key }) => key),
		values.values);
	const previewArgs = { inputs: session.inputs, values: values.values,
		connector: session.connector, requestData: values.requestData };
	const preview = previewRequest({ draft: session.draft, ...previewArgs });
	const previewParts = values.prefillSource === 'execution'
		? buildReferencePreview(session.draft.request.endpoint, buildChipInputs(previewArgs)) : undefined;
	const sendingText = session.connector
		? t('requestPlayground.response.sending', { connection: session.connector.title })
		: t('requestPlayground.response.sendingDirect');

	const requestPane = (
		<div className='rpRequest'>
			<PlaygroundUrlBar method={session.draft.request.method || 'GET'} url={session.draft.request.endpoint} previewUrl={preview.url} previewParts={previewParts}
				onUrlChange={(url) => session.setEdits((current) => ({ ...current, url, paramRows: undefined }))}
				isCurlVisible={isCurlVisible} isSending={send.isSending} canSend={send.canSend && (values.prefillSource !== 'execution' || !values.resolvingKeys.length)}
				onMethodChange={(method) => session.setEdits((current) => ({ ...current, method }))}
				onToggleCurl={toggleCurl} onSend={send.send} />
			{isCurlVisible && <PlaygroundCurl curl={curl} connectors={session.allConnectors} />}
			<RequestTabs session={session} values={values} rows={rows} missingKeys={missingKeys}
				tab={tab} focus={focus} onTabChange={setTab} onSelectInput={selectInput} />
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
								run={send.run} connectors={session.allConnectors} canSaveSample={!isReadOnly} onSaveSample={() => {
									if (send.result?.kind === 'sent') saveSample(send.result);
								}} />
						) },
					]} />
				</div>
			</div>
		</Dialog>
	);
}
