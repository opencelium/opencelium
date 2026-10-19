import { useCallback, useEffect, useRef, useState } from 'react';
import type { SandboxRequest, SandboxResult } from './sandbox.types';

export function useScriptSandbox() {
	const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
	const [result, setResult] = useState<SandboxResult | null>(null);
	const [completedAt, setCompletedAt] = useState<number>();
	const active = useRef<{
		worker: Worker;
		timer: ReturnType<typeof setTimeout>;
	} | null>(null);
	const stop = useCallback(() => {
		if (active.current) {
			active.current.worker.terminate();
			clearTimeout(active.current.timer);
		}
		active.current = null;
	}, []);
	useEffect(() => stop, [stop]);
	const run = useCallback(
		(request: SandboxRequest) => {
			stop();
			setStatus('running');
			setResult(null);
			setCompletedAt(undefined);
			const finish = (response: SandboxResult) => {
				stop();
				setResult(response);
				setCompletedAt(Date.now());
				setStatus('done');
			};
			try {
				const worker = new Worker(new URL('./sandbox.worker.ts', import.meta.url), {
					type: 'module',
				});
				active.current = {
					worker,
					timer: setTimeout(() => finish({ kind: 'timeout' }), 2000),
				};
				worker.onmessage = (event: MessageEvent<SandboxResult>) => {
					if (active.current?.worker === worker) finish(event.data);
				};
				worker.onerror = (event) => {
					if (active.current?.worker !== worker) return;
					finish({
						kind: 'error',
						message: event.message || 'workerError',
						console: [],
					});
				};
				worker.postMessage(request);
			} catch (error) {
				finish({
					kind: 'error',
					message: error instanceof Error ? error.message : 'workerError',
					console: [],
				});
			}
		},
		[stop],
	);
	return { run, status, result, completedAt };
}
