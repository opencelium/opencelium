import { ApiOutlined, LinkOutlined, NumberOutlined } from '@ant-design/icons';
import { Select } from 'antd';
import type { ReactNode } from 'react';
import { Icon } from '@shared/ui/primitives/Icon';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { ReferenceSource } from './referenceSource.types';
import './referenceSource.css';

const SOURCE_META: Record<ReferenceSource, { key: string; icon: ReactNode }> = {
	constant: { key: 'constant', icon: <NumberOutlined /> },
	direct: { key: 'method', icon: <ApiOutlined /> },
	webhook: { key: 'webhook', icon: <LinkOutlined /> },
	global: { key: 'global', icon: <Icon name="globe" size={14} /> },
};

type Props<T extends ReferenceSource> = {
	value: T;
	sources: readonly T[];
	popupZIndex: number;
	testId?: string;
	onChange: (value: T) => void;
};

/** Shows only the chosen source's icon; the menu lists every source with its name and a hint. */
export function ReferenceSourceSelect<T extends ReferenceSource>({ value, sources, popupZIndex, testId, onChange }: Props<T>) {
	const { t } = useI18n('workflow');
	return (
		<Select<T>
			value={value}
			className="referenceSourceSelect"
			data-testid={testId}
			onChange={onChange}
			options={sources.map((source) => ({ value: source, label: t(`conditionBuilder.source.${SOURCE_META[source].key}`), meta: SOURCE_META[source] }))}
			labelRender={({ value: selected, label }) => (
				<Tooltip content={label} zIndex={popupZIndex + 1}>
					<span className="referenceSwitcherLabel">{SOURCE_META[selected as T]?.icon}</span>
				</Tooltip>
			)}
			optionRender={({ data }) => (
				<span className="referenceSourceOption">
					<span className="referenceSourceOptionIcon">{data.meta.icon}</span>
					<span className="referenceSourceOptionText">
						<span>{data.label}</span>
						<span className="referenceSourceOptionHint">{t(`conditionBuilder.sourceHint.${data.meta.key}`)}</span>
					</span>
				</span>
			)}
			getPopupContainer={() => document.body}
			popupMatchSelectWidth={260}
			styles={{ popup: { root: { zIndex: popupZIndex } } }}
		/>
	);
}
