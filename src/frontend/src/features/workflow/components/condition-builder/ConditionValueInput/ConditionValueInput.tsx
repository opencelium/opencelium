import { useRef } from 'react';
import { Input } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { LegacyResponseFieldSelect } from '../../request-editor/body-editor/LegacyResponseFieldSelect/LegacyResponseFieldSelect';
import { LegacyWebhookReferenceSelect } from '../../request-editor/body-editor/LegacyWebhookReferenceSelect/LegacyWebhookReferenceSelect';
import { extractWebhookValue, webhookSnippet } from '../../request-editor/body-editor/bodyWebhook';
import { buildReferenceValue } from '../../request-editor/body-editor/requestReferenceOptions';
import { MethodSelect } from '../MethodSelect/MethodSelect';
import { ReferenceSourceSelect } from '../../reference-source/ReferenceSourceSelect';
import { ResponseTypeSelect } from '../../reference-source/ResponseTypeSelect';
import type { ConditionValueInputProps } from './ConditionValueInput.types';
import {
	parsePathFromReference,
} from '../conditionBuilder.utils';
import { useConditionValueInput } from './useConditionValueInput';
import { ConditionReferenceChip } from './ConditionReferenceChip';
import type { ConditionValueSource } from '../conditionBuilder.types';

const SOURCES: ConditionValueSource[] = ['constant', 'direct', 'webhook'];

export function ConditionValueInput({ side, properties, methods, allMethods,
	iterators, onChange }: ConditionValueInputProps) {
	const { t } = useI18n('workflow');
	const editorRef = useRef<HTMLDivElement>(null);
	const state = useConditionValueInput({ side, properties, allMethods, onChange, editorRef });
	const { fieldKey, fieldValue, source, methodId, responseType } = state;
	const selectedMethod = allMethods.find((method) => method.id === methodId);
	if (state.isChipShown) return <ConditionReferenceChip side={side} kind={source === 'webhook' ? 'webhook' : 'step'}
		fieldValue={fieldValue} method={selectedMethod} onEdit={state.startEditing} onRemove={state.removeReference} />;
	if (source === 'constant') return <div className="conditionValueInput">
		<ReferenceSourceSelect value={source} sources={SOURCES} popupZIndex={13010} onChange={state.setSource} />
		<Input placeholder={t('placeholders.constant')} value={fieldValue}
			onChange={(event) => onChange({ [fieldKey]: event.target.value })}
			className="conditionConstantInput" />
	</div>;
	if (source === 'webhook') return <div ref={editorRef} className="conditionValueInput conditionValueInputWebhook" onBlur={state.finishEditing}>
		<ReferenceSourceSelect value={source} sources={SOURCES} popupZIndex={13010} onChange={state.setSource} />
		<LegacyWebhookReferenceSelect value={extractWebhookValue(fieldValue) || undefined}
			onChange={(value) => onChange({ [fieldKey]: value ? webhookSnippet(value) : undefined })} />
	</div>;
	return <div ref={editorRef} className="conditionValueInput" onBlur={state.finishEditing}>
		<ReferenceSourceSelect value={source} sources={SOURCES} popupZIndex={13010} onChange={state.setSource} />
		<MethodSelect methods={methods} selectedMethod={selectedMethod} value={methodId}
			onChange={(value) => { state.setDraftMethodId(value); onChange({ [fieldKey]: undefined }); }} />
		<ResponseTypeSelect value={responseType} popupZIndex={13010} onChange={(value) => {
			state.setDraftResponseType(value);
			onChange({ [fieldKey]: value === 'status' && selectedMethod
				? buildReferenceValue(selectedMethod.color, value, 'status') : undefined });
		}} />
		<div className="conditionFieldSelect"><LegacyResponseFieldSelect
			key={`${selectedMethod?.id ?? 'none'}-${responseType}`} method={selectedMethod}
			type={responseType} value={parsePathFromReference(fieldValue)} disabled={!methodId}
			iterators={iterators} onChange={(value) => {
				const path = parsePathFromReference(value);
				onChange({ [fieldKey]: path && selectedMethod
					? buildReferenceValue(selectedMethod.color, responseType, path) : undefined });
			}} /></div>
	</div>;
}
