import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { store as appStore } from '@app/store/store';
import { removeDeletedRequestBindings, updateRequestFieldBindings } from '@features/workflow/components/request-editor/body-editor/bodyBinding';
import { updateConnection, updatePayload } from '@features/workflow/store/connection/connectionSlice';
import type { Connection, MethodWithId } from '@features/workflow/types/connection';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { aiApi } from '../api/aiApi';
import type { SuggestMappingResponse } from '../model/aiGateway.types';
import { type MappingSource, type MappingTarget, collectMappingSources, collectMappingTargets, setTargetValue } from './mappingCandidates';

/** One proposed value for one body field, ready to apply. */
export type FieldMappingProposal = { target: MappingTarget; source: MappingSource; reason: string };

export type AiFieldMappingState =
	| { status: 'idle' }
	| { status: 'suggesting' }
	| { status: 'nothingToMap' }
	| { status: 'suggested'; proposals: FieldMappingProposal[]; chosen: ReadonlySet<string> }
	| { status: 'error' };

type Params = { connection: Connection | null; method: MethodWithId; body: unknown };

/** The body with the proposals' references in place, and the bindings the JSON editor would keep for them. */
export function applyProposals(connection: Connection, method: MethodWithId, body: unknown, proposals: FieldMappingProposal[]) {
	let nextBody = body;
	let next = connection;
	for (const { target, source } of proposals) {
		nextBody = setTargetValue(nextBody, target, source.reference);
		next = updateRequestFieldBindings(next, method.color, 'body', { namespace: target.namespace, name: target.name, newValue: source.reference });
	}
	return { body: nextBody, fieldBindings: removeDeletedRequestBindings(next, method.color, 'body', nextBody).fieldBindings };
}

/**
 * AI field mapping inside the body editor. The suggestion request goes to the app store explicitly: the editor runs in
 * the method dialog's own legacy store, which has no RTK Query middleware. Applying writes into that legacy store the
 * way the JSON editor does (body, then the reference bindings), so saving, undo and the reference list treat the
 * result like a manual edit.
 */
export function useAiFieldMapping({ connection, method, body }: Params) {
	const { lang } = useI18n('workflow');
	const dispatch = useDispatch();
	const [state, setState] = useState<AiFieldMappingState>({ status: 'idle' });
	const [instruction, setInstruction] = useState('');

	const suggest = async () => {
		if (!connection) return;
		const sources = collectMappingSources(connection, method);
		const targets = collectMappingTargets(body);
		if (sources.length === 0 || targets.length === 0) {
			setState({ status: 'nothingToMap' });
			return;
		}
		setState({ status: 'suggesting' });
		try {
			const response: SuggestMappingResponse = await appStore.dispatch(aiApi.endpoints.suggestMapping.initiate({
				language: lang.startsWith('de') ? 'de' : 'en',
				instruction: instruction.trim(),
				target: { step: method.label || method.name, operation: method.name, system: method.connector?.title ?? '',
					fields: targets.map(({ path, current }) => ({ path, current })) },
				sources: sources.map(({ id, step, system, path }) => ({ id, step, system, path })),
			})).unwrap();
			const proposals = response.suggestions.flatMap((suggestion): FieldMappingProposal[] => {
				const target = targets.find((candidate) => candidate.path === suggestion.field);
				const source = sources.find((candidate) => candidate.id === suggestion.source);
				return target && source ? [{ target, source, reason: suggestion.reason }] : [];
			});
			// Empty fields are picked by default; replacing a value the user set is an explicit choice.
			const chosen = new Set(proposals.filter((proposal) => !proposal.target.current.trim()).map((proposal) => proposal.target.path));
			setState({ status: 'suggested', proposals, chosen });
		} catch {
			setState({ status: 'error' });
		}
	};

	const toggle = (path: string, isOn: boolean) => setState((current) => {
		if (current.status !== 'suggested') return current;
		const chosen = new Set(current.chosen);
		if (isOn) chosen.add(path);
		else chosen.delete(path);
		return { ...current, chosen };
	});

	const apply = () => {
		if (state.status !== 'suggested' || !connection) return 0;
		const applied = state.proposals.filter((proposal) => state.chosen.has(proposal.target.path));
		const next = applyProposals(connection, method, body, applied);
		dispatch(updatePayload({ methodId: method.id, newFields: next.body, messageProperty: 'body' } as never));
		dispatch(updateConnection({ fieldBindings: next.fieldBindings } as never));
		setState({ status: 'idle' });
		return applied.length;
	};

	const discard = () => setState({ status: 'idle' });

	return { state, instruction, setInstruction, suggest, toggle, apply, discard };
}

export type AiFieldMapping = ReturnType<typeof useAiFieldMapping>;
