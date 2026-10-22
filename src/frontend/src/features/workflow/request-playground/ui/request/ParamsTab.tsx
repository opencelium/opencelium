import { useMemo } from 'react';
import { Trans } from 'react-i18next';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { PlaygroundSession } from '../../hooks/usePlaygroundSession';
import { paramRowsOf, readRowOrigin, type EditableRow } from '../../model/requestEdits';
import { EditableRowsTable } from './EditableRowsTable';

export function ParamsTab({ session }: { session: PlaygroundSession }) {
	const { t } = useI18n('workflow');
	const { baseConfig, edits, setEdits, connectionFieldNames } = session;
	const initialRows = useMemo(() => paramRowsOf({ ...baseConfig, url: edits.url ?? baseConfig.url }),
		[baseConfig, edits.url]);
	const rows = edits.paramRows ?? initialRows;

	return (
		<div className='rpTabBody'>
			<span className='rpHint'>
				<Trans ns='workflow' i18nKey='requestPlayground.params.hint' components={{ b: <b /> }} />
			</span>
			<EditableRowsTable rows={rows} testIdPrefix='request-playground-param'
				originOf={(row: EditableRow) => readRowOrigin(row, connectionFieldNames)}
				addLabel={t('requestPlayground.params.add')} emptyText={t('requestPlayground.params.empty')}
				onChange={(paramRows) => setEdits((current) => ({ ...current, paramRows }))} />
		</div>
	);
}
