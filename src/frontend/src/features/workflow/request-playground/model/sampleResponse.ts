import { buildPayloadData } from '../../api/connectionPayload.references';
import type { MainResponse, PayloadData } from '../../types/connection';
import type { WorkflowMethodConfig } from '../../types/request-config.types';
import type { MultiValueHeaders, PlaygroundResult } from './playground.types';

type SentResult = Extract<PlaygroundResult, { kind: 'sent' }>;

export const joinHeaderValues = (headers: MultiValueHeaders | null | undefined): Record<string, string> =>
	Object.fromEntries(Object.entries(headers ?? {}).map(([name, values]) => [name, values.join(', ')]));

// The response becomes the step's sample, which the reference pickers of the following steps read.
export function withSampleResponse(config: WorkflowMethodConfig, nodeId: string,
	{ response }: SentResult): WorkflowMethodConfig {
	const format = config.response?.success?.body?.format ?? 'json';
	const body = buildPayloadData(response.body ?? {}, format) as PayloadData;
	const sample: MainResponse = {
		responseId: config.response?.responseId ?? `response-${nodeId}`,
		success: { status: String(response.status), header: joinHeaderValues(response.headers), body },
		fail: config.response?.fail ?? { status: '500', header: {}, body: buildPayloadData({}) as PayloadData },
	};
	return { ...config, response: sample };
}
