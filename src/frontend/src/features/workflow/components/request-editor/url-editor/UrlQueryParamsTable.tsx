import React from 'react';
import { DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Checkbox, Input, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { EndpointArg, QueryParam } from '../../../types/connection';
import { InlineValueEditor } from './InlineValueEditor';
import type { CreateArgTokenResult } from './InlineValueEditor';
import {
	hasAnyTokenInString,
	isTemplateRow,
	sanitizePlainTextPaste,
	sanitizeUrlInputValue,
	shouldBlockUrlKeyInput,
} from './urlEditor.utils';

type Props = {
	readOnly?: boolean;
	rows: QueryParam[];
	endpointArgs: Record<string, EndpointArg>;
	onToggleEnabled: (id: string, enabled: boolean) => void;
	onChangeParam: (id: string, patch: Partial<QueryParam>) => void;
	onDeleteParamRefArgId: (argId: string, nextValue: string) => void;
	onOpenParamDialog: (id: string) => void;
	onRemoveParamRow: (id: string) => void;
	createArgToken: (sourceRefRaw: string) => CreateArgTokenResult;
};

const inputStyle: React.CSSProperties = {
	height: 40,
	fontSize: 14,
};

const preventInvalidKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
	if (shouldBlockUrlKeyInput(e.key)) e.preventDefault();
};

export const UrlQueryParamsTable: React.FC<Props> = ({
	readOnly,
	rows,
	endpointArgs,
	onToggleEnabled,
	onChangeParam,
	onDeleteParamRefArgId,
	onOpenParamDialog,
	onRemoveParamRow,
	createArgToken,
}) => {
	const columns: ColumnsType<QueryParam> = [
		{
			title: 'On',
			dataIndex: 'enabled',
			width: 64,
			render: (_, row) => {
				const disabled = !!readOnly || isTemplateRow(row);
				return (
					<Checkbox
						checked={!!row.enabled}
						disabled={disabled}
						onChange={(e) => onToggleEnabled(row.id, e.target.checked)}
					/>
				);
			},
		},
		{
			title: 'Key',
			dataIndex: 'key',
			render: (_, row) => (
				<Input
					value={row.key ?? ''}
					disabled={!!readOnly}
					placeholder="key"
					size="large"
					onChange={(e) =>
						onChangeParam(row.id, { key: sanitizeUrlInputValue(e.target.value) })
					}
					onKeyDown={preventInvalidKey}
					onPaste={(e) => {
						const original = e.clipboardData?.getData('text/plain') || '';
						const pasted = sanitizeUrlInputValue(sanitizePlainTextPaste(original));
						if (pasted === original) return;
						e.preventDefault();
						onChangeParam(row.id, {
							key: sanitizeUrlInputValue(`${row.key ?? ''}${pasted}`),
						});
					}}
					style={inputStyle}
				/>
			),
		},
		{
			title: 'Value',
			dataIndex: 'value',
			render: (_, row) =>
				hasAnyTokenInString(row.value || '') ? (
					<InlineValueEditor
						value={row.value || ''}
						endpointArgs={endpointArgs}
						readOnly={readOnly}
						lockWhenHasToken
						tokensView="pills"
						minHeight={40}
						onChange={(nextRaw) => onChangeParam(row.id, { value: nextRaw })}
						onDeleteToken={onDeleteParamRefArgId}
						createArgToken={createArgToken}
					/>
				) : (
					<Input
						value={row.value ?? ''}
						disabled={!!readOnly}
						placeholder="value"
						size="large"
						onChange={(e) =>
							onChangeParam(row.id, {
								value: sanitizeUrlInputValue(e.target.value),
							})
						}
						onKeyDown={preventInvalidKey}
						onPaste={(e) => {
							const original = e.clipboardData?.getData('text/plain') || '';
							const pasted = sanitizeUrlInputValue(sanitizePlainTextPaste(original));
							if (pasted === original) return;
							e.preventDefault();
							onChangeParam(row.id, {
								value: sanitizeUrlInputValue(`${row.value ?? ''}${pasted}`),
							});
						}}
						style={inputStyle}
					/>
				),
		},
		{
			title: 'Actions',
			key: 'actions',
			width: 112,
			align: 'right',
			render: (_, row) => {
				const disabled = !!readOnly || isTemplateRow(row);
				return (
					<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
						<Tooltip title="Open param dialog">
							<Button
								type="text"
								size="small"
								disabled={disabled}
								icon={<SettingOutlined />}
								onClick={() => onOpenParamDialog(row.id)}
							/>
						</Tooltip>
						<Tooltip title="Delete param">
							<Button
								type="text"
								size="small"
								disabled={disabled}
								icon={<DeleteOutlined />}
								onClick={() => onRemoveParamRow(row.id)}
							/>
						</Tooltip>
					</div>
				);
			},
		},
	];

	return (
		<div
			style={{
				border: '1px solid #f0f0f0',
				borderRadius: 12,
				overflow: 'hidden',
				background: '#fff',
			}}
		>
			<Table<QueryParam>
				rowKey="id"
				size="small"
				pagination={false}
				columns={columns}
				dataSource={rows}
				tableLayout="fixed"
				scroll={{ x: 'max-content' }}
			/>
		</div>
	);
};
