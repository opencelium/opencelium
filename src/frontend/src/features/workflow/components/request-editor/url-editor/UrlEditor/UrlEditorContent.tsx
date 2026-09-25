import { LinkOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { Select } from '@shared/ui/primitives/Select';
import { LegacyBodyReferenceGenerator } from '../../body-editor/LegacyBodyReferenceGenerator/LegacyBodyReferenceGenerator';
import { UrlEndpointField } from '../UrlEndpointField/UrlEndpointField';
import { UrlQueryParamsTable } from '../UrlQueryParamsTable/UrlQueryParamsTable';
import type { useUrlEditor } from './useUrlEditor';
import { urlMethodOptions } from './urlEditor.data';
import '../urlMethodSelect.css';

type Props = { readOnly?: boolean; editor: ReturnType<typeof useUrlEditor> };

export function UrlEditorContent({ readOnly, editor }: Props) {
	const selectedMethod = (editor.method.request.method || 'GET').toUpperCase();
	return <div data-testid='workflow-url-editor'
		style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
		<UrlEndpointField readOnly={readOnly} value={editor.endpointRaw}
			beforeNode={editor.method.connector == null ? (
				<div className='wfUrlMethodSelect' data-testid='workflow-url-method'>
					<Select value={selectedMethod} onChange={editor.onMethodChange}
						options={urlMethodOptions} sortOptions={false} readOnly={readOnly}
						testId='workflow-url-method-select' />
				</div>
			) : <div className='wfUrlMethodReadonly' data-testid='workflow-url-method-readonly'>
				{selectedMethod}
			</div>}
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
			<LegacyBodyReferenceGenerator connection={editor.connection} currentMethod={editor.method}
				showWebhookOption={false} onApply={editor.applyReference} />
		)}
		<UrlQueryParamsTable readOnly={readOnly} rows={editor.queryParams}
			endpointArgs={editor.endpointArgs} connection={editor.connection}
			currentMethod={editor.method} onToggleEnabled={editor.query.onToggleEnabled}
			onChangeParam={editor.query.onChangeParam} onRemoveParamRow={editor.query.removeParamRow}
			onCaretChange={(target) => { editor.queryCaretTargetRef.current = target; }} />
	</div>;
}
