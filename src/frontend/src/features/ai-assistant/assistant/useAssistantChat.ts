import { useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getDynamicCommandTree } from '@shared/command/tree';
import { useCommandPolicyContext } from '@shared/command/useCommandPolicyContext';
import { i18n } from '@shared/i18n/config/i18n';
import { streamHelp } from '../api/helpStream';
import { buildCommandCatalog } from '../command/buildCommandCatalog';
import { toCatalogItem } from '../command/commandProposal';
import type { HelpMessage } from '../model/aiGateway.types';
import { type AssistantTurn, useAssistantStore } from './assistantStore';

// What the gateway reads of the conversation; older turns only cost time.
const SENT_TURNS = 10;

/**
 * Sends a question with the conversation so far and fills the answer in as it streams. The commands it may offer come
 * from the same catalog as the palette, so they are only ever ones this user may run.
 */
export function useAssistantChat() {
	const policyContext = useCommandPolicyContext();
	const { pathname } = useLocation();
	const setTurns = useAssistantStore((state) => state.setTurns);
	const nextId = useRef(1);
	const controller = useRef<AbortController | null>(null);

	const send = useCallback(async (question: string) => {
		const text = question.trim();
		if (!text || controller.current) return;
		const catalog = buildCommandCatalog(getDynamicCommandTree(), policyContext, { en: i18n.getFixedT('en'), de: i18n.getFixedT('de') });
		const history = useAssistantStore.getState().turns
			.filter((turn) => turn.role === 'user' || turn.status === 'done')
			.slice(-SENT_TURNS)
			.map((turn): HelpMessage => ({ role: turn.role, content: turn.text }));
		const answerId = nextId.current + 1;
		setTurns((turns) => [...turns, { id: nextId.current, role: 'user', text },
			{ id: answerId, role: 'assistant', text: '', sources: [], actions: [], status: 'searching' }]);
		nextId.current += 2;
		const update = (change: (turn: Extract<AssistantTurn, { role: 'assistant' }>) => Partial<Extract<AssistantTurn, { role: 'assistant' }>>) =>
			setTurns((turns) => turns.map((turn) => (turn.id === answerId && turn.role === 'assistant' ? { ...turn, ...change(turn) } : turn)));
		const abort = new AbortController();
		controller.current = abort;
		try {
			const events = streamHelp({ language: i18n.language.startsWith('de') ? 'de' : 'en', page: pathname,
				messages: [...history, { role: 'user', content: text }], commands: catalog.map(toCatalogItem) }, abort.signal);
			for await (const event of events) {
				switch (event.type) {
					case 'sources': update(() => ({ sources: event.sources, status: 'writing' })); break;
					case 'delta': update((turn) => ({ text: turn.text + event.text })); break;
					case 'done': update(() => ({ status: 'done', actions: event.commands
						.flatMap((id) => catalog.filter((entry) => entry.id === id))
						.map((entry) => ({ id: entry.id, label: entry.prefix, prefix: entry.prefix })) })); break;
					case 'error': update(() => ({ status: 'error' })); break;
					default: {
						const _exhaustive: never = event;
						return _exhaustive;
					}
				}
			}
			// A stream that ended without its "done" line still finished writing.
			update((turn) => (turn.status === 'searching' || turn.status === 'writing' ? { status: 'done' } : {}));
		} catch {
			if (!abort.signal.aborted) update(() => ({ status: 'error' }));
		} finally {
			if (controller.current === abort) controller.current = null;
		}
	}, [pathname, policyContext, setTurns]);

	/** Stops an answer in progress, e.g. for a new conversation. */
	const stop = useCallback(() => {
		controller.current?.abort();
		controller.current = null;
	}, []);

	return { send, stop };
}
