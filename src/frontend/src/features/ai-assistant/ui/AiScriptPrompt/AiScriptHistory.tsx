import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import type { ScriptVersion } from '../../hooks/useScriptVersions';

type Props = {
	versions: ScriptVersion[];
	onShow: (id: number) => void;
};

const timeOf = (savedAt: number) =>
	new Date(savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** Earlier scripts of this transformation, newest first; opening one compares it with the editor before restoring. */
export function AiScriptHistory({ versions, onShow }: Props) {
	const { t } = useI18n('workflow');
	return (
		<section className="aiScriptHistory" data-testid="ai-script-history">
			<div className="aiScriptHistoryHint">{t('ai.script.history.hint')}</div>
			<ol className="aiScriptHistoryList">
				{versions.map((version) => (
					<li key={version.id} className="aiScriptHistoryItem">
						<span className="aiScriptHistoryTime">{timeOf(version.savedAt)}</span>
						<span className="aiScriptHistoryReason" title={version.reason.kind === 'before-ai' ? version.reason.prompt : undefined}>
							{version.reason.kind === 'before-ai'
								? t('ai.script.history.beforeAi', { prompt: version.reason.prompt })
								: t('ai.script.history.beforeRestore')}
						</span>
						<Button type="link" onClick={() => onShow(version.id)} testId={`ai-script-history-show-${version.id}`}>
							{t('ai.script.history.compare')}
						</Button>
					</li>
				))}
			</ol>
		</section>
	);
}
