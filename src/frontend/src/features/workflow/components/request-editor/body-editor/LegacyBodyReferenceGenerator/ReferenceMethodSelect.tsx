import { Select } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { CopyButton } from '@shared/ui/actions/CopyButton';
import { MethodColorDot } from '../../../MethodColorDot/MethodColorDot';
import type { MethodWithId } from '../../../../types/connection';
import { getMethodConnectorChipInfo } from '../requestReferenceOptions';
import { MethodConnectorChip } from '../MethodConnectorChip/MethodConnectorChip';

type Props = {
	methods: MethodWithId[];
	selectedMethod?: MethodWithId;
	methodId?: string;
	duplicateIndexByColor: Map<string, number>;
	onChange: (methodId: string) => void;
};

export function ReferenceMethodSelect({ methods, selectedMethod, methodId,
	duplicateIndexByColor, onChange }: Props) {
	const { t } = useI18n('workflow');
	return (
		<div className='selectCopyHost'>
			<CopyButton value={selectedMethod?.label || selectedMethod?.name || ''} className='selectCopyButton' />
			<Select
				placeholder={t('placeholders.selectMethod')}
				value={methodId}
				className='bodyLegacyGeneratorSelect'
				size='large'
				showSearch
				filterOption={(input, option) => {
					const term = input.toLowerCase();
					const data = option as { label?: unknown; connectorTitle?: string };
					return String(data?.label ?? '').toLowerCase().includes(term)
						|| String(data?.connectorTitle ?? '').toLowerCase().includes(term);
				}}
				prefix={selectedMethod ? (
					<MethodConnectorChip method={selectedMethod} iconOnly iconSize={18} tooltipZIndex={13020} />
				) : undefined}
				onChange={onChange}
				options={methods.map((method) => ({
					label: method.label || method.name,
					value: method.id,
					connectorTitle: getMethodConnectorChipInfo(method).title,
					color: method.color,
					dupIndex: method.color ? duplicateIndexByColor.get(method.color.toLowerCase()) : undefined,
					method,
				}))}
				optionRender={(option) => {
					const data = option.data as { color?: string; dupIndex?: number; method: MethodWithId };
					const isWebhook = getMethodConnectorChipInfo(data.method).kind === 'webhook';
					const row = <span className='bodyLegacyMethodOption'>
						<span className='bodyLegacyMethodOptionName'>
							<MethodColorDot color={data.color} index={data.dupIndex} />
							<span className='bodyLegacyMethodOptionLabel'>{option.label}</span>
						</span>
						<MethodConnectorChip method={data.method} tooltipZIndex={13020} disableTooltip={isWebhook} />
					</span>;
					return isWebhook ? <Tooltip content={t('refGenerator.webhookTriggerHint')}
						placement='right' zIndex={13020}>{row}</Tooltip> : row;
				}}
				getPopupContainer={() => document.body}
				popupMatchSelectWidth={420}
				styles={{ popup: { root: { zIndex: 13010 } } }}
			/>
		</div>
	);
}
