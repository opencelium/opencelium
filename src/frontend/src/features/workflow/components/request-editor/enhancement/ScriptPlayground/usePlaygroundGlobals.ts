import { useEffect, useState } from 'react';
import { apiExecutor } from '@shared/api/apiExecutor';
import type { GlobalVariable, GlobalVariableListItem, PagedResponse } from '@entities/globalVariable/model/types';
import { toPlaygroundGlobal, type PlaygroundGlobal } from './playgroundGlobals';

const options = { ignoreError: true, skipEntityInvalidation: true };

const isPage = (value: unknown): value is PagedResponse<GlobalVariableListItem> =>
	typeof value === 'object' && value !== null && Array.isArray((value as { content?: unknown }).content);

const isVariable = (value: unknown): value is GlobalVariable =>
	typeof value === 'object' && value !== null && 'kind' in value && 'id' in value;

// References carry names only, so each variable is looked up by name, then loaded for its value or code.
// apiExecutor, not RTK Query: the method dialog runs its own Redux store without the api slice.
async function loadGlobal(name: string): Promise<PlaygroundGlobal> {
	const page: unknown = await apiExecutor({
		url: `/global-variable/all?page=0&size=100&search=${encodeURIComponent(name)}`, method: 'GET', options,
	});
	const item = isPage(page) ? page.content.find((candidate) => candidate.name === name) : undefined;
	if (!item) return toPlaygroundGlobal(name, null);
	const detail: unknown = await apiExecutor({ url: `/global-variable/${item.id}`, method: 'GET', options });
	return toPlaygroundGlobal(name, isVariable(detail) ? detail : null);
}

export function usePlaygroundGlobals(imports: string[]) {
	const key = imports.join(',');
	const [state, setState] = useState<{ key: string; globals: PlaygroundGlobal[] }>({ key: '', globals: [] });

	useEffect(() => {
		if (key === '') return;
		let isCurrent = true;
		void Promise.all(key.split(',').map(loadGlobal)).then((globals) => {
			if (isCurrent) setState({ key, globals });
		});
		return () => {
			isCurrent = false;
		};
	}, [key]);

	const isLoaded = key === '' || state.key === key;
	return { globals: key === '' || !isLoaded ? [] : state.globals, isLoading: !isLoaded };
}
