import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { PickerItem } from '@entities/globalVariable/model/types';
import { callOf, parameterNotes, type ImportCall } from './enhancementImports.utils';

type Props = {
	selected: PickerItem[];
	// The transformation's own args, which a script call passes on.
	argNames: string[];
	// Absent while read-only: the chips then only show how to use each import.
	onInsert?: (call: ImportCall) => void;
};

/** How to use each picked import in the code, as chips that insert that code at the cursor. */
export function ImportUsageChips({ selected, argNames, onInsert }: Props) {
	const { t } = useI18n('workflow');
	const tooltipOf = (item: PickerItem, call: ImportCall) => {
		const lines = item.kind === 'SCRIPT'
			? [
				t('enhancement.imports.scriptTooltip', { name: item.name, call: call.text }),
				...(item.parameters.length > 0 ? [t('enhancement.imports.parametersHeading'), ...parameterNotes(item, t)] : []),
			]
			: [t('enhancement.imports.valueTooltip', { name: item.name })];
		if (onInsert) lines.push(t(item.kind === 'SCRIPT' && item.parameters.some((parameter) => parameter.required)
			? 'enhancement.imports.clickToInsertCall' : 'enhancement.imports.clickToInsert'));
		return <div style={{ whiteSpace: 'pre-line' }}>{lines.join('\n')}</div>;
	};

	return (
		<div className="bodyLegacyEnhancementImportsUsage" data-testid="workflow-enhancement-imports-usage">
			<span>{t(onInsert ? 'enhancement.imports.usageInsert' : 'enhancement.imports.usage')}</span>
			{selected.map((item) => {
				const call = callOf(item, argNames);
				return (
					<Tooltip key={item.name} content={tooltipOf(item, call)} placement="top" maxWidth={420}>
						{onInsert ? (
							<Button type="dashed" onClick={() => onInsert(call)}
								testId={`workflow-enhancement-imports-insert-${item.name}`}>
								<code>{call.text}</code>
							</Button>
						) : (
							<code>{call.text}</code>
						)}
					</Tooltip>
				);
			})}
		</div>
	);
}
