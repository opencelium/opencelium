import { useCallback, useEffect, useState } from 'react';

/** Content-box size of an element, kept current with a ResizeObserver. */
export const useElementSize = <T extends Element>() => {
	const [element, setElement] = useState<T | null>(null);
	const [size, setSize] = useState({ width: 0, height: 0 });

	useEffect(() => {
		if (!element || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			setSize((current) => current.width === width && current.height === height ? current : { width, height });
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, [element]);

	const ref = useCallback((node: T | null) => setElement(node), []);
	return { ref, ...size };
};
