import { useMemo } from 'react';
import { Select } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { GlobalVariableKindBadge } from '@entities/globalVariable/ui/GlobalVariableKindBadge';
import { useGlobalPickerScope, useGlobalVariablePicker } from '@entities/globalVariable/ui/picker/globalPicker';
import type { PickerItem } from '@entities/globalVariable/model/types';
import type { Language } from '../../../../types/connection';
import { isImportable } from './enhancementImports.utils';

type Props = {
	language: Language;
	value: string[];
	readOnly?: boolean;
	onChange: (imports: string[]) => void;
};

const usageOf = (item: PickerItem) => (item.kind === 'SCRIPT'
	? `${item.name}(${item.parameters.map((parameter) => (parameter.required ? parameter.name : `${parameter.name}?`)).join(', ')})`
	: item.name);

export function EnhancementImports({ language, value, readOnly, onChange }: Props) {
	const { t } = useI18n('workflow');
	const hasScope = useGlobalPickerScope() !== null;
	const { items, isLoading } = useGlobalVariablePicker();
	const importable = useMemo(() => items.filter((item) => isImportable(item, language)), [items, language]);
	const selected = importable.filter((item) => value.includes(item.name));

	if (!hasScope) return null;
	return (
		<div className="bodyLegacyEnhancementImports" data-testid="workflow-enhancement-imports">
			<div className="bodyLegacyEnhancementLabel">{t('enhancement.imports.label')}</div>
			<Select
				mode="multiple"
				value={value}
				onChange={onChange}
				disabled={readOnly}
				loading={isLoading}
				placeholder={t('enhancement.imports.placeholder')}
				optionFilterProp="value"
				style={{ width: '100%' }}
				getPopupContainer={() => document.body}
				styles={{ popup: { root: { zIndex: 13010 } } }}
				options={importable.map((item) => ({
					value: item.name,
					label: (
						<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
							<GlobalVariableKindBadge kind={item.kind} isIconOnly />
							<code>{item.name}</code>
						</span>
					),
				}))}
				data-testid="workflow-enhancement-imports-select"
			/>
			{selected.length > 0 && (
				<div className="bodyLegacyEnhancementImportsUsage">
					{selected.map((item) => <code key={item.name}>{usageOf(item)}</code>)}
				</div>
			)}
		</div>
	);
}
