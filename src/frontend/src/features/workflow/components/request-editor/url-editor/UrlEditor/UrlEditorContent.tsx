import { LinkOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { HttpMethodBadge } from '@shared/ui/http-method/HttpMethodBadge';
import { Select } from '@shared/ui/primitives/Select';
import { NewFeature } from '@shared/ui/feedback/NewFeature/NewFeature';
import { LegacyBodyReferenceGenerator } from '../../body-editor/LegacyBodyReferenceGenerator/LegacyBodyReferenceGenerator';
import { UrlEndpointField } from '../UrlEndpointField/UrlEndpointField';
import { UrlQueryParamsTable } from '../UrlQueryParamsTable/UrlQueryParamsTable';
import type { useUrlEditor } from './useUrlEditor';
import { HTTP_METHODS } from './urlEditor.data';
import '../urlMethodSelect.css';

type Props = { readOnly?: boolean; editor: ReturnType<typeof useUrlEditor> };

const urlMethodOptions = HTTP_METHODS.map((value) => ({
	value, label: <HttpMethodBadge method={value} />, searchLabel: value,
}));

export function UrlEditorContent({ readOnly, editor }: Props) {
	const selectedMethod = (editor.method.request.method || 'GET').toUpperCase();
	const methodSelect = <div className='wfUrlMethodSelect' data-testid='workflow-url-method'>
		<Select value={selectedMethod} onChange={editor.onMethodChange}
			options={urlMethodOptions} sortOptions={false} readOnly={readOnly}
			testId='workflow-url-method-select' />
	</div>;
	return <div data-testid='workflow-url-editor'
		style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
		<UrlEndpointField readOnly={readOnly} value={editor.endpointRaw}
			beforeNode={!readOnly && editor.method.connector != null
				? <NewFeature id='workflow-connector-http-method'>{methodSelect}</NewFeature>
				: methodSelect}
			endpointArgs={editor.endpointArgs} endpointArgsRef={editor.endpointArgsRef}
			connection={editor.connection} currentMethod={editor.method}
			divRef={editor.endpointDivRef} lastCaretRef={editor.lastCaretRef}
			lastRawCaretRef={editor.lastRawCaretRef}
			selectedTokenIndexRef={editor.selectedTokenRef}
			onRawCaretChange={(raw, visual) => {
				editor.queryCaretTargetRef.current = null;
				editor.lastRawCaretRef.current = raw; editor.lastCaretRef.current = visual;
			}}
			onRawChange={editor.onRawChange} onBlurCommit={editor.persistence.saveAllNow}
			afterNode={!readOnly && <Button icon={<LinkOutlined />}
				onClick={() => editor.setReferenceOpen((open) => !open)}
				style={{ flexShrink: 0 }} data-testid='workflow-url-insert-reference'>
				Insert Reference
			</Button>} />
		{!readOnly && editor.referenceOpen && editor.connection && (
			// Mounted only while open, so autoFocus fires on the click that opened it.
			<LegacyBodyReferenceGenerator connection={editor.connection} currentMethod={editor.method}
				showWebhookOption={false} onApply={editor.applyReference} autoFocus />
		)}
		<UrlQueryParamsTable readOnly={readOnly} rows={editor.queryParams}
			endpointArgs={editor.endpointArgs} connection={editor.connection}
			currentMethod={editor.method} onToggleEnabled={editor.query.onToggleEnabled}
			onChangeParam={editor.query.onChangeParam} onRemoveParamRow={editor.query.removeParamRow}
			onCaretChange={(target) => { editor.queryCaretTargetRef.current = target; }} />
	</div>;
}
