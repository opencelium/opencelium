import { useState } from 'react';
import type { Enhancement } from '@features/workflow/types/connection';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Icon } from '@shared/ui/primitives/Icon';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Input } from '@shared/ui/primitives/Input';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { formatElapsed, useElapsedSeconds } from '../../hooks/useElapsedSeconds';
import { useScriptPromptActions } from '../../hooks/useScriptPromptActions';
import type { ScriptVersions } from '../../hooks/useScriptVersions';
import type { ScriptSnapshot } from '../../utils/scriptVersions.utils';
import { AiScriptHistory } from './AiScriptHistory';
import { AiScriptProposal } from './AiScriptProposal';
import './aiScriptPrompt.css';

type Props = {
	enhancement: Enhancement;
	/** What the editor shows now, including edits not yet saved. */
	current: ScriptSnapshot;
	versions: ScriptVersions;
	onReplace: (next: ScriptSnapshot) => void;
	isPlaygroundOpen: boolean;
	onOpenPlayground?: () => void;
};

const ERROR_KEY = {
	'generation-failed': 'ai.error.generationFailed',
	'unknown-invoker': 'ai.error.generationFailed',
	unreachable: 'ai.error.unreachable',
} as const;

/** A prompt row above the script editor: describe the transformation, compare the answer with the script, apply it. */
export function AiScriptPrompt({ enhancement, current, versions, onReplace, isPlaygroundOpen, onOpenPlayground }: Props) {
	const { t } = useI18n('workflow');
	const [prompt, setPrompt] = useState('');
	const [isHistoryOpen, setIsHistoryOpen] = useState(false);
	const { generation, generate, accept, undo } = useScriptPromptActions({ enhancement, current, versions, onReplace });
	const { state } = generation;
	const elapsed = useElapsedSeconds(state.status === 'generating' ? state.startedAt : null);
	if (!generation.isAvailable || enhancement.language !== 'js') return null;

	const isGenerating = state.status === 'generating';
	const hasVersions = versions.versions.length > 0;
	const submit = () => {
		if (!isGenerating && prompt.trim()) void generate(prompt.trim());
	};

	return (
		<div className="aiScriptPrompt" data-testid="ai-script-prompt">
			<div className="aiScriptPromptRow">
				<Input value={prompt} disabled={isGenerating} maxLength={2000} testId="ai-script-prompt-input"
					placeholder={t(versions.candidate?.kind === 'generated' ? 'ai.script.refinePlaceholder' : 'ai.script.placeholder')}
					leftSlot={<Icon name="sparkles" size={14} color="primary" />}
					onChange={(event) => setPrompt(event.target.value)}
					onKeyDown={(event) => {
						if (event.key !== 'Enter') return;
						event.preventDefault();
						submit();
					}} />
				{isGenerating
					? <Button onClick={generation.cancel} testId="ai-script-prompt-cancel">{t('ai.actions.cancel')}</Button>
					: <Button type="primary" onClick={submit} disabled={!prompt.trim()} testId="ai-script-prompt-generate">
						{t('ai.script.generate')}
					</Button>}
				{hasVersions && (
					<>
						<Tooltip content={t('ai.script.undoTooltip')}>
							<IconButton type="text" size="sm" disabled={isGenerating} testId="ai-script-undo"
								iconProps={{ name: 'undo', color: 'inherit' }} onClick={undo} />
						</Tooltip>
						<Tooltip content={t('ai.script.history.tooltip', { count: versions.versions.length })}>
							<IconButton type="text" size="sm" testId="ai-script-history-toggle"
								className={isHistoryOpen ? 'aiScriptPromptAction--active' : undefined}
								iconProps={{ name: 'history', color: isHistoryOpen ? 'primary' : 'inherit' }}
								onClick={() => setIsHistoryOpen((isOpen) => !isOpen)} />
						</Tooltip>
					</>
				)}
			</div>
			{isGenerating && (
				<div className="aiScriptPromptStatus" role="status">{t('ai.script.generating', { elapsed: formatElapsed(elapsed) })}</div>
			)}
			{state.status === 'done' && !versions.candidate && state.problems.length > 0 && (
				<div className="aiScriptPromptStatus aiScriptPromptStatus--warning">{t('ai.script.problems')}</div>
			)}
			{state.status === 'error' && (
				<div className="aiScriptPromptStatus aiScriptPromptStatus--error">{t(ERROR_KEY[state.error.failure])}</div>
			)}
			{isHistoryOpen && hasVersions && (
				<AiScriptHistory versions={versions.versions} onShow={(id) => {
					versions.showVersion(id);
					setIsHistoryOpen(false);
				}} />
			)}
			{versions.candidate && (
				<AiScriptProposal candidate={versions.candidate} currentScript={current.script} isPlaygroundOpen={isPlaygroundOpen}
					onOpenPlayground={onOpenPlayground} onAccept={accept} onDiscard={versions.discard} />
			)}
		</div>
	);
}
