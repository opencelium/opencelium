import { useI18n } from '@shared/i18n/hooks/useI18n';
import { buildTestId } from '@shared/testing/testId';
import { Button } from '@shared/ui/primitives/Button';
import type { PlaygroundSession } from '../../hooks/usePlaygroundSession';
import type { PlaygroundValues } from '../../hooks/usePlaygroundValues';
import { readConnectionFieldValue, SECRET_MASK } from '../../model/playgroundConnection';
import { emptyInput } from '../../model/playgroundValues';
import { SOURCE_TONE } from '../badgeTones';
import { PrefillSourceSelect } from './PrefillSourceSelect';
import { ConnectionValueControl, InputValueControl, KindToggle } from './TestValueControls';
import { TestValueRow } from './TestValueRow';
import { buildValueRows, VALUE_GROUPS, type ValueRow } from './valueRows';

// The nonce changes on every request, so selecting the same value again still moves focus to it.
export type FocusRequest = { key: string; nonce: number };

type Props = {
	session: PlaygroundSession;
	values: PlaygroundValues;
	missingKeys: string[];
	focus: FocusRequest | null;
};

export function TestValuesTab({ session, values, missingKeys, focus }: Props) {
	const { t } = useI18n('workflow');
	const rows = buildValueRows(session.inputs, t);
	const focusNonce = (key: string) => focus?.key === key ? focus.nonce : null;
	const testId = (key: string, part: string) => buildTestId('request-playground-value', key, part);

	const renderInputRow = (row: Extract<ValueRow, { kind: 'input' }>) => {
		const value = values.values[row.key] ?? emptyInput();
		const isMissing = missingKeys.includes(row.key);
		const source = isMissing ? 'empty' : value.source;
		return (
			<TestValueRow key={row.key} row={row} isEdited={value.source === 'edited'} focusNonce={focusNonce(row.key)}
				onReset={() => values.resetValue(row.key)}
				badge={{ tone: SOURCE_TONE[source], label: t(`requestPlayground.source.${source}`),
					hint: t(`requestPlayground.sourceHint.${source}`) }}
				extra={<KindToggle value={value} testId={testId(row.key, 'kind')} onToggle={() => values.toggleKind(row.key)} />}
				control={<InputValueControl value={value} isMissing={isMissing} testId={testId(row.key, 'input')}
					isResolving={values.resolvingKeys.includes(row.key)}
					onChange={(text) => values.setText(row.key, text)} />} />
		);
	};

	const renderConnectionRow = (row: Extract<ValueRow, { kind: 'connection' }>) => {
		const field = row.connectionField;
		const isOverridden = values.requestData[field] !== undefined;
		const origin = row.isSecret ? 'secret' : 'connection';
		const value = row.isSecret && !isOverridden
			? SECRET_MASK : readConnectionFieldValue(session.connector, field, values.requestData);
		return (
			<TestValueRow key={row.key} row={row} isEdited={isOverridden} focusNonce={focusNonce(row.key)}
				onReset={() => values.setRequestDataValue(field, undefined)}
				badge={isOverridden
					? { tone: 'info', label: t('requestPlayground.source.edited'), hint: t('requestPlayground.sourceHint.edited') }
					: { tone: row.isSecret ? 'warning' : 'neutral', label: t(`requestPlayground.source.${origin}`),
						hint: t(`requestPlayground.sourceHint.${origin}`) }}
				control={<ConnectionValueControl value={value} isSecret={row.isSecret}
					testId={testId(row.key, 'input')} onChange={(text) => values.setRequestDataValue(field, text)} />} />
		);
	};

	return (
		<div className='rpTabBody' data-testid='request-playground-values'>
			<div className='rpTabIntro rpTabIntro--values'>
				<span className='rpHint'>{t('requestPlayground.values.hint')}</span>
				<PrefillSourceSelect values={values} />
				<Button onClick={values.resetAll} disabled={!values.changedCount} testId='request-playground-reset-all'>
					{t('requestPlayground.values.resetAll')}
				</Button>
			</div>
			{rows.length === 0
				? <div className='rpEmptyNote'>{t('requestPlayground.values.empty')}</div>
				: <div className='rpTable'>
					<div className='rpGridRow rpValueRow rpTableHead'>
						<span>{t('requestPlayground.table.field')}</span>
						<span>{t('requestPlayground.table.value')}</span>
						<span className='rpAlignEnd'>{t('requestPlayground.table.source')}</span>
					</div>
					{VALUE_GROUPS.map((group) => {
						const groupRows = rows.filter((row) => row.group === group);
						if (!groupRows.length) return null;
						return (
							<div key={group} className='rpTableGroup'>
								<div className='rpTableGroupTitle'>
									{t(`requestPlayground.values.groups.${group}`)}
									<span className='rpCount'>{groupRows.length}</span>
								</div>
								{groupRows.map((row) => row.kind === 'input' ? renderInputRow(row) : renderConnectionRow(row))}
							</div>
						);
					})}
				</div>}
		</div>
	);
}
