import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { AiTemplateRef } from '../../model/aiGateway.types';

type Props = { templates: AiTemplateRef[]; testId: string };

/** Names the stored templates the model followed, so a familiar-looking result can be traced back. */
export function AiTemplateBasis({ templates, testId }: Props) {
	const { t } = useI18n('workflow');
	if (templates.length === 0) return null;
	const names = templates.map((template) => `"${template.name}"`).join(', ');
	return <div className="aiTemplateNote" data-testid={testId}>{t('ai.templates.basedOn', { count: templates.length, names })}</div>;
}
