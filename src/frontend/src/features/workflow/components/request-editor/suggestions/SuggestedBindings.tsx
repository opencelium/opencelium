import { AppStoreBoundary } from '../../../ai/AppStoreBoundary';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Empty } from '@shared/ui/primitives/Empty';
import { Hint } from '@shared/ui/primitives/Hint';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { Typography } from '@shared/ui/primitives/Typography';
import type { useRequestObjectEditor } from '../shared/useRequestObjectEditor';
import { SuggestedBindingRow } from './SuggestedBindingRow';
import { useSuggestedBindings } from './useSuggestedBindings';
import './suggestedBindings.css';

type Props = {
	source: Record<string, unknown>;
	editor: ReturnType<typeof useRequestObjectEditor>;
	readOnly?: boolean;
};

function SuggestedBindingsContent({ source, editor, readOnly }: Props) {
	const { t } = useI18n('workflow');
	const suggester = useSuggestedBindings({ source, editor });
	const { hasFields, hasRun, hasTargets, isError, isFetching, stats, suggestions } = suggester;

	// An empty panel that does not say which side came up bare is a bug report waiting to
	// happen: the target having no fields, every field already bound, no upstream response
	// schema, and no name in common are four different problems with four different fixes.
	const body = () => {
		if (isFetching) return <div className='wfSuggestionsLoading'><Loading size='sm' /></div>;
		if (!hasFields) return <Empty description={t('suggestions.noFields')} />;
		if (!hasTargets) return <Empty description={t('suggestions.noOpenFields')} />;
		if (stats.sourceFieldCount === 0) return <Empty description={t('suggestions.noSources')} />;
		if (isError) return <Empty description={t('suggestions.failed')} />;
		if (!hasRun) return <Hint noPrefix>{t('suggestions.intro')}</Hint>;
		if (suggestions.length === 0) return <Empty description={t('suggestions.empty', stats)} />;
		return (
			<ul className='wfSuggestionList'>
				{suggestions.map((suggestion) => (
					<SuggestedBindingRow
						key={suggestion.id}
						suggestion={suggestion}
						sourceMethod={suggester.sourceByColor.get(suggestion.sourceColor)}
						onApply={() => suggester.apply(suggestion)}
						onDismiss={() => suggester.dismiss(suggestion.id)}
					/>
				))}
			</ul>
		);
	};

	return (
		<div className='wfSuggestions' data-testid='workflow-suggestions'>
			<div className='wfSuggestionsHeader'>
				<Typography variant='caption' isSubtle>{t('suggestions.reviewHint')}</Typography>
				<div className='wfSuggestionsActions'>
					<Button type='primary' iconLeft='ai' loading={isFetching}
						disabled={readOnly || !hasTargets} onClick={suggester.generate}
						testId='workflow-suggestions-generate'>
						{t(hasRun ? 'suggestions.regenerate' : 'suggestions.generate')}
					</Button>
				</div>
			</div>
			{body()}
		</div>
	);
}

export function SuggestedBindings(props: Props) {
	return (
		<AppStoreBoundary>
			<SuggestedBindingsContent {...props} />
		</AppStoreBoundary>
	);
}
