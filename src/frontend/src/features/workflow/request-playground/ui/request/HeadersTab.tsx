import { useMemo } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { PlaygroundSession } from '../../hooks/usePlaygroundSession';
import type { PlaygroundValues } from '../../hooks/usePlaygroundValues';
import { buildChipInputs } from '../../model/previewRequest';
import { headerRowsOf, readRowOrigin, type EditableRow } from '../../model/requestEdits';
import { EditableRowsTable, OriginLegend } from './EditableRowsTable';
import { HeaderValueCell } from './HeaderValueCell';

type Props = {
	session: PlaygroundSession;
	values: PlaygroundValues;
	missingKeys: string[];
	onSelectInput: (key: string) => void;
};

export function HeadersTab({ session, values, missingKeys, onSelectInput }: Props) {
	const { t } = useI18n('workflow');
	const { baseConfig, edits, setEdits, connectionFieldNames, fixedHeaders, inputs, connector } = session;
	const initialRows = useMemo(() => headerRowsOf(baseConfig), [baseConfig]);
	const rows = edits.headerRows ?? initialRows;
	const previewInputs = buildChipInputs({ inputs, values: values.values, connector, requestData: values.requestData });

	return (
		<div className='rpTabBody'>
			<OriginLegend origins={['fixed', 'dynamic', 'secret', 'editable']} />
			<EditableRowsTable rows={rows} testIdPrefix='request-playground-header'
				originOf={(row: EditableRow) => readRowOrigin(row, connectionFieldNames, fixedHeaders)}
				renderValue={({ row, placeholder, testId, onChange }) => (
					<HeaderValueCell value={row.value} previewInputs={previewInputs} missingKeys={missingKeys}
						placeholder={placeholder} testId={testId} onSelectInput={onSelectInput} onChange={onChange} />
				)}
				addLabel={t('requestPlayground.headers.add')} emptyText={t('requestPlayground.headers.empty')}
				onChange={(headerRows) => setEdits((current) => ({ ...current, headerRows }))} />
		</div>
	);
}
