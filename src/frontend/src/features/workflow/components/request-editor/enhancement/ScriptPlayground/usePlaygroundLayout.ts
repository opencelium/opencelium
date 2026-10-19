import { useLayoutEffect, useState, type RefObject } from 'react';

export function usePlaygroundLayout(wrapper: RefObject<HTMLDivElement | null>) {
	const [stacked, setStacked] = useState(false);
	useLayoutEffect(() => {
		const element = wrapper.current;
		if (!element) return;
		const measure = () => setStacked(element.getBoundingClientRect().width < 680);
		measure();
		if (typeof ResizeObserver === 'undefined') {
			window.addEventListener('resize', measure);
			return () => window.removeEventListener('resize', measure);
		}
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, [wrapper]);
	return stacked;
}
