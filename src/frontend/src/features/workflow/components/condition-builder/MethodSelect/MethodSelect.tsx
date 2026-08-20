import { Select } from 'antd';
import { CopyButton } from '@shared/ui/actions/CopyButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { getDuplicateMethodIndexByColor } from '../../../utils/methodColor';
import { MethodColorDot } from '../../MethodColorDot/MethodColorDot';
import { MethodConnectorChip } from '../../request-editor/body-editor/MethodConnectorChip/MethodConnectorChip';
import { getMethodConnectorChipInfo } from '../../request-editor/body-editor/requestReferenceOptions';
import type { MethodSelectOption, MethodSelectProps } from './MethodSelect.types';

const getMethodLabel = (method: MethodSelectOption['method']) =>
	method.label || method.name || method.index || method.id;

export function MethodSelect({ methods, selectedMethod, value, onChange }: MethodSelectProps) {
	const { t } = useI18n('workflow');
	const selected = methods.find((method) => method.id === value) ?? selectedMethod;
	const options = selectedMethod && !methods.some((method) => method.id === selectedMethod.id)
		? [selectedMethod, ...methods] : methods;
	const duplicateIndexByColor = getDuplicateMethodIndexByColor(options);
	return <div className="selectCopyHost">
		<CopyButton value={selected ? getMethodLabel(selected) : ''} className="selectCopyButton" />
		<Select placeholder={t('placeholders.selectMethod')} value={value}
			className="conditionMethodSelect" onChange={onChange}
			showSearch={{ filterOption: (input, option) => {
				const data = option as { label?: unknown; connectorTitle?: string };
				const term = input.toLowerCase();
				return String(data?.label ?? '').toLowerCase().includes(term) ||
					String(data?.connectorTitle ?? '').toLowerCase().includes(term);
			} }}
			prefix={selected ? <MethodConnectorChip method={selected} iconOnly iconSize={18}
				tooltipZIndex={13020} /> : undefined}
			options={options.map((method) => ({ value: method.id, label: getMethodLabel(method),
				connectorTitle: getMethodConnectorChipInfo(method).title, color: method.color,
				dupIndex: method.color ? duplicateIndexByColor.get(method.color.toLowerCase()) : undefined,
				method }))}
			optionRender={(option) => {
				const data = option.data as MethodSelectOption;
				const webhook = getMethodConnectorChipInfo(data.method).kind === 'webhook';
				const row = <span className="conditionMethodOption">
					<span className="conditionMethodLeft"><MethodColorDot color={data.color}
						index={data.dupIndex} /><span className="conditionMethodName">{option.label}</span></span>
					<MethodConnectorChip method={data.method} tooltipZIndex={13020}
						disableTooltip={webhook} />
				</span>;
				return webhook ? <Tooltip content={t('refGenerator.webhookTriggerHint')}
					placement="right" zIndex={13020}>{row}</Tooltip> : row;
			}}
			getPopupContainer={() => document.body} popupMatchSelectWidth={420}
			styles={{ popup: { root: { zIndex: 13010 } } }} />
	</div>;
}
