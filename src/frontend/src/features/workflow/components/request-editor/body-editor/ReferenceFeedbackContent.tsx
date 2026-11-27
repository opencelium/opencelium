import { useI18n } from '@shared/i18n/hooks/useI18n';
import { DocsLink } from '@shared/ui/actions/DocsLink';
import type { ReferencePathFeedback } from './referenceValidation.utils';

type Props = { feedback: ReferencePathFeedback | null | undefined };

/** Tooltip body: the translated problem, then the backend's suggested fix (English only). */
export function ReferenceFeedbackContent({ feedback }: Props) {
	const { t } = useI18n('workflow');
	if (!feedback) return null;
	return (
		<div data-testid="reference-feedback">
			<div>{feedback.message}</div>
			{feedback.hint && <div style={{ marginTop: 4 }}>
				<strong>{t('references.issueHint')}</strong> {feedback.hint}
			</div>}
			<div style={{ marginTop: 4 }}>
				<DocsLink page='concepts/data-mapping' anchor='reference-validation' tone='inherit' testId='reference-feedback-docs'>
					{t('references.validationDocs')}
				</DocsLink>
			</div>
		</div>
	);
}
