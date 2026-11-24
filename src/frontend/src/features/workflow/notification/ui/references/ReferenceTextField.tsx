import { useEffect, useLayoutEffect, useRef, type ClipboardEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useNotificationReferences } from './notificationReferenceContextValue';
import { NotificationReferencePicker } from './NotificationReferencePicker';
import { ReferenceInsertButton } from './ReferenceInsertButton';
import { hasReference } from '../../model/notificationBody';
import { insertChipAt, isChipRemoveButton, paintReferenceValue, readReferenceValue } from './referenceFieldDom';

type Props = {
	id: string;
	value: string;
	onChange: (value: string) => void;
	isMultiline?: boolean;
	placeholder?: string;
	ariaLabel: string;
	disabled?: boolean;
	testId: string;
};

/** A text field where references show as removable chips and serialize back to their tokens. */
export function ReferenceTextField({ id, value, onChange, isMultiline, placeholder, ariaLabel, disabled, testId }: Props) {
	const { t } = useI18n('workflow');
	const { describe } = useNotificationReferences();
	const rootRef = useRef<HTMLDivElement>(null);
	const paintedRef = useRef<string | null>(null);
	const caretRef = useRef<Range | null>(null);
	const removeLabel = t('actions.deleteReference');

	useLayoutEffect(() => {
		if (!rootRef.current || paintedRef.current === value) return;
		paintReferenceValue(rootRef.current, value, describe, removeLabel);
		paintedRef.current = value;
	}, [value, describe, removeLabel]);

	useEffect(() => {
		const remember = () => {
			const selection = window.getSelection();
			if (selection?.rangeCount && rootRef.current?.contains(selection.anchorNode)) {
				caretRef.current = selection.getRangeAt(0).cloneRange();
			}
		};
		document.addEventListener('selectionchange', remember);
		return () => document.removeEventListener('selectionchange', remember);
	}, []);

	const emit = () => {
		if (!rootRef.current) return;
		const raw = readReferenceValue(rootRef.current);
		// Browsers add a <br> after a trailing chip; a one-line field must never carry it.
		const next = isMultiline ? raw : raw.replace(/\n/g, '');
		paintedRef.current = next;
		onChange(next);
	};
	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		if (isMultiline) document.execCommand('insertText', false, '\n');
	};
	const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
		event.preventDefault();
		document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
	};
	const onMouseDown = (event: MouseEvent<HTMLDivElement>) => {
		if (!isChipRemoveButton(event.target)) return;
		event.preventDefault();
		event.target.closest('.notificationRefChip')?.remove();
		emit();
	};
	// A token typed or pasted by hand becomes a chip once the field is left.
	const onBlur = () => {
		if (rootRef.current && hasReference(rootRef.current.textContent ?? '')) {
			paintReferenceValue(rootRef.current, value, describe, removeLabel);
		}
	};
	const insertReference = (token: string) => {
		if (!rootRef.current) return;
		insertChipAt(rootRef.current, caretRef.current, token, describe, removeLabel);
		rootRef.current.focus();
		emit();
	};

	return (
		<div className='notificationRefFieldWrap'>
			<div className={`notificationRefField ${disabled ? 'notificationRefField--disabled' : ''}`}>
				<div ref={rootRef} id={id} role='textbox' aria-label={ariaLabel} aria-multiline={isMultiline || undefined}
					aria-disabled={disabled || undefined} data-testid={testId} data-placeholder={placeholder}
					className={`notificationRefFieldInput ${isMultiline ? 'notificationRefFieldInput--multiline' : ''}`}
					contentEditable={!disabled} suppressContentEditableWarning spellCheck={false}
					onInput={emit} onKeyDown={onKeyDown} onPaste={onPaste} onMouseDown={onMouseDown} onBlur={onBlur} />
				<ReferenceInsertButton pickerId={id} testId={`${testId}-insert-reference`} disabled={disabled} />
			</div>
			<NotificationReferencePicker pickerId={id} onApply={insertReference} />
		</div>
	);
}
