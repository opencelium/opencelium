import { runtimeConfig } from '@shared/config/runtimeConfig';
import type { HelpEvent, HelpRequest } from '../model/aiGateway.types';

/** Splits streamed text into JSON lines; returns the events and the unfinished rest. */
export function readEvents(buffer: string): { events: HelpEvent[]; rest: string } {
	const lines = buffer.split('\n');
	const rest = lines.pop() ?? '';
	return { events: lines.filter((line) => line.trim()).map((line) => JSON.parse(line) as HelpEvent), rest };
}

/**
 * The help answer as it is written. A plain fetch, deliberately: the answer streams, which apiExecutor and apiFetch do
 * not read, and the AI gateway is not the backend: its errors must not reach the backend's auth handling, where a 401
 * signs the user out. It needs no token (local service, loopback by default).
 */
export async function* streamHelp(request: HelpRequest, signal: AbortSignal): AsyncGenerator<HelpEvent> {
	const response = await fetch(`${runtimeConfig.aiUrl}/help/ask`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(request),
		signal,
	});
	if (!response.ok || !response.body) throw new Error(`Help request failed with HTTP ${response.status}`);
	const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
	let buffer = '';
	for (;;) {
		const { value, done } = await reader.read();
		if (done) break;
		const { events, rest } = readEvents(buffer + value);
		buffer = rest;
		yield* events;
	}
	yield* readEvents(`${buffer}\n`).events;
}
