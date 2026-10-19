import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

// Pixels per second while scrolling; the pauses at both ends come from the keyframes.
const SPEED = 40;

type Props = { text: string; className?: string };

export function MarqueeText({ text, className }: Props) {
	const viewport = useRef<HTMLSpanElement>(null);
	const content = useRef<HTMLSpanElement>(null);
	const [overflow, setOverflow] = useState(0);

	useLayoutEffect(() => {
		const outer = viewport.current;
		const inner = content.current;
		if (!outer || !inner) return;
		const measure = () => setOverflow(Math.max(0, inner.scrollWidth - outer.clientWidth));
		measure();
		if (typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(measure);
		observer.observe(outer);
		return () => observer.disconnect();
	}, [text]);

	const style =
		overflow > 0
			? ({
					'--marquee-shift': `-${overflow}px`,
					'--marquee-duration': `${Math.max(6, (overflow * 2) / SPEED + 3)}s`,
				} as CSSProperties)
			: undefined;
	return (
		<span
			ref={viewport}
			className={`marqueeText ${overflow > 0 ? 'marqueeText--running' : ''} ${className ?? ''}`}
			style={style}
		>
			<span ref={content} className="marqueeTextContent">
				{text}
			</span>
		</span>
	);
}
