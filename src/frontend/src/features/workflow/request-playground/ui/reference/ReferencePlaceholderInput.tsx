import { useLayoutEffect, useRef, type ClipboardEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { buildReferencePreview, replaceReferences } from '../../model/bodyPreview';
import { findChip, paintParts, readRawText, replaceChipWithCaret, restoreChips, type RemovedChip } from './referenceTextDom';

type Props = {
	value: string;
	testId: string | undefined;
	placeholder?: string;
	// Shown on hover, with its references as placeholders too.
	title?: string;
	className?: string;
	onChange: (value: string) => void;
};

// A one-line text field where every reference is an atomic placeholder chip, never shown raw.
// Clicking a chip removes it and leaves the caret in its place, so the user types the value there;
// leaving the field without typing anything brings the chip back.
export function ReferencePlaceholderInput({ value, testId, placeholder, title, className,
	onChange }: Props) {
	const { t } = useI18n('workflow');
	const rootRef = useRef<HTMLDivElement>(null);
	const typedRef = useRef<string | null>(null);
	const paintedRef = useRef<string | null>(null);
	const removedRef = useRef<RemovedChip[]>([]);
	const chipLabel = t('requestPlayground.body.setReference');

	const paint = () => {
		if (!rootRef.current) return;
		paintParts(rootRef.current, buildReferencePreview(value), chipLabel);
		paintedRef.current = value;
	};

	useLayoutEffect(() => {
		const isTyping = document.activeElement === rootRef.current && typedRef.current === value;
		if (!isTyping && paintedRef.current !== value) paint();
	});

	const emit = () => {
		if (!rootRef.current) return;
		typedRef.current = readRawText(rootRef.current);
		// The DOM now shows the typed text, so a later value equal to the last painted one still repaints.
		paintedRef.current = typedRef.current;
		onChange(typedRef.current);
	};
	const onInput = () => {
		removedRef.current = [];
		emit();
	};
	const onBlur = () => {
		typedRef.current = null;
		const removed = removedRef.current;
		removedRef.current = [];
		if (removed.length) onChange(restoreChips(value, removed));
		else paint();
	};
	const onMouseDown = (event: MouseEvent) => {
		const chip = findChip(event.target);
		if (!chip || !rootRef.current) return;
		event.preventDefault();
		rootRef.current.focus();
		removedRef.current = [...removedRef.current, replaceChipWithCaret(rootRef.current, chip)];
		emit();
	};
	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Enter') event.preventDefault();
	};
	const onPaste = (event: ClipboardEvent) => {
		event.preventDefault();
		document.execCommand('insertText', false, event.clipboardData.getData('text/plain').replace(/[\r\n]+/g, ''));
	};

	return (
		<div className={className ? `rpTokenInput ${className}` : 'rpTokenInput'}
			title={title && replaceReferences(title, chipLabel)}>
			<div ref={rootRef} className='rpTokenInputText' contentEditable suppressContentEditableWarning
				role='textbox' aria-multiline={false} aria-placeholder={placeholder} data-placeholder={placeholder}
				spellCheck={false} data-testid={testId}
				onInput={onInput} onMouseDown={onMouseDown} onKeyDown={onKeyDown} onPaste={onPaste}
				onBlur={onBlur} />
		</div>
	);
}
