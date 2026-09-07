import { Select } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { CopyButton } from '@shared/ui/actions/CopyButton';
import { useMemo } from 'react';
import { MethodColorDot } from '../MethodColorDot/MethodColorDot';
import type { MethodWithId } from '../../types/connection';
import { getDuplicateMethodIndexByColor } from '../../utils/methodColor';
import { getMethodConnectorChipInfo }
	from '../request-editor/body-editor/requestReferenceOptions';
import { MethodConnectorChip }
	from '../request-editor/body-editor/MethodConnectorChip/MethodConnectorChip';
// The option's own styling, which came with it from the body editor.
import '../request-editor/body-editor/bodyLegacy.css';

/** Clears the method dialog this select was written for. A host that stacks
 *  higher — the confirm dialog, at 20000 — has to say so, or the popup opens
 *  behind whatever opened it. */
const DEFAULT_POPUP_Z_INDEX = 13010;

type Props = {
	methods: MethodWithId[];
	selectedMethod?: MethodWithId;
	methodId?: string;
	popupZIndex?: number;
	disabled?: boolean;
	/** An answer offered before the methods, for a host that needs a "none of
	 *  them" — the delete dialog's "clear these references". Carries no colour
	 *  dot or connector chip: it is not a method. */
	leadingOption?: { value: string; label: string };
	testId?: string;
	onChange: (methodId: string) => void;
	/** Fires on every pick, including of the option already selected, which
	 *  `onChange` cannot report. */
	onSelect?: (methodId: string) => void;
};

/**
 * The method picker as the reference generator draws it: colour dot, name, and
 * the connector it belongs to, with a duplicate-colour index where one colour
 * is carried by two methods. Shared rather than generator-local because a
 * method reads the same wherever it is offered — the delete dialog's remap rows
 * pick methods too, and a second picker of its own would have drifted from this
 * one the first time either changed.
 */

export function ReferenceMethodSelect({ methods, selectedMethod, methodId,
	popupZIndex, leadingOption, testId, disabled, onChange, onSelect }: Props) {
	const { t } = useI18n('workflow');
	// Derived here rather than taken as a prop: it is a fact about the list this
	// select was handed, and every caller would compute it the same way.
	const duplicateIndexByColor = useMemo(() => getDuplicateMethodIndexByColor(methods), [methods]);
	const popupZ = popupZIndex ?? DEFAULT_POPUP_Z_INDEX;
	// The chips ride above the popup they are drawn in, whatever it stacks at.
	const tooltipZ = popupZ + 10;
	return (
		<div className='selectCopyHost'>
			<CopyButton value={selectedMethod?.label || selectedMethod?.name || ''} className='selectCopyButton' />
			<Select
				data-testid={testId}
				disabled={disabled}
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
					<MethodConnectorChip method={selectedMethod} iconOnly iconSize={18} tooltipZIndex={tooltipZ} />
				) : undefined}
				onChange={onChange}
				onSelect={(picked) => onSelect?.(String(picked))}
				options={[
					...(leadingOption ? [{ ...leadingOption, method: undefined }] : []),
					...methods.map((method) => ({
					label: method.label || method.name,
					value: method.id,
					connectorTitle: getMethodConnectorChipInfo(method).title,
					color: method.color,
						dupIndex: method.color
							? duplicateIndexByColor.get(method.color.toLowerCase()) : undefined,
						method,
					})),
				]}
				optionRender={(option) => {
					const data = option.data as
						{ color?: string; dupIndex?: number; method?: MethodWithId };
					if (!data.method) return option.label;
					const isWebhook = getMethodConnectorChipInfo(data.method).kind === 'webhook';
					const row = <span className='bodyLegacyMethodOption'>
						<span className='bodyLegacyMethodOptionName'>
							<MethodColorDot color={data.color} index={data.dupIndex} />
							<span className='bodyLegacyMethodOptionLabel'>{option.label}</span>
						</span>
						<MethodConnectorChip method={data.method} tooltipZIndex={tooltipZ} disableTooltip={isWebhook} />
					</span>;
					return isWebhook ? <Tooltip content={t('refGenerator.webhookTriggerHint')}
						placement='right' zIndex={tooltipZ}>{row}</Tooltip> : row;
				}}
				getPopupContainer={() => document.body}
				popupMatchSelectWidth={420}
				styles={{ popup: { root: { zIndex: popupZ } } }}
			/>
		</div>
	);
}
