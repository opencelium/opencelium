import { Switch, Tooltip } from 'antd';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { QueryParam } from '../../../../types/connection';
import { isTemplateRow } from '../urlEditor.utils';
import type { UrlQueryParamsTableProps } from './UrlQueryParamsTable.types';

type Props = Pick<UrlQueryParamsTableProps, 'readOnly' | 'onChangeParam' | 'onRemoveParamRow'> & {
	row: QueryParam;
};

export function UrlQueryParamActions({ row, readOnly, onChangeParam, onRemoveParamRow }: Props) {
	const { t } = useI18n('workflow');
	const disabled = !!readOnly || isTemplateRow(row);
	return <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
		<Tooltip title={t(row.autoEncode === false ? 'methodConfig.queryParams.raw' : 'methodConfig.queryParams.encode')}>
			<Switch size='small' checked={row.autoEncode !== false} disabled={disabled}
				onChange={(autoEncode) => onChangeParam(row.id, { autoEncode })} />
		</Tooltip>
		<Tooltip title={t('methodConfig.queryParams.delete')}>
			<DeleteIconButton iconSize={14} disabled={disabled} onClick={() => onRemoveParamRow(row.id)} />
		</Tooltip>
	</div>;
}
