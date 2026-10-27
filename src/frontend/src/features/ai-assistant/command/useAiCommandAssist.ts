import { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getDynamicCommandTree } from '@shared/command/tree';
import { useCommandPolicyContext } from '@shared/command/useCommandPolicyContext';
import { i18n } from '@shared/i18n/config/i18n';
import { isAiConfigured, useGetAiHealthQuery, useRouteCommandMutation } from '../api/aiApi';
import { toAiGenerationError } from '../utils/aiGenerationError.utils';
import { buildCommandCatalog } from './buildCommandCatalog';
import { type AiCommandProposal, toCatalogItem, toCommandProposal } from './commandProposal';
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
};

/**
 * The palette's AI side: commands suggested by meaning while typing, and on request a single command chosen by the
 * model, with its value resolved to a real record. Both only ever see the commands this user may run.
 */
export function useAiCommandAssist({ query, isUnmatched }: Options) {
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

	const ask = async () => {
		if (!canAsk) return;
		const prompt = text;
		const id = ++requestId.current;
		setState({ status: 'routing', prompt, startedAt: Date.now() });
		const catalog = getCatalog();
		try {
			const language = i18n.language.startsWith('de') ? 'de' : 'en';
			const answer = await routeCommand({ prompt, commands: catalog.map(toCatalogItem), page: pathname, language }).unwrap();
			const proposal = await toCommandProposal(answer, catalog);
			if (id === requestId.current) setState({ status: 'done', prompt, proposal });
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
	return { canAsk, prompt: text, state: current, suggestions: canAsk ? suggestions : [], ask, reset };
}

export type AiCommandAssist = ReturnType<typeof useAiCommandAssist>;
