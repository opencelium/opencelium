import { Select } from 'antd';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { ResponseType } from '../request-editor/body-editor/requestReferenceOptions';
import { RESPONSE_PART_LETTER } from './referenceSource.types';
import './referenceSource.css';

const RESPONSE_TYPES: ResponseType[] = ['body', 'header', 'status'];

type Props = {
	value: ResponseType;
	popupZIndex: number;
	disabled?: boolean;
	testId?: string;
	onChange: (value: ResponseType) => void;
};

/** Shows only the chosen part's first letter (B / H / S); the menu lists the full names. */
export function ResponseTypeSelect({ value, popupZIndex, disabled, testId, onChange }: Props) {
	const { t } = useI18n('workflow');
	return (
		<Select<ResponseType>
			value={value}
			className="referenceResponseTypeSelect"
			data-testid={testId}
			disabled={disabled}
			onChange={onChange}
			options={RESPONSE_TYPES.map((type) => ({ value: type, label: t(`conditionBuilder.responseType.${type}`) }))}
			labelRender={({ label }) => (
				<Tooltip content={label} zIndex={popupZIndex + 1}>
					<span className="referenceSwitcherLabel">{RESPONSE_PART_LETTER[value]}</span>
				</Tooltip>
			)}
			getPopupContainer={() => document.body}
			popupMatchSelectWidth={110}
			styles={{ popup: { root: { zIndex: popupZIndex } } }}
		/>
	);
}
