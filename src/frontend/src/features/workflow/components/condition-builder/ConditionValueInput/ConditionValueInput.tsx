import { Input } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { LegacyResponseFieldSelect } from '../../request-editor/body-editor/LegacyResponseFieldSelect/LegacyResponseFieldSelect';
import { LegacyWebhookReferenceSelect } from '../../request-editor/body-editor/LegacyWebhookReferenceSelect/LegacyWebhookReferenceSelect';
import { extractWebhookValue, webhookSnippet } from '../../request-editor/body-editor/bodyWebhook';
import { buildReferenceValue } from '../../request-editor/body-editor/requestReferenceOptions';
import { MethodSelect } from '../MethodSelect/MethodSelect';
import { ResponseTypeSwitcher } from '../ResponseTypeSwitcher/ResponseTypeSwitcher';
import { SourceSwitcher } from '../SourceSwitcher/SourceSwitcher';
import type { ConditionValueInputProps } from './ConditionValueInput.types';
import {
	parsePathFromReference,
} from './conditionValueReference.utils';
import { useConditionValueInput } from './useConditionValueInput';

export function ConditionValueInput({ side, properties, methods, allMethods,
	iterators, onChange }: ConditionValueInputProps) {
	const { t } = useI18n('workflow');
	const state = useConditionValueInput({ side, properties, allMethods, onChange });
	const { fieldKey, fieldValue, source, methodId, responseType } = state;
	const selectedMethod = allMethods.find((method) => method.id === methodId);
	if (source === 'constant') return <div className="conditionValueInput">
		<SourceSwitcher value={source} onChange={state.setSource} />
		<Input placeholder={t('placeholders.constant')} value={fieldValue}
			onChange={(event) => onChange({ [fieldKey]: event.target.value })}
			className="conditionConstantInput" />
	</div>;
	if (source === 'webhook') return <div className="conditionValueInput conditionValueInputWebhook">
		<SourceSwitcher value={source} onChange={state.setSource} />
		<LegacyWebhookReferenceSelect value={extractWebhookValue(fieldValue) || undefined}
			onChange={(value) => onChange({ [fieldKey]: value ? webhookSnippet(value) : undefined })} />
	</div>;
	return <div className="conditionValueInput">
		<SourceSwitcher value={source} onChange={state.setSource} />
		<MethodSelect methods={methods} selectedMethod={selectedMethod} value={methodId}
			onChange={(value) => { state.setDraftMethodId(value); onChange({ [fieldKey]: undefined }); }} />
		<ResponseTypeSwitcher value={responseType} onChange={(value) => {
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
