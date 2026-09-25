import { useLayoutEffect, useRef, useState } from 'react';

export const useGroupTreeLine = (itemCount: number, operatorType: 'if' | 'loop') => {
	const bodyRef = useRef<HTMLDivElement | null>(null);
	const [bottom, setBottom] = useState(24);
	useLayoutEffect(() => {
		if (operatorType !== 'if' || !bodyRef.current) return;
		const body = bodyRef.current;
		const update = () => {
			const lastChild = body.lastElementChild;
			if (!(lastChild instanceof HTMLElement)) return setBottom(24);
			const offset = lastChild.classList.contains('conditionRule')
				? lastChild.offsetTop + lastChild.offsetHeight / 2
				: lastChild.offsetTop + 23;
			setBottom(Math.max(0, body.offsetHeight - offset - 2));
		};
		update();
		const observer = new ResizeObserver(update);
		observer.observe(body);
		if (body.lastElementChild instanceof HTMLElement) observer.observe(body.lastElementChild);
		return () => observer.disconnect();
	}, [itemCount, operatorType]);
	return { bodyRef, bottom };
};
