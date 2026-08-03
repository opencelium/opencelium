import React from 'react';
import { Checkbox, Input, Switch, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import type { EndpointArg, QueryParam } from '../../../types/connection';
import {
	ARG_TOKEN_RE,
	isTemplateRow,
	sanitizePlainTextPaste,
	sanitizeUrlInputValue,
	shouldBlockUrlKeyInput,
} from './urlEditor.utils';
import { UrlInlineValueEditor } from './UrlInlineValueEditor';

type Props = {
	readOnly?: boolean;
	rows: QueryParam[];
	endpointArgs: Record<string, EndpointArg>;
	onToggleEnabled: (id: string, enabled: boolean) => void;
	onChangeParam: (id: string, patch: Partial<QueryParam>) => void;
	onRemoveParamRow: (id: string) => void;
	onCaretChange: (target: {
		rowId: string;
		field: 'key' | 'value';
		caret: number;
	}) => void;
};

const inputStyle: React.CSSProperties = {
	height: 40,
	fontSize: 14,
};

const preventInvalidKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
	if (shouldBlockUrlKeyInput(e.key)) e.preventDefault();
};

const sanitizePastedUrlText = (value: string) =>
	sanitizeUrlInputValue(sanitizePlainTextPaste(value));

const hasArgToken = (value: string) => {
	ARG_TOKEN_RE.lastIndex = 0;
	const result = ARG_TOKEN_RE.test(value || '');
	ARG_TOKEN_RE.lastIndex = 0;
	return result;
};

export const UrlQueryParamsTable: React.FC<Props> = ({
	readOnly,
	rows,
	endpointArgs,
	onToggleEnabled,
	onChangeParam,
	onRemoveParamRow,
	onCaretChange,
}) => {
	const reportInputCaret = (
		rowId: string,
		field: 'key' | 'value',
		input: HTMLInputElement | null,
	) => {
		onCaretChange({
			rowId,
			field,
			caret: input?.selectionStart ?? 0,
		});
	};

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
			render: (_, row) => {
				const key = row.key || '';
				if (hasArgToken(key)) {
					return (
						<UrlInlineValueEditor
							value={key}
							endpointArgs={endpointArgs}
							readOnly={readOnly}
							onChange={(key) => onChangeParam(row.id, { key })}
							onCaretChange={(caret) =>
								onCaretChange({ rowId: row.id, field: 'key', caret })
							}
						/>
					);
				}
				return (
					<Input
						value={row.key ?? ''}
						disabled={!!readOnly}
						placeholder="key"
						size="large"
						onChange={(e) =>
							onChangeParam(row.id, {
								key: sanitizeUrlInputValue(e.target.value),
							})
						}
						onFocus={(e) => reportInputCaret(row.id, 'key', e.currentTarget)}
						onClick={(e) => reportInputCaret(row.id, 'key', e.currentTarget)}
						onKeyUp={(e) => reportInputCaret(row.id, 'key', e.currentTarget)}
						onKeyDown={preventInvalidKey}
						onPaste={(e) => {
							const original = e.clipboardData?.getData('text/plain') || '';
							const pasted = sanitizePastedUrlText(original);
							if (pasted === original) return;
							e.preventDefault();
							onChangeParam(row.id, {
								key: sanitizeUrlInputValue(`${row.key ?? ''}${pasted}`),
							});
						}}
						style={inputStyle}
					/>
				);
			},
		},
		{
			title: 'Value',
			dataIndex: 'value',
			render: (_, row) => {
				const value = row.value || '';
				if (hasArgToken(value)) {
					return (
						<UrlInlineValueEditor
							value={value}
							endpointArgs={endpointArgs}
							readOnly={readOnly}
							onChange={(value) => onChangeParam(row.id, { value })}
							onCaretChange={(caret) =>
								onCaretChange({ rowId: row.id, field: 'value', caret })
							}
						/>
					);
				}
				return (
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
						onFocus={(e) => reportInputCaret(row.id, 'value', e.currentTarget)}
						onClick={(e) => reportInputCaret(row.id, 'value', e.currentTarget)}
						onKeyUp={(e) => reportInputCaret(row.id, 'value', e.currentTarget)}
						onKeyDown={preventInvalidKey}
						onPaste={(e) => {
							const original = e.clipboardData?.getData('text/plain') || '';
							const pasted = sanitizePastedUrlText(original);
							if (pasted === original) return;
							e.preventDefault();
							onChangeParam(row.id, {
								value: sanitizeUrlInputValue(`${row.value ?? ''}${pasted}`),
							});
						}}
						style={inputStyle}
					/>
				);
			},
		},
		{
			title: 'Actions',
			key: 'actions',
			width: 112,
			align: 'right',
			render: (_, row) => {
				const disabled = !!readOnly || isTemplateRow(row);
				return (
					<div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
						<Tooltip title={row.autoEncode === false ? 'Send as entered' : 'Encode before sending'}>
							<Switch
								size="small"
								checked={row.autoEncode !== false}
								disabled={disabled}
								onChange={(autoEncode) => onChangeParam(row.id, { autoEncode })}
							/>
						</Tooltip>
						<Tooltip title="Delete param">
							<DeleteIconButton
								iconSize={14}
								disabled={disabled}
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
				border: '1px solid var(--color-border-subtle)',
				borderRadius: 8,
				overflow: 'hidden',
				background: 'var(--color-background-surface)',
			}}
		>
			<Table<QueryParam>
				rowKey="id"
				size="small"
				pagination={false}
				columns={columns}
				dataSource={rows}
				tableLayout="fixed"
			/>
		</div>
	);
};
