import type { EndpointArg, QueryParam } from '../../../../types/connection';

export type QueryParamField = 'key' | 'value';

export type UrlQueryParamsTableProps = {
	readOnly?: boolean;
	rows: QueryParam[];
	endpointArgs: Record<string, EndpointArg>;
	onToggleEnabled: (id: string, enabled: boolean) => void;
	onChangeParam: (id: string, patch: Partial<QueryParam>) => void;
	onRemoveParamRow: (id: string) => void;
	onCaretChange: (target: { rowId: string; field: QueryParamField; caret: number }) => void;
};
