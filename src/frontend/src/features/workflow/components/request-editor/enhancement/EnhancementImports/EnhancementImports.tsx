import { useMemo } from 'react';
import { Select } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { GlobalVariableKindBadge } from '@entities/globalVariable/ui/GlobalVariableKindBadge';
import { useGlobalPickerScope, useGlobalVariablePicker } from '@entities/globalVariable/ui/picker/globalPicker';
import type { Language } from '../../../../types/connection';
import { isImportable, type ImportCall } from './enhancementImports.utils';
import { ImportUsageChips } from './ImportUsageChips';
import { Icon } from '@shared/ui/primitives/Icon';

type Props = {
	language: Language;
	value: string[];
	readOnly?: boolean;
	onChange: (imports: string[]) => void;
	// The transformation's own args, which a script call passes on.
	argNames: string[];
	// Inserts the call at the script editor's cursor.
	onInsert?: (call: ImportCall) => void;
};

export function EnhancementImports({ language, value, readOnly, argNames, onChange, onInsert }: Props) {
	const { t } = useI18n('workflow');
	const hasScope = useGlobalPickerScope() !== null;
	const { items, isLoading } = useGlobalVariablePicker();
	const importable = useMemo(() => items.filter((item) => isImportable(item, language)), [items, language]);
	const selected = importable.filter((item) => value.includes(item.name));

	if (!hasScope) return null;
	return (
		<div className="bodyLegacyEnhancementImports" data-testid="workflow-enhancement-imports">
			<div className="bodyLegacyEnhancementLabel bodyLegacyEnhancementImportsLabel">
				{t('enhancement.imports.label')}
				<Tooltip content={<div style={{ whiteSpace: 'pre-line' }}>{t('enhancement.imports.info')}</div>} placement="top" maxWidth={420}>
					<span data-testid="workflow-enhancement-imports-info" style={{ display: 'inline-flex' }}>
						<Icon name="info" size={14} color="secondary" isSubtle />
					</span>
				</Tooltip>
			</div>
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
			{selected.length > 0
				? <ImportUsageChips selected={selected} argNames={argNames} onInsert={readOnly ? undefined : onInsert} />
				: <div className="bodyLegacyEnhancementImportsUsage">{t('enhancement.imports.emptyHint')}</div>}
		</div>
	);
}
