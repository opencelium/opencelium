import { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getDynamicCommandTree } from '@shared/command/tree';
import { useCommandPolicyContext } from '@shared/command/useCommandPolicyContext';
import { i18n } from '@shared/i18n/config/i18n';
import { isAiConfigured, useGetAiHealthQuery, useRouteCommandMutation } from '../api/aiApi';
import { toAiGenerationError } from '../utils/aiGenerationError.utils';
import { buildCommandCatalog } from './buildCommandCatalog';
import { type AiCommandProposal, toCatalogItem, toCommandProposal } from './commandProposal';
import type { ResolvedIntent } from './intents/resolveIntent';
import { useCommandSuggestions } from './useCommandSuggestions';

export type AiCommandState =
	| { status: 'idle' }
	| { status: 'routing'; prompt: string; startedAt: number }
	| { status: 'done'; prompt: string; proposal: AiCommandProposal }
	| { status: 'error'; prompt: string; error: 'unreachable' | 'failed' };

const MIN_PROMPT_LENGTH = 3;
const IDLE: AiCommandState = { status: 'idle' };

type Options = {
	/** What is typed in the palette; empty while a scope pill is locked. */
	query: string;
	/** The palette's parser has nothing for the text: the moment to offer the AI. */
	isUnmatched: boolean;
	/** Runs a command as if picked in the palette; used for proposals that may run by themselves. */
	onRun: (phrase: string) => void;
	/** Opens a create flow filled in from the request (see `runIntent`). */
	onRunIntent: (resolved: ResolvedIntent) => void;
};

/**
 * The palette's AI side: commands suggested by meaning while typing, and on request a single command chosen by the
 * model, with its value resolved to a real record. Both only ever see the commands this user may run.
 */
export function useAiCommandAssist({ query, isUnmatched, onRun, onRunIntent }: Options) {
	const isConfigured = isAiConfigured();
	const health = useGetAiHealthQuery(undefined, { skip: !isConfigured });
	const isAvailable = isConfigured && !health.isError && health.data?.status === 'ok';
	const policyContext = useCommandPolicyContext();
	const { pathname } = useLocation();
	const [routeCommand] = useRouteCommandMutation();
	const [state, setState] = useState<AiCommandState>(IDLE);
	// Cancel and a newer request make an older answer stale.
	const requestId = useRef(0);

	const text = query.trim();
	const canAsk = isAvailable && isUnmatched && text.length >= MIN_PROMPT_LENGTH;
	const getCatalog = () =>
		buildCommandCatalog(getDynamicCommandTree(), policyContext, { en: i18n.getFixedT('en'), de: i18n.getFixedT('de') });
	const suggestions = useCommandSuggestions(canAsk ? text : '', getCatalog);

	/** Asks for the typed text, or for `spoken` text that is about to replace it (voice input). */
	const ask = async (spoken?: string) => {
		if (spoken === undefined ? !canAsk : !isAvailable) return;
		const prompt = (spoken ?? text).trim();
		if (!prompt) return;
		const id = ++requestId.current;
		setState({ status: 'routing', prompt, startedAt: Date.now() });
		const catalog = getCatalog();
		try {
			const language = i18n.language.startsWith('de') ? 'de' : 'en';
			const answer = await routeCommand({ prompt, commands: catalog.map(toCatalogItem), page: pathname, language }).unwrap();
			const proposal = await toCommandProposal(answer, catalog);
			if (id !== requestId.current) return;
			if (proposal.kind === 'ready' && proposal.isAutoRun) {
				setState(IDLE);
				onRun(proposal.phrase);
				return;
			}
			if (proposal.kind === 'action') {
				setState(IDLE);
				onRunIntent(proposal.resolved);
				return;
			}
			setState({ status: 'done', prompt, proposal });
		} catch (error) {
			if (id !== requestId.current) return;
			const failure = toAiGenerationError(error);
			setState({ status: 'error', prompt, error: failure.failure === 'unreachable' ? 'unreachable' : 'failed' });
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
	return { canAsk, isVisible, isSpeechAvailable, prompt: text, state: current, suggestions: canAsk ? suggestions : [], ask, reset };
}

export type AiCommandAssist = ReturnType<typeof useAiCommandAssist>;
