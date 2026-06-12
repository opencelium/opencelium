import React from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import { Button, Checkbox, Input, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { EndpointArg, QueryParam } from '../../../types/connection';
import {
	decodeQueryParamValue,
	encodeQueryParamValue,
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

const transformIconStyle: React.CSSProperties = {
	fontSize: 11,
	fontWeight: 600,
	lineHeight: 1,
	whiteSpace: 'nowrap',
};

const TransformIcon: React.FC<{ from: string; to: string }> = ({ from, to }) => (
	<span aria-hidden="true" style={transformIconStyle}>
		{from} → {to}
	</span>
);

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

const getDisplayValue = (value: string) => {
	if (hasArgToken(value || '')) return value || '';

	const decoded = decodeQueryParamValue(value || '');
	return hasArgToken(decoded) ? decoded : value || '';
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
				const displayKey = getDisplayValue(row.key || '');
				if (hasArgToken(displayKey)) {
					return (
						<UrlInlineValueEditor
							value={displayKey}
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
				const displayValue = getDisplayValue(row.value || '');
				if (hasArgToken(displayValue)) {
					return (
						<UrlInlineValueEditor
							value={displayValue}
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
			width: 176,
			align: 'right',
			render: (_, row) => {
				const disabled = !!readOnly || isTemplateRow(row);
				return (
					<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
						<Button
							type="text"
							size="small"
							disabled={disabled}
							aria-label="Encode parameter"
							icon={<TransformIcon from="Aa" to="%" />}
							style={{ width: 48 }}
							onClick={() =>
								onChangeParam(row.id, {
									key: encodeQueryParamValue(row.key || ''),
									value: encodeQueryParamValue(row.value || ''),
								})
							}
						/>
						<Button
							type="text"
							size="small"
							disabled={disabled}
							aria-label="Decode parameter"
							icon={<TransformIcon from="%" to="Aa" />}
							style={{ width: 48 }}
							onClick={() =>
								onChangeParam(row.id, {
									key: decodeQueryParamValue(row.key || ''),
									value: decodeQueryParamValue(row.value || ''),
								})
							}
						/>
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
