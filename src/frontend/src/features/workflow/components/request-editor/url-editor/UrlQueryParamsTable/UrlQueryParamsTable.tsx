import { Checkbox, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { QueryParam } from '../../../../types/connection';
import { isTemplateRow } from '../urlEditor.utils';
import { UrlQueryParamActions } from './UrlQueryParamActions';
import { UrlQueryParamTextInput } from './UrlQueryParamTextInput';
import type { UrlQueryParamsTableProps } from './UrlQueryParamsTable.types';

export function UrlQueryParamsTable({ readOnly, rows, endpointArgs, onToggleEnabled,
	onChangeParam, onRemoveParamRow, onCaretChange }: UrlQueryParamsTableProps) {
	const columns: ColumnsType<QueryParam> = [
		{
			title: 'On', dataIndex: 'enabled', width: 64,
			render: (_, row) => <Checkbox checked={!!row.enabled}
				disabled={!!readOnly || isTemplateRow(row)}
				onChange={(event) => onToggleEnabled(row.id, event.target.checked)} />,
		},
		{
			title: 'Key', dataIndex: 'key',
			render: (_, row) => <UrlQueryParamTextInput row={row} field='key'
				endpointArgs={endpointArgs} readOnly={readOnly}
				onChangeParam={onChangeParam} onCaretChange={onCaretChange} />,
		},
		{
			title: 'Value', dataIndex: 'value',
			render: (_, row) => <UrlQueryParamTextInput row={row} field='value'
				endpointArgs={endpointArgs} readOnly={readOnly}
				onChangeParam={onChangeParam} onCaretChange={onCaretChange} />,
		},
		{
			title: 'Actions', key: 'actions', width: 112, align: 'right',
			render: (_, row) => <UrlQueryParamActions row={row} readOnly={readOnly}
				onChangeParam={onChangeParam} onRemoveParamRow={onRemoveParamRow} />,
		},
	];

	return <div style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 8,
		overflow: 'hidden', background: 'var(--color-background-surface)' }}>
		<Table<QueryParam> rowKey='id' size='small' pagination={false} columns={columns}
			dataSource={rows} tableLayout='fixed' />
	</div>;
}
