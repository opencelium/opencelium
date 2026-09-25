import { Switch, Tooltip } from 'antd';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import type { QueryParam } from '../../../../types/connection';
import { isTemplateRow } from '../urlEditor.utils';
import type { UrlQueryParamsTableProps } from './UrlQueryParamsTable.types';

type Props = Pick<UrlQueryParamsTableProps, 'readOnly' | 'onChangeParam' | 'onRemoveParamRow'> & {
	row: QueryParam;
};

export function UrlQueryParamActions({ row, readOnly, onChangeParam, onRemoveParamRow }: Props) {
	const disabled = !!readOnly || isTemplateRow(row);
	return <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
		<Tooltip title={row.autoEncode === false ? 'Send as entered' : 'Encode before sending'}>
			<Switch size='small' checked={row.autoEncode !== false} disabled={disabled}
				onChange={(autoEncode) => onChangeParam(row.id, { autoEncode })} />
		</Tooltip>
		<Tooltip title='Delete param'>
			<DeleteIconButton iconSize={14} disabled={disabled} onClick={() => onRemoveParamRow(row.id)} />
		</Tooltip>
	</div>;
}
