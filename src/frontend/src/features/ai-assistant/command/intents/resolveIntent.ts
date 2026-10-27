import type { Connector } from '@entities/connector/model/types';
import type { WorkflowIntent } from '@features/workflow/intent/workflowIntent.store';
import type { WorkflowTemplate } from '@features/workflow/types/workflowTemplate.types';
import { apiExecutor } from '@shared/api/apiExecutor';
import { isApiExecutorError } from '@shared/api/isApiExecutorError';
import type { CommandIntent } from '../../model/aiGateway.types';
import { matchByName } from './matchByName';

/** A gateway intent with its names matched to real records: what opens, and what it opens with. */
export type ResolvedIntent =
	| { kind: 'schedule'; values: { title: string; connectionId?: number; cronExp: string } }
	| { kind: 'connector'; values: { invoker?: string; title: string; description: string } }
	| { kind: 'workflow'; intent: WorkflowIntent };

type WorkflowMeta = { id: number; title: string };

/** A list the user may not be allowed to read (or a backend hiccup) just leaves the field for the user to pick. */
async function fetchList<T>(url: string): Promise<T[]> {
	const response: unknown = await apiExecutor({ url, method: 'GET', options: { ignoreError: true } }).catch(() => []);
	return !isApiExecutorError(response) && Array.isArray(response) ? (response as T[]) : [];
}

async function resolveWorkflow(intent: Extract<CommandIntent, { kind: 'workflow' }>): Promise<WorkflowIntent> {
	switch (intent.source) {
		case 'template': {
			const templates = await fetchList<WorkflowTemplate>('/template/all?metadataOnly=true');
			const template = matchByName(templates, (item) => [item.name ?? ''], intent.template);
			return template ? { source: 'template', template } : { source: 'template-picker' };
		}
		case 'ai': {
			const connectors = await fetchList<Connector>('/connector/all');
			const nameOf = (connector: Connector) => [connector.title, connector.invoker?.name ?? ''];
			return {
				source: 'ai',
				title: intent.title,
				prompt: intent.task,
				connectors: {
					fromId: matchByName(connectors, nameOf, intent.from)?.connectorId ?? null,
					toId: matchByName(connectors, nameOf, intent.to)?.connectorId ?? null,
				},
			};
		}
		case 'empty':
			return { source: 'empty', title: intent.title };
		default: {
			const _exhaustive: never = intent.source;
			return _exhaustive;
		}
	}
}

export async function resolveIntent(intent: CommandIntent): Promise<ResolvedIntent> {
	switch (intent.kind) {
		case 'schedule': {
			const workflows = await fetchList<WorkflowMeta>('/connection/all/meta');
			const workflow = matchByName(workflows, (item) => [item.title], intent.workflow);
			return {
				kind: 'schedule',
				values: { title: intent.title || workflow?.title || '', connectionId: workflow?.id, cronExp: intent.cronExp },
			};
		}
		case 'connector':
			return { kind: 'connector', values: { invoker: intent.system || undefined, title: intent.title, description: intent.description } };
		case 'workflow':
			return { kind: 'workflow', intent: await resolveWorkflow(intent) };
		default: {
			const _exhaustive: never = intent;
			return _exhaustive;
		}
	}
}
