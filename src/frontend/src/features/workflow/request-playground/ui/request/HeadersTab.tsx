import { useMemo } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { PlaygroundSession } from '../../hooks/usePlaygroundSession';
import { headerRowsOf, readRowOrigin, type EditableRow } from '../../model/requestEdits';
import { EditableRowsTable, OriginLegend } from './EditableRowsTable';

export function HeadersTab({ session }: { session: PlaygroundSession }) {
	const { t } = useI18n('workflow');
	const { baseConfig, edits, setEdits, connectionFieldNames, fixedHeaders } = session;
	const initialRows = useMemo(() => headerRowsOf(baseConfig), [baseConfig]);
	const rows = edits.headerRows ?? initialRows;

	return (
		<div className='rpTabBody'>
			<OriginLegend origins={['fixed', 'dynamic', 'secret', 'editable']} />
			<EditableRowsTable rows={rows} testIdPrefix='request-playground-header'
				originOf={(row: EditableRow) => readRowOrigin(row, connectionFieldNames, fixedHeaders)}
				addLabel={t('requestPlayground.headers.add')} emptyText={t('requestPlayground.headers.empty')}
				onChange={(headerRows) => setEdits((current) => ({ ...current, headerRows }))} />
		</div>
	);
}
