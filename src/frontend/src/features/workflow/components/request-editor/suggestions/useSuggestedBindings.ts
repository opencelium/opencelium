import { useCallback, useMemo, useState } from 'react';
import { message } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { FieldBindingSuggestion } from '../../../ai/fieldBindingSuggestion.types';
import { useLazyGetFieldBindingSuggestionsQuery } from '../../../ai/fieldBindingSuggestionApi';
import { buildSuggestionRequest, buildTargetPathIndex } from '../../../ai/buildSuggestionRequest';
import { logIteratorScope, logSuggestionRequest, logSuggestionResponse }
	from '../../../ai/suggestionDebug';
import { getEligibleReferenceMethods } from '../reference-generator/referenceGenerator.utils';
import { buildReferenceValue } from '../body-editor/requestReferenceOptions';
import { buildRequestResultField } from '../body-editor/bodyReference';
import { getBodySelectionValue, mergeReferenceValue, setBodySelectionValue } from '../body-editor/bodyValue';
import type { useRequestObjectEditor } from '../shared/useRequestObjectEditor';

type Params = {
	source: Record<string, unknown>;
	editor: ReturnType<typeof useRequestObjectEditor>;
};

export function useSuggestedBindings({ source, editor }: Params) {
	const { t } = useI18n('workflow');
	const { connection, method } = editor;
	const [trigger, { data, isFetching, isError }] = useLazyGetFieldBindingSuggestionsQuery();
	const [dismissed, setDismissed] = useState<string[]>([]);
	const [hasRun, setHasRun] = useState(false);

	const targetPaths = useMemo(() => buildTargetPathIndex(method), [method]);

	/** Suggestions name their source by workflow colour; the panel shows the method itself. */
	const sourceByColor = useMemo(() => new Map(
		getEligibleReferenceMethods(connection, method).map((source) => [source.color, source] as const),
	), [connection, method]);

	/** Leaves that already carry a reference — suggesting over existing work is noise. */
	const boundTargetPaths = useMemo(() => {
		const bound = new Set<string>();
		(connection?.fieldBindings ?? []).forEach((binding) => {
			const resultVar = binding.enhancement?.args?.RESULT_VAR;
			if (typeof resultVar === 'string') bound.add(resultVar);
		});
		return new Set([...targetPaths.values()]
			.filter((entry) => bound.has(
				`${method.color}.(request).${buildRequestResultField('body', entry.namespace, entry.name)}`))
			.map((entry) => entry.path));
	}, [connection, method.color, targetPaths]);

	const openTargetPaths = useMemo(
		() => new Map([...targetPaths].filter(([path]) => !boundTargetPaths.has(path))),
		[boundTargetPaths, targetPaths],
	);

	const suggestions = useMemo(
		() => (data?.suggestions ?? []).filter((suggestion) =>
			!dismissed.includes(suggestion.id) && !boundTargetPaths.has(suggestion.targetPath)),
		[boundTargetPaths, data, dismissed],
	);

	const suggestionRequest = useMemo(
		() => buildSuggestionRequest(connection, method, openTargetPaths),
		[connection, method, openTargetPaths],
	);

	/** What the two sides actually offered, so an empty result can say which side was bare. */
	const stats = useMemo(() => ({
		openFieldCount: suggestionRequest.target.fields.length,
		sourceMethodCount: suggestionRequest.sources.length,
		sourceFieldCount: suggestionRequest.sources
			.reduce((total, source) => total + source.fields.length, 0),
	}), [suggestionRequest]);

	const generate = useCallback(async () => {
		setDismissed([]);
		setHasRun(true);
		logIteratorScope(connection, method);
		logSuggestionRequest(suggestionRequest);
		if (stats.openFieldCount === 0 || stats.sourceFieldCount === 0) return;
		// No toast on failure: RTK Query errors already reach the user through errorBus's
		// notifySubscriber, and the panel renders its own inline message.
		logSuggestionResponse(await trigger(suggestionRequest));
	}, [connection, method, stats, suggestionRequest, trigger]);

	/**
	 * Writes the reference through the editor's own commit pipeline rather than touching the
	 * body directly, so an accepted suggestion becomes an ordinary binding — indistinguishable
	 * from a hand-picked one, and undone by the same history entry.
	 */
	const applyOne = useCallback((suggestion: FieldBindingSuggestion, currentSource: Record<string, unknown>) => {
		const entry = targetPaths.get(suggestion.targetPath);
		if (!entry) return currentSource;
		const reference = buildReferenceValue(suggestion.sourceColor, 'body', suggestion.sourcePath);
		const target = { namespace: entry.namespace, name: entry.name, value: undefined, pathLabel: '' };
		const existingValue = getBodySelectionValue(currentSource, target);
		const nextValue = mergeReferenceValue(existingValue, reference);
		const updated = setBodySelectionValue(currentSource, { ...target, value: existingValue }, nextValue);
		editor.syncSource({
			updated_src: updated,
			existing_src: currentSource,
			namespace: entry.namespace,
			name: entry.name,
			existing_value: existingValue as never,
			new_value: nextValue as never,
		});
		return updated;
	}, [editor, targetPaths]);

	const apply = useCallback((suggestion: FieldBindingSuggestion) => {
		applyOne(suggestion, source);
		setDismissed((current) => [...current, suggestion.id]);
		message.success(t('suggestions.applied'));
	}, [applyOne, source, t]);

	return {
		apply,
		dismiss: (id: string) => setDismissed((current) => [...current, id]),
		generate,
		hasRun,
		/** The request has mappable leaves at all — distinct from all of them being bound. */
		hasFields: targetPaths.size > 0,
		hasTargets: openTargetPaths.size > 0,
		isError,
		isFetching,
		sourceByColor,
		stats,
		suggestions,
	};
}
