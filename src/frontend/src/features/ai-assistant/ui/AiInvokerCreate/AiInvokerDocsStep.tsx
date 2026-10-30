import { useI18n } from '@shared/i18n/hooks/useI18n';
import { notifyError } from '@shared/ui/feedback/notifyError';
import { Dropzone } from '@shared/ui/primitives/DropZone/DropZone';
import { Hint } from '@shared/ui/primitives/Hint';
import { Icon } from '@shared/ui/primitives/Icon';
import { Input } from '@shared/ui/primitives/Input';
import { Textarea } from '@shared/ui/primitives/Textarea';
import type { AiInvokerCreate } from '../../invoker/useAiInvokerCreate';

const DOCS_EXTENSIONS = ['.json', '.yaml', '.yml', '.txt', '.md', '.html', '.htm'];
const DOCS_ACCEPT = [...DOCS_EXTENSIONS, 'application/json', 'text/yaml', 'text/plain', 'text/html'].join(',');

/** Where the API docs come from: an OpenAPI file (converted exactly), or any documentation text (read by the AI). */
export function AiInvokerDocsStep({ create }: { create: AiInvokerCreate }) {
	const { t } = useI18n('entities');
	const isBusy = create.state.step === 'drafting';
	// Drag-and-drop bypasses the Dropzone's `accept` filter, so the extension is checked here too.
	const loadFile = async (files: File[]) => {
		const [file] = files;
		// The Dropzone's own file row was removed: its text goes with it.
		if (!file) {
			create.setDocs('');
			return;
		}
		if (!DOCS_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension))) {
			notifyError(t('invoker.list.aiCreate.fileInvalidType'));
			return;
		}
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
				<Dropzone accept={DOCS_ACCEPT} disabled={isBusy} onFiles={(files) => void loadFile(files)} testId="ai-invoker-docs-file"
					content={(
						<div className="aiInvokerDrop">
							<span className="aiInvokerDropAction">
								<Icon name="upload" size={16} color="inherit" />
								{t('invoker.list.aiCreate.fileUpload')}
							</span>
							<span className="aiInvokerDropHint">{t('invoker.list.aiCreate.fileDrop')}</span>
						</div>
					)} />
			</div>
			<label className="aiInvokerLabel aiInvokerDocs">
				{t('invoker.list.aiCreate.docsLabel')}
				<Textarea value={create.docs} disabled={isBusy} placeholder={t('invoker.list.aiCreate.docsPlaceholder')}
					onChange={(event) => create.setDocs(event.target.value)} testId="ai-invoker-docs" />
			</label>
		</div>
	);
}
