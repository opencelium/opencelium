import { useI18n } from '@shared/i18n/hooks/useI18n';
import './urlActiveReference.css';
import { LinkOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { HttpMethodBadge } from '@shared/ui/http-method/HttpMethodBadge';
import { Select } from '@shared/ui/primitives/Select';
import { LegacyBodyReferenceGenerator } from '../../body-editor/LegacyBodyReferenceGenerator/LegacyBodyReferenceGenerator';
import { UrlEndpointField } from '../UrlEndpointField/UrlEndpointField';
import { UrlQueryParamsTable } from '../UrlQueryParamsTable/UrlQueryParamsTable';
import type { useUrlEditor } from './useUrlEditor';
import { HTTP_METHODS } from './urlEditor.data';
import '../urlMethodSelect.css';

type Props = { readOnly?: boolean; editor: ReturnType<typeof useUrlEditor> };

const urlMethodOptions = HTTP_METHODS.map((value) => ({
	value,
	label: <HttpMethodBadge method={value} />,
	searchLabel: value,
}));

export function UrlEditorContent({ readOnly, editor }: Props) {
	const { t } = useI18n('workflow');
	const {
		wrapperRef,
		references,
		method,
		connection,
		endpointRaw,
		endpointDivRef,
		lastCaretRef,
		lastRawCaretRef,
		selectedTokenRef,
		queryCaretTargetRef,
		endpointArgs,
		endpointArgsRef,
		queryParams,
		referenceOpen,
		setReferenceOpen,
		applyReference,
		onRawChange,
		onMethodChange,
		persistence,
		query,
	} = editor;
	const { active, setPickerOpen, restore } = references;
	const togglePicker = () => {
		const open = !referenceOpen;
		setPickerOpen(open);
		setReferenceOpen(open);
		if (!open) restore();
	};
	const selectedMethod = (method.request.method || 'GET').toUpperCase();
	return (
		<div
			ref={wrapperRef}
			data-testid="workflow-url-editor"
			onKeyDownCapture={(event) => {
				if (referenceOpen && event.key === 'Escape') {
					event.preventDefault();
					event.stopPropagation();
					togglePicker();
				}
			}}
			style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}
		>
			<UrlEndpointField
				readOnly={readOnly}
				value={endpointRaw}
				beforeNode={
					<div className="wfUrlMethodSelect" data-testid="workflow-url-method">
						<Select
							value={selectedMethod}
							onChange={onMethodChange}
							options={urlMethodOptions}
							sortOptions={false}
							readOnly={readOnly}
							testId="workflow-url-method-select"
						/>
					</div>
				}
				endpointArgs={endpointArgs}
				endpointArgsRef={endpointArgsRef}
				connection={connection}
				currentMethod={method}
				divRef={endpointDivRef}
				lastCaretRef={lastCaretRef}
				lastRawCaretRef={lastRawCaretRef}
				selectedTokenIndexRef={selectedTokenRef}
				onRawCaretChange={(raw, visual) => {
					queryCaretTargetRef.current = null;
					lastRawCaretRef.current = raw;
					lastCaretRef.current = visual;
				}}
				onRawChange={onRawChange}
				onBlurCommit={persistence.saveAllNow}
				afterNode={
					!readOnly && (
						<Button
							icon={<LinkOutlined />}
							data-url-reference-control
							onMouseDown={(event) => event.preventDefault()}
							onClick={togglePicker}
							style={{ flexShrink: 0 }}
							data-testid="workflow-url-insert-reference"
						>
							{t(active ? 'methodConfig.replaceReference' : 'methodConfig.insertReference')}
						</Button>
					)
				}
			/>
			{!readOnly && referenceOpen && connection && (
				// Mounted only while open, so autoFocus fires on the click that opened it.
				<div data-url-reference-control>
					<LegacyBodyReferenceGenerator
						value={
							active
								? endpointArgs[active.token.match(/#{%\s*([\w-]+)\s*%}/)?.[1] ?? '']?.source
								: undefined
						}
						connection={connection}
						currentMethod={method}
						showWebhookOption={false}
						onApply={applyReference}
						autoFocus
					/>
				</div>
			)}
			<UrlQueryParamsTable
				readOnly={readOnly}
				rows={queryParams}
				endpointArgs={endpointArgs}
				connection={connection}
				currentMethod={method}
				onToggleEnabled={query.onToggleEnabled}
				onChangeParam={query.onChangeParam}
				onRemoveParamRow={query.removeParamRow}
				onCaretChange={(target) => {
					queryCaretTargetRef.current = target;
				}}
			/>
		</div>
	);
}
