import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { QueryParam } from '../../../types/connection';
import { ensureTemplateRow } from './urlEditor.utils';

type Params = {
	queryParams: QueryParam[];
	setQueryParams: Dispatch<SetStateAction<QueryParam[]>>;
	commitParamsToEndpoint: (params: QueryParam[]) => void;
};

export function useUrlQueryParams({ queryParams, setQueryParams, commitParamsToEndpoint }: Params) {
	const onChangeParam = useCallback((id: string, patch: Partial<QueryParam>) => {
		let next = queryParams.map((param) => param.id === id ? { ...param, ...patch } : param);
		const index = next.findIndex((param) => param.id === id);
		if (index >= 0) {
			const row = next[index];
			const becameNonEmpty = (row.key || '').trim() !== '' || (row.value || '').trim() !== '';
			const previous = queryParams[index];
			const wasTemplate = previous && !previous.enabled
				&& (previous.key || '').trim() === '' && (previous.value || '').trim() === '';
			if (wasTemplate && becameNonEmpty) next[index] = { ...row, enabled: true };
		}
		next = ensureTemplateRow(next);
		setQueryParams(next);
		commitParamsToEndpoint(next);
	}, [commitParamsToEndpoint, queryParams, setQueryParams]);

	const onToggleEnabled = useCallback((id: string, enabled: boolean) =>
		onChangeParam(id, { enabled }), [onChangeParam]);

	const removeParamRow = useCallback((id: string) => {
		const next = ensureTemplateRow(queryParams.filter((param) => param.id !== id));
		setQueryParams(next);
		commitParamsToEndpoint(next);
	}, [commitParamsToEndpoint, queryParams, setQueryParams]);

	return { onChangeParam, onToggleEnabled, removeParamRow };
}
