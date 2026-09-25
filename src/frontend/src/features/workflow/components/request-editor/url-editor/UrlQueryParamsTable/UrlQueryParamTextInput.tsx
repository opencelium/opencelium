import { Input } from 'antd';
import type { Connection, EndpointArg, MethodWithId, QueryParam } from '../../../../types/connection';
import { UrlInlineValueEditor } from '../UrlInlineValueEditor/UrlInlineValueEditor';
import type { QueryParamField, UrlQueryParamsTableProps } from './UrlQueryParamsTable.types';
import { hasArgToken, preventInvalidQueryParamKey, queryParamInputStyle,
	sanitizePastedQueryParam } from './urlQueryParamsTable.utils';
import { sanitizeUrlInputValue } from '../urlEditor.utils';

type Props = Pick<UrlQueryParamsTableProps, 'readOnly' | 'onChangeParam' | 'onCaretChange'> & {
	row: QueryParam;
	field: QueryParamField;
	endpointArgs: Record<string, EndpointArg>;
	connection?: Connection | null;
	currentMethod?: MethodWithId;
};

export function UrlQueryParamTextInput({ row, field, endpointArgs, readOnly, connection,
	currentMethod, onChangeParam, onCaretChange }: Props) {
	const value = row[field] || '';
	const reportCaret = (input: HTMLInputElement | null) => onCaretChange({
		rowId: row.id, field, caret: input?.selectionStart ?? 0,
	});

	if (hasArgToken(value)) {
		return <UrlInlineValueEditor value={value} endpointArgs={endpointArgs} readOnly={readOnly}
			connection={connection} currentMethod={currentMethod}
			onChange={(nextValue) => onChangeParam(row.id, { [field]: nextValue })}
			onCaretChange={(caret) => onCaretChange({ rowId: row.id, field, caret })} />;
	}

	return <Input value={value} disabled={!!readOnly} placeholder={field} size='large'
		onChange={(event) => onChangeParam(row.id, { [field]: sanitizeUrlInputValue(event.target.value) })}
		onFocus={(event) => reportCaret(event.currentTarget)}
		onClick={(event) => reportCaret(event.currentTarget)}
		onKeyUp={(event) => reportCaret(event.currentTarget)}
		onKeyDown={preventInvalidQueryParamKey}
		onPaste={(event) => {
			const original = event.clipboardData?.getData('text/plain') || '';
			const pasted = sanitizePastedQueryParam(original);
			if (pasted === original) return;
			event.preventDefault();
			onChangeParam(row.id, { [field]: sanitizeUrlInputValue(`${value}${pasted}`) });
		}}
		style={queryParamInputStyle} />;
}
