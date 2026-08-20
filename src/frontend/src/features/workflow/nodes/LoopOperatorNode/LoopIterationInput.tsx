import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Input } from '@shared/ui/primitives/Input';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = {
	/** The loop's current iteration, 1-based — the number the label shows. */
	value: number;
	/** Called only with a target strictly ahead of `value`. */
	onJump: (targetIteration: number) => void;
	testId: string;
};

// The iteration counter on a paused LOOP node, as a field: typing a number and
// committing fast-forwards the replay to that iteration, which beats clicking
// "next iteration" forty times to reach the one that misbehaves.
//
// Forward-only, and silently so: the replay consumes its buffered lines as it
// applies them, so there is nothing to rewind to. A target at or behind the
// current iteration just restores the displayed value rather than reporting an
// error the user can't act on — the tooltip says which way this goes.
export function LoopIterationInput({ value, onJump, testId }: Props) {
	const { t } = useI18n('workflow');
	// null while not editing, so the field keeps following the live counter as
	// the replay advances and only holds a draft once the user types into it.
	const [draft, setDraft] = useState<string | null>(null);

	const commit = () => {
		const target = Number.parseInt(draft ?? '', 10);
		setDraft(null);
		if (Number.isFinite(target) && target > value) onJump(target);
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		// The canvas listens for Backspace/Delete (node deletion) and its own
		// shortcuts on the document — typing a target must never reach them.
		event.stopPropagation();
		if (event.key === 'Enter') event.currentTarget.blur();
		if (event.key === 'Escape') {
			setDraft(null);
			event.currentTarget.blur();
		}
	};

	// nodrag/nopan keep a click inside the field from dragging the node or
	// panning the canvas; the label above it is pointer-events: none, so the
	// wrapper has to opt back in.
	return (
		<Tooltip content={t('node.jumpToIteration')} placement='top'>
			<span
				className='loopIterationInput nodrag nopan'
				onClick={(event: MouseEvent<HTMLSpanElement>) => event.stopPropagation()}
				onMouseDown={(event: MouseEvent<HTMLSpanElement>) => event.stopPropagation()}
				onDoubleClick={(event: MouseEvent<HTMLSpanElement>) => event.stopPropagation()}
			>
				<Input
					type='number'
					value={draft ?? String(value)}
					onChange={(event) => setDraft(event.target.value)}
					onBlur={commit}
					onKeyDown={handleKeyDown}
					testId={testId}
				/>
			</span>
		</Tooltip>
	);
}
