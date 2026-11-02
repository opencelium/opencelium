import { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getDynamicCommandTree } from '@shared/command/tree';
import { useCommandPolicyContext } from '@shared/command/useCommandPolicyContext';
import { i18n } from '@shared/i18n/config/i18n';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge';
import { askWorkflowEditor } from '../editor/askWorkflowEditor';
import type { ConfirmEdit } from '../editor/addMethodFromRequest';
import { isAiConfigured, useGetAiHealthQuery, useRouteCommandMutation } from '../api/aiApi';
import { toAiGenerationError } from '../utils/aiGenerationError.utils';
import { buildCommandCatalog } from './buildCommandCatalog';
import { type AiCommandProposal, toCatalogItem, toCommandProposal } from './commandProposal';
import type { ResolvedIntent } from './intents/resolveIntent';
import { pageContextOf } from './intents/pageContext';
import { useCommandSuggestions } from './useCommandSuggestions';

export type AiCommandState =
	| { status: 'idle' }
	| { status: 'routing'; prompt: string; startedAt: number }
	| { status: 'done'; prompt: string; proposal: AiCommandProposal; isQuestion: boolean }
	| { status: 'error'; prompt: string; error: 'unreachable' | 'failed' };

/**
 * How a request ended: `done` — acted on (a command ran, a create flow or a guide opened); `answer` — an answer waits in
 * the palette for the user; `error` — the AI failed; `skipped` — not asked (AI unavailable, empty, or superseded).
 */
export type AskOutcome =
	| { kind: 'done' }
	| { kind: 'answer' }
	| { kind: 'error'; error: 'unreachable' | 'failed' }
	| { kind: 'skipped' };

const MIN_PROMPT_LENGTH = 3;
const IDLE: AiCommandState = { status: 'idle' };

type Options = {
	/** What is typed in the palette; empty while a scope pill is locked. */
	query: string;
	/** The palette's parser has nothing for the text: the moment to offer the AI. */
	isUnmatched: boolean;
	/** Runs a command as if picked in the palette; used for proposals that may run by themselves. `isAddressed`: asked of
	 * the assistant by name, without the palette open. */
	onRun: (phrase: string, isAddressed: boolean) => void;
	/** Opens a create flow filled in from the request (see `runIntent`). */
	onRunIntent: (resolved: ResolvedIntent) => void;
	/** The workflow editor took the request over (a guide, an added method); the palette steps aside. */
	onGuide: () => void;
};

/**
 * The palette's AI side: commands suggested by meaning while typing, and on request a single command chosen by the
 * model, with its value resolved to a real record. Both only ever see the commands this user may run.
 */
export function useAiCommandAssist({ query, isUnmatched, onRun, onRunIntent, onGuide }: Options) {
	const isConfigured = isAiConfigured();
	const health = useGetAiHealthQuery(undefined, { skip: !isConfigured });
	const isAvailable = isConfigured && !health.isError && health.data?.status === 'ok';
	const policyContext = useCommandPolicyContext();
	const { pathname } = useLocation();
	const [routeCommand] = useRouteCommandMutation();
	const [state, setState] = useState<AiCommandState>(IDLE);
	const confirm = useConfirm();
	const { t: tCommon } = useI18n('common');
	const confirmEdit: ConfirmEdit = ({ method, connector }) => confirm({
		title: tCommon('commandPalette.workflowEdit.confirm.title'),
		message: tCommon('commandPalette.workflowEdit.confirm.message', { method, connector }),
	});
	// Cancel and a newer request make an older answer stale.
	const requestId = useRef(0);

	const text = query.trim();
	const canAsk = isAvailable && isUnmatched && text.length >= MIN_PROMPT_LENGTH;
	const getCatalog = () =>
		buildCommandCatalog(getDynamicCommandTree(), policyContext, { en: i18n.getFixedT('en'), de: i18n.getFixedT('de') });
	const suggestions = useCommandSuggestions(canAsk ? text : '', getCatalog);

	/**
	 * Asks for the typed text, or for `spoken` text that is about to replace it (voice input).
	 * `isAddressed`: said to the always-listening assistant by name, which is the user's go-ahead,
	 * so a proposed command runs at once instead of waiting to be confirmed — unless it deletes.
	 */
	const ask = async (spoken?: string, { isAddressed = false }: { isAddressed?: boolean } = {}): Promise<AskOutcome> => {
		const SKIPPED: AskOutcome = { kind: 'skipped' };
		if (spoken === undefined ? !canAsk : !isAvailable) return SKIPPED;
		const prompt = (spoken ?? text).trim();
		if (!prompt) return SKIPPED;
		const id = ++requestId.current;
		setState({ status: 'routing', prompt, startedAt: Date.now() });
		// In the editor, "where is the header of getCustomers?" and "add get all users from CRM" are answered by the
		// workflow itself. Asked first: the command router reads "where" as a question and cannot edit the workflow.
		// Only a request said to the assistant by name changes the workflow without asking.
		if (workflowCommandBridgeStore.getState().isActive
			&& await askWorkflowEditor(prompt, isAddressed ? undefined : confirmEdit) === 'handled') {
			if (id !== requestId.current) return SKIPPED;
			setState(IDLE);
			onGuide();
			return { kind: 'done' };
		}
		if (id !== requestId.current) return SKIPPED;
		const catalog = getCatalog();
		try {
			const language = i18n.language.startsWith('de') ? 'de' : 'en';
			const answer = await routeCommand({ prompt, commands: catalog.map(toCatalogItem), page: pathname, language }).unwrap();
			const proposal = await toCommandProposal(answer, catalog, pageContextOf(pathname));
			if (id !== requestId.current) return SKIPPED;
			// "How do I open the schedules?" asks to be told, not taken there: nothing runs by itself for a question.
			const isQuestion = answer.isQuestion === true;
			if (!isQuestion && proposal.kind === 'ready'
				&& (proposal.isAutoRun || (isAddressed && proposal.entry.effect !== 'destructive'))) {
				setState(IDLE);
				onRun(proposal.phrase, isAddressed);
				return { kind: 'done' };
			}
			if (!isQuestion && proposal.kind === 'action') {
				setState(IDLE);
				onRunIntent(proposal.resolved);
				return { kind: 'done' };
			}
			setState({ status: 'done', prompt, proposal, isQuestion });
			return { kind: 'answer' };
		} catch (error) {
			if (id !== requestId.current) return SKIPPED;
			const failure = toAiGenerationError(error).failure === 'unreachable' ? 'unreachable' : 'failed';
			setState({ status: 'error', prompt, error: failure });
			return { kind: 'error', error: failure };
		}
	};

	const reset = () => {
		requestId.current += 1;
		setState(IDLE);
	};

	// An answer belongs to the text it was asked for; typing on makes it stale.
	const current = state.status !== 'idle' && state.prompt === text ? state : IDLE;
	// A spoken request is shown even when the parser could place the text: the user asked the AI, not the parser.
	const isVisible = canAsk || current.status !== 'idle';
	const isSpeechAvailable = isAvailable && Boolean(health.data?.speech?.available);
	return { canAsk, isAvailable, isVisible, isSpeechAvailable, prompt: text, state: current, suggestions: canAsk ? suggestions : [], ask, reset };
}

export type AiCommandAssist = ReturnType<typeof useAiCommandAssist>;
