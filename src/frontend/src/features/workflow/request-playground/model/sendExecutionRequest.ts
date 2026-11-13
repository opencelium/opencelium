import type { Client } from '@stomp/stompjs';
import type { DetailedMethodLog, ExecutionSocketLog } from '@features/logs';
import { ApiFetchError, apiFetchWithHeaders } from '@shared/api/apiFetch';
import { createId } from '@shared/lib/createId';
import { replaceLiveValueAtPath } from '../../components/request-editor/body-editor/requestReferenceOptions';
import { testConnectionExecution } from '../../api/connectionApi';
import type { PlaygroundRequest, PlaygroundResponse } from './playground.types';
import { connectionFieldSubstitution, referenceSubstitution, resolveRequest, webhookSubstitution } from './resolveRequest';

const readValue = (value?: string) => {
	if (value === undefined) return null;
	try { return JSON.parse(value) as unknown; }
	catch { return value; }
};

const readHeaders = (value?: string) => {
	const parsed = readValue(value);
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
	return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [
		key, Array.isArray(value) ? value.join(', ') : String(value),
	]));
};

async function readCompletedMethod(id: string, signal: AbortSignal) {
	const path = `/execution/log/element/${encodeURIComponent(id)}/details`;
	for (let attempt = 0; ; attempt++) {
		try {
			return await apiFetchWithHeaders<DetailedMethodLog>(path, { signal });
		} catch (error) {
			if (!(error instanceof ApiFetchError) || ![404, 500].includes(error.status) || attempt === 4) throw error;
			await new Promise<void>((resolve) => window.setTimeout(resolve, 250 * (attempt + 1)));
			signal.throwIfAborted();
		}
	}
}

export async function sendExecutionRequest(client: Client, input: PlaygroundRequest, signal: AbortSignal): Promise<PlaygroundResponse> {
	const request = resolveRequest(input.method, [
		...input.references.map(({ reference, value }) => referenceSubstitution(reference, value)),
		...input.webhooks.map(({ name, value }) => webhookSubstitution(name, value)),
		...Object.entries(input.requestData).map(([key, value]) => connectionFieldSubstitution(key, value)),
	]);
	for (const { section, path, value } of input.enhancementOutputs ?? []) {
		if (section === 'body') request.body = replaceLiveValueAtPath(request.body, path, value);
		else request.headers = replaceLiveValueAtPath(request.headers, path, value) as typeof request.headers;
	}
	const { method } = input;
	const body = method.request.body;
	const step = {
		...method,
		index: '0',
		jump: undefined,
		dataAggregator: null,
		request: {
			...method.request,
			endpoint: request.url,
			header: Object.fromEntries(Object.entries(request.headers).map(([key, value]) => [
				key, typeof value === 'string' ? value : JSON.stringify(value),
			])),
			body: body && typeof body === 'object' ? { ...body, fields: request.body } : body,
		},
	};
	const channel = createId();
	const startedAt = Date.now();
	let stop = () => {};
	try {
		const finished = new Promise<ExecutionSocketLog>((resolve, reject) => {
			let operation: ExecutionSocketLog | undefined;
			const subscription = client.subscribe(`/execution/logs/${channel}`, ({ body }) => {
				let log: ExecutionSocketLog;
				try { log = JSON.parse(body) as ExecutionSocketLog; }
				catch { return; }
				if (log.type === 'OPERATION' && log.indexPath === '0') operation = log;
				if (log.type === 'EXECUTION' && log.status !== 'PENDING') resolve(operation ?? log);
			});
			const cancel = () => reject(new Error('Execution cancelled'));
			signal.addEventListener('abort', cancel, { once: true });
			const timer = window.setTimeout(() => reject(new Error('Execution timed out')), 90_000);
			stop = () => {
				window.clearTimeout(timer);
				signal.removeEventListener('abort', cancel);
				if (client.connected) subscription.unsubscribe();
			};
		});
		const [, log] = await Promise.all([
			testConnectionExecution({
				title: `Playground ${channel}`,
				fromConnector: { connectorId: -1, methods: [step], operators: [] },
				toConnector: null,
				fieldBinding: [],
			}, channel),
			finished,
		]);
		if (log.type !== 'OPERATION') throw new Error('Method did not execute');
		const details = await readCompletedMethod(log.id, signal);
		const response = details.data?.segment?.response;
		const status = Number(response?.status);
		if (!status) {
			const message = details.data?.error?.message ?? log.error?.message;
			if (message) return { kind: 'error', stage: 'connect', message };
			throw new Error('Missing response status');
		}
		const sent = details.data?.segment?.request;
		return {
			kind: 'success',
			request: {
				url: sent?.url || request.url,
				method: sent?.http_method || request.method,
				headers: readHeaders(sent?.header),
				body: readValue(sent?.payload),
			},
			response: { status, headers: readHeaders(response?.header), body: readValue(response?.payload) },
			durationMs: Number.parseInt(response?.duration ?? '', 10) || Date.now() - startedAt,
		};
	} finally {
		stop();
	}
}
