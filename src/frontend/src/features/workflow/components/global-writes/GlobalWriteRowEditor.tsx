import { GlobalVariableSelect } from '@entities/globalVariable/ui/picker/GlobalVariableSelect';
import type { PickerItem } from '@entities/globalVariable/model/types';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { ConditionValueInput } from '../condition-builder/ConditionValueInput/ConditionValueInput';
import type { ConditionValueInputProps } from '../condition-builder/ConditionValueInput/ConditionValueInput.types';
import type { GlobalWriteRow } from './globalWrites.utils';

type Props = Pick<ConditionValueInputProps, 'methods' | 'allMethods' | 'iterators'> & {
	row: GlobalWriteRow;
	takenVariables: string[];
	isReadOnly: boolean;
	onChange: (row: GlobalWriteRow) => void;
	onRemove: () => void;
};

export function GlobalWriteRowEditor({ row, takenVariables, isReadOnly, methods, allMethods, iterators, onChange, onRemove }: Props) {
	const { t } = useI18n('workflow');
	// Only a mutable variable this workflow owns or may claim can be written, each at most once per method.
	const isOffered = (item: PickerItem) => item.kind === 'MUTABLE' && item.writable
		&& (item.name === row.variable || !takenVariables.includes(item.name));

	return (
		<div className="globalWriteRow" data-testid={`workflow-global-write-${row.key}`}>
			<GlobalVariableSelect value={row.variable} onChange={(variable) => onChange({ ...row, variable })}
				filter={isOffered} disabled={isReadOnly} testId="workflow-global-write-variable" />
			<div className="conditionBuilderModal globalWriteValue">
				<ConditionValueInput side="left" properties={{ leftField: row.value }} methods={methods}
					allMethods={allMethods} iterators={iterators}
					onChange={(patch) => onChange({ ...row, value: patch.leftField ?? '' })} />
			</div>
			{!isReadOnly && (
				<Tooltip content={t('globalWrites.remove')} placement="top">
					<DeleteIconButton onClick={onRemove} testId="workflow-global-write-remove" />
				</Tooltip>
			)}
		</div>
	);
}
