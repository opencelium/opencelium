import { useI18n } from '@shared/i18n/hooks/useI18n';
import { buildTestId } from '@shared/testing/testId';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { Button } from '@shared/ui/primitives/Button';
import { Checkbox } from '@shared/ui/primitives/Checkbox';
import { Icon } from '@shared/ui/primitives/Icon';
import { Input } from '@shared/ui/primitives/Input';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { createEmptyRow, isAddedRow, isLockedOrigin, type EditableRow, type RowOrigin } from '../../model/requestEdits';
import { ORIGIN_TONE } from '../badgeTones';
import { PlaygroundBadge } from '../PlaygroundBadge';

type Props = {
	rows: EditableRow[];
	originOf: (row: EditableRow) => RowOrigin;
	addLabel: string;
	emptyText: string;
	testIdPrefix: string;
	onChange: (rows: EditableRow[]) => void;
};

export function EditableRowsTable({ rows, originOf, addLabel, emptyText, testIdPrefix, onChange }: Props) {
	const { t } = useI18n('workflow');
	const update = (id: string, patch: Partial<EditableRow>) =>
		onChange(rows.map((row) => row.id === id ? { ...row, ...patch } : row));
	const add = () => onChange([...rows, createEmptyRow()]);

	return (
		<div className='rpTable' data-testid={testIdPrefix}>
			<div className='rpGridRow rpEditRow rpTableHead'>
				<span>{t('requestPlayground.table.on')}</span>
				<span>{t('requestPlayground.table.key')}</span>
				<span>{t('requestPlayground.table.value')}</span>
				<span className='rpAlignEnd'>{t('requestPlayground.table.origin')}</span>
			</div>
			{rows.length === 0 && <div className='rpGridRow rpEmptyNote'>{emptyText}</div>}
			{rows.map((row) => {
				const origin = originOf(row);
				const isLocked = isLockedOrigin(origin) && !isAddedRow(row);
				const testId = (part: string) => buildTestId(testIdPrefix, row.key || row.id, part);
				return (
					<div key={row.id} className={`rpGridRow rpEditRow${row.enabled ? '' : ' rpEditRow--off'}`}
						data-testid={testId('row')}>
						<Tooltip content={t('requestPlayground.table.enable')}>
							<span><Checkbox checked={row.enabled} disabled={isLocked} testId={testId('enabled')}
								onChange={(enabled) => update(row.id, { enabled })} /></span>
						</Tooltip>
						<Input value={row.key} readOnly={isLocked} testId={testId('key')}
							placeholder={t('requestPlayground.params.keyPlaceholder')}
							onChange={(event) => update(row.id, { key: event.target.value })} />
						<Input value={row.value} readOnly={isLocked} type={origin === 'secret' ? 'password' : 'text'}
							className='rpMonoInput' testId={testId('value')}
							placeholder={t('requestPlayground.params.valuePlaceholder')}
							rightSlot={isLocked ? <Icon name='lock' size={12} isSubtle /> : undefined}
							onChange={(event) => update(row.id, { value: event.target.value })} />
						<span className='rpRowActions'>
							<PlaygroundBadge tone={ORIGIN_TONE[origin]} hint={t(`requestPlayground.originHint.${origin}`)}>
								{t(`requestPlayground.origin.${origin}`)}
							</PlaygroundBadge>
							{isAddedRow(row) && (
								<DeleteIconButton testId={testId('delete')}
									onClick={() => onChange(rows.filter((item) => item.id !== row.id))} />
							)}
						</span>
					</div>
				);
			})}
			<div className='rpTableFooter'>
				<Button type='link' onClick={add} testId={`${testIdPrefix}-add`}>{addLabel}</Button>
			</div>
		</div>
	);
}

export function OriginLegend({ origins }: { origins: RowOrigin[] }) {
	const { t } = useI18n('workflow');
	return (
		<div className='rpLegend'>
			{origins.map((origin) => (
				<span key={origin} className='rpLegendItem'>
					<PlaygroundBadge tone={ORIGIN_TONE[origin]}>{t(`requestPlayground.origin.${origin}`)}</PlaygroundBadge>
					{t(`requestPlayground.originHint.${origin}`)}
				</span>
			))}
		</div>
	);
}
