import type { CSSProperties, ReactNode } from 'react';
import './referenceChip.css';

export type ReferenceChipTone = 'default' | 'warning' | 'error';

type Props = {
	/** The source's colour: a step colour, or a theme colour for webhook and global references. */
	color: string;
	/** What the reference reads from — a method name, "Webhook", "Global". Omitted when unknown. */
	source?: string;
	path: string;
	/** Usually the raw reference, shown on hover. */
	title?: string;
	tone?: ReferenceChipTone;
	isSelected?: boolean;
	isClickable?: boolean;
	testId?: string;
	/** Trailing controls, e.g. a remove button. */
	children?: ReactNode;
};

/** Display only; editing and removing stay with the host (hover menu, picker, field). */
export function ReferenceChip({ color, source, path, title, tone = 'default', isSelected, isClickable, testId, children }: Props) {
	const className = ['wfReferenceChip', tone !== 'default' && `wfReferenceChip--${tone}`,
		isSelected && 'wfReferenceChip--selected', isClickable && 'wfReferenceChip--clickable'].filter(Boolean).join(' ');
	return (
		<span className={className} style={{ '--wf-ref-color': color } as CSSProperties} data-source={source || undefined}
			title={title} data-testid={testId}>
			<span className='wfReferenceChipText'>{path}</span>
			{children}
		</span>
	);
}
