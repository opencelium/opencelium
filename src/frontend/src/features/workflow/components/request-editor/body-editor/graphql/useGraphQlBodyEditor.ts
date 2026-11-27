import { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useMethodContext } from '../../../../providers/MethodContext';
import { updatePayload } from '../../../../store/connection/connectionSlice';
import { useGraphQlFetcher } from './useGraphQlFetcher';
import { mergeGraphQlFields, toEditorVariables, type GraphQlBodyFields, type GraphQlTabContent } from './graphQlBodyFields';

export function useGraphQlBodyEditor() {
	const { method } = useMethodContext();
	const dispatch = useDispatch();
	const fetcher = useGraphQlFetcher(method);
	const fields = method.request.body?.fields as GraphQlBodyFields | undefined;
	// Read at edit time so a tab change merges into the latest fields without re-creating the callback.
	const fieldsRef = useRef(fields);
	useEffect(() => { fieldsRef.current = fields; }, [fields]);

	const updateBody = useCallback((tab: GraphQlTabContent) => {
		dispatch(updatePayload({ methodId: method.id, newFields: mergeGraphQlFields(fieldsRef.current, tab),
			messageProperty: 'body' }));
	}, [dispatch, method.id]);
	const initialQuery = typeof fields?.query === 'string' ? fields.query : '';
	const initialVariables = toEditorVariables(fields);
	return { fetcher, updateBody, initialQuery, initialVariables };
}
