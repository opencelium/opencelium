import type { Connector } from '@entities/connector/model/types';
import { buildPayloadData } from '../../api/connectionPayload.references';
import type { MainResponse, PayloadData } from '../../types/connection';
import type { WorkflowMethodConfig } from '../../types/request-config.types';
import type { PlaygroundResponse, PlaygroundSettings } from './playground.types';

const DEFAULT_TIMEOUT_SEC = 30;

// The connector's timeout is in milliseconds, 0 meaning none.
export const defaultSettings = (connector: Connector | undefined): PlaygroundSettings => ({
	timeoutSec: connector?.timeout ? Math.ceil(connector.timeout / 1000) : DEFAULT_TIMEOUT_SEC,
	retries: 0,
	proxyMode: 'system',
	proxyUrl: '',
	followRedirects: true,
	verifySsl: true,
	saveResponseAsSample: false,
	logToHistory: false,
});

type SuccessResponse = Extract<PlaygroundResponse, { kind: 'success' }>;

// The response becomes the step's sample, which the reference pickers of the following steps read.
export function withSampleResponse(config: WorkflowMethodConfig, nodeId: string,
	{ response }: SuccessResponse): WorkflowMethodConfig {
	const format = config.response?.success?.body?.format ?? 'json';
	const body = buildPayloadData(response.body ?? {}, format) as PayloadData;
	const sample: MainResponse = {
		responseId: config.response?.responseId ?? `response-${nodeId}`,
		success: { status: String(response.status), header: response.headers ?? {}, body },
		fail: config.response?.fail ?? { status: '500', header: {}, body: buildPayloadData({}) as PayloadData },
	};
	return { ...config, response: sample };
}
