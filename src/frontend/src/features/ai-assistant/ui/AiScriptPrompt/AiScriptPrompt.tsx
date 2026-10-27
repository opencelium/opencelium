import { useState } from 'react';
import { message } from 'antd';
import type { Enhancement } from '@features/workflow/types/connection';
import { DEFAULT_ENHANCEMENT_SCRIPT } from '@features/workflow/components/request-editor/body-editor/bodyReference';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { Button } from '@shared/ui/primitives/Button';
import { Icon } from '@shared/ui/primitives/Icon';
import { Input } from '@shared/ui/primitives/Input';
import { formatElapsed, useElapsedSeconds } from '../../hooks/useElapsedSeconds';
import { useAiScriptGeneration } from '../../hooks/useAiScriptGeneration';
import './aiScriptPrompt.css';

type Props = {
	enhancement: Enhancement;
	/** What the editor shows now, including edits not yet saved. */
	currentScript: string;
	onApply: (script: string, description: string) => void;
};

const ERROR_KEY = {
	'generation-failed': 'ai.error.generationFailed',
	'unknown-invoker': 'ai.error.generationFailed',
	unreachable: 'ai.error.unreachable',
} as const;

const isUntouched = (script: string) => {
	const trimmed = script.trim().replace(/;$/, '');
	return trimmed === '' || trimmed === DEFAULT_ENHANCEMENT_SCRIPT;
};

/** A prompt row above the script editor: describe the transformation, get a script to run in the playground. */
export function AiScriptPrompt({ enhancement, currentScript, onApply }: Props) {
	const { t } = useI18n('workflow');
	const confirm = useConfirm();
	const [prompt, setPrompt] = useState('');
	const { isAvailable, state, generate, cancel } = useAiScriptGeneration(enhancement);
	const elapsed = useElapsedSeconds(state.status === 'generating' ? state.startedAt : null);
	if (!isAvailable || enhancement.language !== 'js') return null;

	const isGenerating = state.status === 'generating';
	const submit = async () => {
		if (isGenerating || !prompt.trim()) return;
		const result = await generate(prompt.trim(), isUntouched(currentScript) ? '' : currentScript);
		if (!result) return;
		if (!isUntouched(currentScript) && currentScript.trim() !== result.code.trim()) {
			const shouldReplace = await confirm({
				title: t('ai.script.replaceTitle'),
				message: t('ai.script.replaceMessage'),
				confirmText: t('ai.apply.replace'),
				cancelText: t('ai.actions.cancel'),
			});
			if (!shouldReplace) return;
		}
		onApply(result.code, result.description);
		message.success(t('ai.script.applied'));
	};

	return (
		<div className="aiScriptPrompt" data-testid="ai-script-prompt">
			<div className="aiScriptPromptRow">
				<Input value={prompt} disabled={isGenerating} placeholder={t('ai.script.placeholder')} maxLength={2000}
					leftSlot={<Icon name="sparkles" size={14} color="primary" />} testId="ai-script-prompt-input"
					onChange={(event) => setPrompt(event.target.value)}
					onKeyDown={(event) => {
						if (event.key !== 'Enter') return;
						event.preventDefault();
						void submit();
					}} />
				{isGenerating
					? <Button onClick={cancel} testId="ai-script-prompt-cancel">{t('ai.actions.cancel')}</Button>
					: <Button type="primary" onClick={() => void submit()} disabled={!prompt.trim()} testId="ai-script-prompt-generate">
						{t('ai.script.generate')}
					</Button>}
			</div>
			{isGenerating && (
				<div className="aiScriptPromptStatus" role="status">{t('ai.script.generating', { elapsed: formatElapsed(elapsed) })}</div>
			)}
			{state.status === 'done' && state.problems.length > 0 && (
				<div className="aiScriptPromptStatus aiScriptPromptStatus--warning">{t('ai.script.problems')}</div>
			)}
			{state.status === 'error' && (
				<div className="aiScriptPromptStatus aiScriptPromptStatus--error">{t(ERROR_KEY[state.error.failure])}</div>
			)}
		</div>
	);
}
