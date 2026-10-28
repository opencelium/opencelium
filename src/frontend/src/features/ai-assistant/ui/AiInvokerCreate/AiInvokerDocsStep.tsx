import { useI18n } from '@shared/i18n/hooks/useI18n';
import { FileInput } from '@shared/ui/primitives/FileInput';
import { Hint } from '@shared/ui/primitives/Hint';
import { Input } from '@shared/ui/primitives/Input';
import { Textarea } from '@shared/ui/primitives/Textarea';
import type { AiInvokerCreate } from '../../invoker/useAiInvokerCreate';

const DOCS_ACCEPT = '.json,.yaml,.yml,.txt,.md,.html,.htm,application/json,text/yaml,text/plain,text/html';

/** Where the API docs come from: an OpenAPI file (converted exactly), or any documentation text (read by the AI). */
export function AiInvokerDocsStep({ create }: { create: AiInvokerCreate }) {
	const { t } = useI18n('entities');
	const isBusy = create.state.step === 'drafting';
	const loadFile = async (files: File[] | null) => {
		const [file] = files ?? [];
		if (!file) return;
		create.setDocs(await file.text());
		if (!create.nameHint) create.setNameHint(file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
	};
	return (
		<div className="aiInvokerStep">
			<Hint noPrefix>{t('invoker.list.aiCreate.docsHint')}</Hint>
			<label className="aiInvokerLabel">
				{t('invoker.list.aiCreate.nameLabel')}
				<Input value={create.nameHint} disabled={isBusy} placeholder={t('invoker.list.aiCreate.namePlaceholder')}
					onChange={(event) => create.setNameHint(event.target.value)} testId="ai-invoker-name-hint" />
			</label>
			<div className="aiInvokerLabel">
				{t('invoker.list.aiCreate.fileLabel')}
				<FileInput accept={DOCS_ACCEPT} disabled={isBusy} onChange={(files) => void loadFile(files)} testId="ai-invoker-docs-file" />
			</div>
			<label className="aiInvokerLabel aiInvokerDocs">
				{t('invoker.list.aiCreate.docsLabel')}
				<Textarea value={create.docs} disabled={isBusy} placeholder={t('invoker.list.aiCreate.docsPlaceholder')}
					onChange={(event) => create.setDocs(event.target.value)} testId="ai-invoker-docs" />
			</label>
		</div>
	);
}
