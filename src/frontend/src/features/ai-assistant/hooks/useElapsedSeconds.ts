import { useEffect, useState } from 'react';

/** Whole seconds since `startedAt`, ticking once a second; 0 when not running. */
export function useElapsedSeconds(startedAt: number | null): number {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (startedAt === null) return;
		const timer = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(timer);
	}, [startedAt]);

	return startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
}

export function formatElapsed(seconds: number): string {
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
