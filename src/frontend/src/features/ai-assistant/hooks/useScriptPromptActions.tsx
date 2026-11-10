import { useEffect, useRef } from 'react';
import { message } from 'antd';
import type { Enhancement } from '@features/workflow/types/connection';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { isUntouchedScript, type ScriptSnapshot } from '../utils/scriptVersions.utils';
import { useAiScriptGeneration } from './useAiScriptGeneration';
import { notifyAiApplied } from '../ui/AiProposal/notifyAiApplied';
import type { ScriptVersions } from './useScriptVersions';

type Options = {
	enhancement: Enhancement;
	current: ScriptSnapshot;
	versions: ScriptVersions;
	onReplace: (next: ScriptSnapshot) => void;
};

const TOAST_KEY = 'ai-script-replaced';

/**
 * A generated script is a candidate to review and apply, even for an empty editor; only a request to Beebot applies it
 * straight away. Every replace keeps the old script as a version and offers Undo.
 */
export function useScriptPromptActions({ enhancement, current, versions, onReplace }: Options) {
	const { t } = useI18n('workflow');
	const generation = useAiScriptGeneration(enhancement);
	// The toast's Undo and an answer that arrives after a long generation must act on what the editor holds by then.
	const latest = useRef({ current, versions, onReplace });
	useEffect(() => {
		latest.current = { current, versions, onReplace };
	});

	const undoQuietly = (): boolean => {
		const next = latest.current.versions.undo(latest.current.current);
		if (!next) return false;
		latest.current.onReplace(next);
		return true;
	};
	const undo = () => {
		if (undoQuietly()) message.success({ key: TOAST_KEY, content: t('ai.script.restored') });
	};
	const replaceWithUndo = (next: ScriptSnapshot | undefined, textKey: 'ai.script.applied' | 'ai.script.restored', isQuiet = false) => {
		if (!next) return;
		latest.current.onReplace(next);
		if (isQuiet) return;
		notifyAiApplied({ key: TOAST_KEY, undoTestId: 'ai-script-undo-toast', text: t(textKey), onUndo: () => undoQuietly() });
	};

	/**
	 * `isApplied`: the user asked for the script to be applied (Beebot), so it goes in at once, Undo kept.
	 * `isQuiet`: asked by voice, so no toast; the panel's own Undo stays.
	 */
	const generate = async (prompt: string, { isApplied = false, isQuiet = false }: { isApplied?: boolean; isQuiet?: boolean } = {}) => {
		const { candidate } = versions;
		const base = candidate?.kind === 'generated' ? candidate.script : isUntouchedScript(current.script) ? '' : current.script;
		const result = await generation.generate(prompt, base);
		if (!result) return;
		const editor = latest.current.current;
		if (isApplied) {
			replaceWithUndo(
				latest.current.versions.applyGenerated(editor, { prompt, script: result.code, description: result.description }),
				'ai.script.applied',
				isQuiet,
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
