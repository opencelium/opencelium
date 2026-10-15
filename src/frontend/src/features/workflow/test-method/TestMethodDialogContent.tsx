import { useCallback } from 'react';
import { MethodDetailViewStateProvider } from '@features/logs';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { notifyError } from '@shared/ui/feedback/notifyError';
import { Button } from '@shared/ui/primitives/Button';
import { Dialog } from '@shared/ui/primitives/Dialog';
import { Splitter } from '@shared/ui/primitives/Splitter';
import { buildTestMethodRequest, findInvalidJsonInputKeys, findMissingInputKeys } from './buildTestMethodRequest';
import { TestMethodInputs } from './TestMethodInputs';
import { TestMethodResult } from './TestMethodResult';
import type { useTestMethodContext } from './useTestMethodContext';
import { useTestInputSelection } from './useTestInputSelection';
import { useTestMethodInputs } from './useTestMethodInputs';
import { useTestMethodSend } from './useTestMethodSend';
import './testMethod.css';

type Props = {
	context: NonNullable<ReturnType<typeof useTestMethodContext>>;
	title: string;
	connectionId: number | null;
	onClose: () => void;
};

export function TestMethodDialogContent({ context, title, connectionId, onClose }: Props) {
	const { t } = useI18n('workflow');
	const { draft, connection, currentMethod, inputs, storageKey } = context;
	const { values, resolvingKeys, setText, toggleKind, persist } =
		useTestMethodInputs({ inputs, connection, currentMethod, storageKey });
	const buildRequest = useCallback(() => buildTestMethodRequest({
		connectionId, draft, fieldBindings: connection.fieldBindings, inputs, values,
	}), [connection.fieldBindings, connectionId, draft, inputs, values]);
	const { send, result, isSending } = useTestMethodSend({
		verb: draft.request.method, buildRequest, onBeforeSend: persist,
	});

	const selection = useTestInputSelection(inputs);
	const missingKeys = findMissingInputKeys(inputs, values);
	const invalidJsonKeys = findInvalidJsonInputKeys(inputs, values);
	// Invalid JSON would silently go out as text, so it is fixed first: the pane jumps to the culprit.
	const sendIfValid = () => {
		if (!invalidJsonKeys.length) return void send();
		selection.onSelect(invalidJsonKeys[0]);
		notifyError(t('testMethod.inputs.invalidJsonSend', { count: invalidJsonKeys.length }));
	};

	// Nothing to fill in: the request is sent exactly as configured, so only the result pane shows.
	const hasInputs = inputs.references.length > 0 || inputs.webhooks.length > 0;
	const resultPane = <TestMethodResult draft={draft} connection={connection}
		currentMethod={currentMethod} result={result} isSending={isSending} {...selection}
		missingKeys={missingKeys} />;

	return (
		<Dialog open onClose={onClose} title={t('testMethod.title', { name: title })}
			width='90vw' top={18} maximizable testId='workflow-test-method-dialog'
			footer={<>
				<Button onClick={onClose} testId='workflow-test-method-close'>{t('actions.close')}</Button>
				<Button type='primary' iconLeft='play' loading={isSending} onClick={sendIfValid}
					testId='workflow-test-method-send'>
					{t('testMethod.send')}
				</Button>
			</>}>
			<MethodDetailViewStateProvider><div className='testMethodBody'>
				{hasInputs ? <Splitter panels={[
					{ key: 'inputs', defaultSize: '42%', min: 280, content: (
						<TestMethodInputs inputs={inputs} values={values} resolvingKeys={resolvingKeys}
							missingKeys={missingKeys} selectedKey={selection.selectedKey}
							onTextChange={setText} onToggleKind={toggleKind} />
					) },
					{ key: 'result', min: 320, content: resultPane },
				]} /> : resultPane}
			</div></MethodDetailViewStateProvider>
		</Dialog>
	);
}
