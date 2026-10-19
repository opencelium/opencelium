import { createServer, type Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import { setTimeout as wait } from 'node:timers/promises';
import type { ParityCase } from './nashornParity.cases';
const base = process.env.OC_TEST_BACKEND_URL ?? 'http://127.0.0.1:9090';
const body = (fields: unknown) => ({ type: 'object', format: 'json', data: 'raw', fields });
type Log = { id: string; status: string; error?: unknown; properties?: Record<string, unknown> };
export class NashornServer {
	private token = process.env.OC_TEST_TOKEN ?? '';
	private server?: Server;
	private origin = '';
	private source: unknown = {};
	private received?: { result?: unknown };
	private owned = new Set<number>();
	private async api<T>(path: string, method = 'GET', payload?: unknown): Promise<T> {
		const r = await fetch(`${base}${path}`, {
			method,
			headers: { Authorization: this.token, 'Content-Type': 'application/json' },
			body: payload === undefined ? undefined : JSON.stringify(payload),
			signal: AbortSignal.timeout(15000),
		});
		if (!r.ok) throw new Error(`${method} ${path}: ${r.status} ${await r.text()}`);
		const text = await r.text();
		return text ? (JSON.parse(text) as T) : (undefined as T);
	}
	async start() {
		if (!this.token) {
			const email = process.env.OC_TEST_EMAIL,
				password = process.env.OC_TEST_PASSWORD;
			if (!email || !password)
				throw new Error(
					'Set OC_TEST_TOKEN or OC_TEST_EMAIL and OC_TEST_PASSWORD for the running backend.',
				);
			const r = await fetch(`${base}/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
				signal: AbortSignal.timeout(15000),
			});
			this.token = r.headers.get('authorization') ?? '';
			if (!r.ok || !this.token) throw new Error(`Backend login failed: ${r.status}`);
		}
		await this.api('/connection/all');
		this.server = createServer(async (req, res) => {
			if (req.url === '/source') {
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify(this.source));
			} else if (req.url === '/target' && req.method === 'POST') {
				try {
					let text = '';
					for await (const chunk of req) text += String(chunk);
					this.received = JSON.parse(text) as { result?: unknown };
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end('{}');
				} catch {
					res.writeHead(400);
					res.end();
				}
			} else {
				res.writeHead(404);
				res.end();
			}
		});
		await new Promise<void>((resolve, reject) => {
			this.server!.once('error', reject);
			this.server!.listen(0, '127.0.0.1', resolve);
		});
		const address = this.server.address();
		if (!address || typeof address === 'string') throw new Error('Cannot start HTTP fixture');
		this.origin = `http://127.0.0.1:${address.port}`;
	}
	async stop() {
		try {
			for (const id of this.owned) {
				try {
					await this.api(`/connection/${id}`, 'DELETE');
				} catch (error) {
					if (!(error instanceof Error) || !error.message.includes('CONNECTION_NOT_FOUND'))
						throw error;
				}
			}
		} finally {
			await new Promise<void>((resolve, reject) => {
				if (!this.server) return resolve();
				this.server.close((e) => (e ? reject(e) : resolve()));
			});
		}
	}
	async execute(c: ParityCase) {
		this.received = undefined;
		const value = c.id === 'long-typeof' ? 2147483648 : c.args.VAR_1;
		this.source = { value: value ?? '' };
		const method = (
			index: string,
			color: string,
			endpoint: string,
			fields: unknown,
			verb: string,
		) => ({
			index,
			color,
			name: `Sandbox${index}`,
			methodType: 'HTTP_REQUEST',
			connector: null,
			request: {
				endpoint: `${this.origin}/${endpoint}`,
				method: verb,
				header: { 'Content-Type': 'application/json' },
				body: body(fields),
			},
			response: {
				name: 'response',
				success: { status: '200', header: {}, body: body({ value: '' }) },
				fail: { status: '500', header: {}, body: body({}) },
			},
		});
		const payload = {
			title: `sandbox-parity-${randomUUID()}`,
			description: 'Temporary live Nashorn check',
			fromConnector: {
				connectorId: -1,
				methods: [
					method('0', '#00bcd4', 'source', {}, 'GET'),
					method(
						'1',
						'#ff9800',
						'target',
						{ result: '{%#ff9800.(request).body.$.result%}' },
						'POST',
					),
				],
				operators: [],
			},
			toConnector: null,
			fieldBinding: [
				{
					from: [{ color: '#00bcd4', type: 'response', field: 'body.$.value' }],
					to: [{ color: '#ff9800', type: 'request', field: 'body.$.result' }],
					enhancement: {
						language: 'js',
						expertCode: c.script.replace(/\bVAR_1\b/g, 'VAR_0'),
						expertVar: '//var VAR_0 = #00bcd4.(response).body.$.value;',
					},
				},
			],
		};
		const started = await this.api<{ schedulerId: number }>(
			`/connection/execution/test?channelId=${randomUUID()}`,
			'POST',
			payload,
		);
		const scheduler = await this.api<{ connection: { connectionId: number } }>(
			`/scheduler/${started.schedulerId}`,
		);
		const id = scheduler.connection.connectionId;
		this.owned.add(id);
		try {
			for (let attempt = 0; attempt < 120; attempt++) {
				const received = this.readResult();
				if (received) return { kind: 'value' as const, value: received.result };
				try {
					const files = await this.api<{ result: string[] }>(`/connection/${id}/log-files`);
					for (const fileName of files.result) {
						const roots = await this.api<Log[]>(
							`/execution/logs/children?fileName=${encodeURIComponent(fileName)}`,
						);
						const logs = [...roots];
						for (const root of roots)
							logs.push(...(await this.api<Log[]>(`/execution/log/element/${root.id}/children`)));
						const failure = logs.find((log) => log.error || log.status === 'FAIL');
						if (failure) {
							const details = await this.api<Log>(`/execution/log/element/${failure.id}/details`);
							return {
								kind: 'error' as const,
								message: JSON.stringify(details.error ?? details.properties),
							};
						}
					}
				} catch (error) {
					// Log files appear asynchronously after the scheduler starts.
					if (
						!(error instanceof Error) ||
						!error.message.includes('500') ||
						!error.message.includes('Unknown error')
					)
						throw error;
				}
				await wait(100);
			}
			throw new Error(`Backend workflow did not finish: ${c.id}`);
		} finally {
			await this.settle(started.schedulerId);
		}
	}

	private readResult(): { result?: unknown } | undefined {
		return this.received;
	}
	private async settle(schedulerId: number) {
		for (let i = 0; i < 100; i++) {
			try {
				await this.api(`/scheduler/${schedulerId}`);
			} catch (error) {
				if (error instanceof Error && error.message.includes('SCHEDULER_NOT_FOUND')) return;
				throw error;
			}
			if (i === 50) await this.api(`/scheduler/terminate/${schedulerId}`);
			await wait(100);
		}
		throw new Error(`Test scheduler did not stop: ${schedulerId}`);
	}
}
