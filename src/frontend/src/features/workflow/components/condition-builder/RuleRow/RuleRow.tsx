import { CopyOutlined, DownOutlined } from '@ant-design/icons';
import { Button, Select } from 'antd';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import {
	IF_OPERATOR_LABEL_KEYS,
	IfOperatorName,
	LOOP_OPERATOR_LABEL_KEYS,
	LoopOperatorName,
	UNARY_IF_OPERATORS,
} from '../conditionBuilder.types';
import { ConditionValueInput } from '../ConditionValueInput/ConditionValueInput';
import type { RuleRowProps } from './RuleRow.types';

const IF_OPTIONS = Object.values(IfOperatorName).map((value) => ({
	value, labelKey: IF_OPERATOR_LABEL_KEYS[value],
}));
const LOOP_OPTIONS = Object.values(LoopOperatorName).map((value) => ({
	value, labelKey: LOOP_OPERATOR_LABEL_KEYS[value],
}));

export function RuleRow({ rule, operatorType, methods, allMethods, iterators,
	canDelete, onChange, onDelete, onDuplicate }: RuleRowProps) {
	const { t } = useI18n('workflow');
	const properties = rule.properties || {};
	const operator = properties.operator;
	const isLoop = operatorType === 'loop';
	const isUnary = operator && UNARY_IF_OPERATORS.has(operator as IfOperatorName);
	const isSplitString = operator === LoopOperatorName.SplitString;
	const valueInput = (side: 'left' | 'right') => <ConditionValueInput side={side}
		properties={properties} methods={methods} allMethods={allMethods}
		iterators={iterators} onChange={onChange} />;

	return <div className={`conditionRule ${isLoop ? 'conditionRuleLoop' : ''}`}>
		{isLoop ? <Select placeholder={t('placeholders.selectOperator')} value={operator}
			className="conditionOperatorSelect conditionLoopOperatorSelect" showSearch
			optionFilterProp="label" options={LOOP_OPTIONS.map((option) => ({
				value: option.value, label: t(option.labelKey),
			}))} onChange={(value) => onChange({ operator: value,
				leftField: undefined, rightField: undefined })} suffixIcon={<DownOutlined />}
			getPopupContainer={() => document.body} /> : valueInput('left')}
		{!isLoop && <Select placeholder={t('placeholders.selectOperator')} value={operator}
			className="conditionOperatorSelect" showSearch optionFilterProp="label"
			options={IF_OPTIONS.map((option) => ({ value: option.value,
				label: t(option.labelKey) })).sort((a, b) => a.label.localeCompare(b.label))}
			onChange={(value) => onChange({ operator: value, rightField: undefined })}
			suffixIcon={<DownOutlined />} getPopupContainer={() => document.body} />}
		{isLoop && operator ? valueInput('left')
			: !isLoop && operator && !isUnary ? valueInput('right') : null}
		{isLoop && isSplitString && properties.leftField ? valueInput('right') : null}
		{canDelete && <div className="conditionRuleActions">
			<Tooltip content={t('actions.duplicate')}><Button type="text"
				className="conditionDuplicateButton" icon={<CopyOutlined />}
				onClick={onDuplicate} /></Tooltip>
			<Tooltip content={t('actions.delete')}><DeleteIconButton iconSize={14}
				onClick={onDelete} /></Tooltip>
		</div>}
	</div>;
}
