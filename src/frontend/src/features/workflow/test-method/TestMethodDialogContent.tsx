import { useCallback } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Dialog } from '@shared/ui/primitives/Dialog';
import { Splitter } from '@shared/ui/primitives/Splitter';
import { buildTestMethodRequest, findMissingInputKeys } from './buildTestMethodRequest';
import { TestMethodInputs } from './TestMethodInputs';
import { TestMethodResult } from './TestMethodResult';
import type { useTestMethodContext } from './useTestMethodContext';
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
	const { values, resolvingKeys, setText, toggleKind, reset, persist } =
		useTestMethodInputs({ inputs, connection, currentMethod, storageKey });
	const buildRequest = useCallback(() => buildTestMethodRequest({
		connectionId, draft, fieldBindings: connection.fieldBindings, inputs, values,
	}), [connection.fieldBindings, connectionId, draft, inputs, values]);
	const { send, result, isSending } = useTestMethodSend({
		verb: draft.request.method, buildRequest, onBeforeSend: persist,
	});

	return (
		<Dialog open onClose={onClose} title={t('testMethod.title', { name: title })}
			width='90vw' top={18} maximizable testId='workflow-test-method-dialog'
			footer={<>
				<Button onClick={onClose} testId='workflow-test-method-close'>{t('actions.close')}</Button>
				<Button type='primary' iconLeft='play' loading={isSending} onClick={() => void send()}
					testId='workflow-test-method-send'>
					{t('testMethod.send')}
				</Button>
			</>}>
			<div className='testMethodBody'>
				<Splitter panels={[
					{ key: 'inputs', defaultSize: '42%', min: 280, content: (
						<TestMethodInputs inputs={inputs} values={values} resolvingKeys={resolvingKeys}
							missingKeys={findMissingInputKeys(inputs, values)}
							verb={draft.request.method} endpoint={draft.request.endpoint}
							onTextChange={setText} onToggleKind={toggleKind} onReset={reset} />
					) },
					{ key: 'result', min: 320, content: <TestMethodResult result={result} isSending={isSending} /> },
				]} />
			</div>
		</Dialog>
	);
}
