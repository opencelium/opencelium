import { useEffect, useRef } from 'react';
import { Button as AntButton, message } from 'antd';
import type { Enhancement } from '@features/workflow/types/connection';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { isUntouchedScript, type ScriptSnapshot } from '../utils/scriptVersions.utils';
import { useAiScriptGeneration } from './useAiScriptGeneration';
import type { ScriptVersions } from './useScriptVersions';

type Options = {
	enhancement: Enhancement;
	current: ScriptSnapshot;
	versions: ScriptVersions;
	onReplace: (next: ScriptSnapshot) => void;
};

const TOAST_KEY = 'ai-script-replaced';

/**
 * A generated script for an empty editor goes straight in; otherwise it becomes a candidate to compare. Every replace
 * keeps the old script as a version and offers Undo.
 */
export function useScriptPromptActions({ enhancement, current, versions, onReplace }: Options) {
	const { t } = useI18n('workflow');
	const generation = useAiScriptGeneration(enhancement);
	// The toast's Undo and an answer that arrives after a long generation must act on what the editor holds by then.
	const latest = useRef({ current, versions, onReplace });
	useEffect(() => {
		latest.current = { current, versions, onReplace };
	});

	const undo = () => {
		const next = latest.current.versions.undo(latest.current.current);
		if (!next) return;
		latest.current.onReplace(next);
		message.success({ key: TOAST_KEY, content: t('ai.script.restored') });
	};
	const replaceWithUndo = (next: ScriptSnapshot | undefined, textKey: 'ai.script.applied' | 'ai.script.restored') => {
		if (!next) return;
		latest.current.onReplace(next);
		message.success({
			key: TOAST_KEY,
			content: (
				<span>
					{t(textKey)}{' '}
					{/* The static message renders outside the app's providers, where the Button primitive cannot resolve its UI kit. */}
					<AntButton type="link" size="small" data-testid="ai-script-undo-toast"
						onClick={() => { message.destroy(TOAST_KEY); undo(); }}>
						{t('ai.script.undo')}
					</AntButton>
				</span>
			),
		});
	};

	const generate = async (prompt: string) => {
		const { candidate } = versions;
		const base = candidate?.kind === 'generated' ? candidate.script : isUntouchedScript(current.script) ? '' : current.script;
		const result = await generation.generate(prompt, base);
		if (!result) return;
		const editor = latest.current.current;
		if (isUntouchedScript(editor.script)) {
			replaceWithUndo(
				latest.current.versions.applyGenerated(editor, { prompt, script: result.code, description: result.description }),
				'ai.script.applied',
			);
			return;
		}
		latest.current.versions.propose({
			kind: 'generated', prompt, script: result.code, description: result.description, problems: result.problems,
		});
	};

	const accept = () => {
		const { candidate } = versions;
		replaceWithUndo(versions.accept(current), candidate?.kind === 'version' ? 'ai.script.restored' : 'ai.script.applied');
	};

	return { generation, generate, accept, undo };
}
