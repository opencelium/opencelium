import { useEffect, useRef, useState } from 'react';
import type { EditField, WorkflowHeaderProps } from './WorkflowHeader.types';

export const EMPTY_NAME_LABEL = '[Empty Name]';

type StateProps = Pick<
	WorkflowHeaderProps,
	'initialName' | 'initialDescription' | 'onChange' | 'validateTitle'
>;

export function useWorkflowHeaderState({
	initialName = 'i-doit 2 Znuny example',
	initialDescription = 'This interface delivering data into znuny and creates a ticket if the specified object is missing.',
	onChange,
	validateTitle,
}: StateProps) {
	const [name, setName] = useState(initialName);
	const [description, setDescription] = useState(initialDescription);
	const [draftName, setDraftName] = useState(name);
	const [draftDescription, setDraftDescription] = useState(description);
	const [editing, setEditing] = useState<EditField>(null);
	const [nameError, setNameError] = useState('');
	const [isCheckingName, setIsCheckingName] = useState(false);
	const nameInputRef = useRef<HTMLInputElement | null>(null);
	const descriptionInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		setName(initialName);
		setDraftName(initialName);
	}, [initialName]);

	useEffect(() => {
		setDescription(initialDescription);
		setDraftDescription(initialDescription);
	}, [initialDescription]);

	useEffect(() => {
		if (editing === 'name') {
			setDraftName(name);
			nameInputRef.current?.focus();
			nameInputRef.current?.select();
		}
		if (editing === 'description') {
			setDraftDescription(description);
			descriptionInputRef.current?.focus();
			descriptionInputRef.current?.select();
		}
	}, [description, editing, name]);

	const cancelEdit = () => {
		setDraftName(name);
		setDraftDescription(description);
		setEditing(null);
	};

	const focusNameWithError = (value: string, errorMessage: string) => {
		setNameError(errorMessage);
		setEditing('name');
		setDraftName(value);
		window.setTimeout(() => nameInputRef.current?.focus(), 0);
	};

	const runTitleCheck = async (value: string) => {
		if (!validateTitle) return null;
		setIsCheckingName(true);
		try {
			return await validateTitle(value);
		} finally {
			setIsCheckingName(false);
		}
	};

	const commitName = async () => {
		const nextName = draftName.trim();
		if (!nextName) {
			setName(nextName);
			setNameError('');
			onChange?.({ title: nextName, description });
			setEditing(null);
			return;
		}
		const titleError = await runTitleCheck(nextName);
		if (titleError) return focusNameWithError(nextName, titleError);
		setName(nextName);
		setNameError('');
		onChange?.({ title: nextName, description });
		setEditing(null);
	};

	const commitDescription = () => {
		const nextDescription = draftDescription.trim();
		setDescription(nextDescription);
		onChange?.({ title: name, description: nextDescription });
		setEditing(null);
	};

	const prepareSave = async (emptyNameError: string) => {
		const nextName = editing === 'name' ? draftName.trim() : name;
		const nextDescription = editing === 'description' ? draftDescription.trim() : description;
		if (!nextName.trim() || nextName.trim() === EMPTY_NAME_LABEL) {
			focusNameWithError(nextName, emptyNameError);
			return false;
		}
		const titleError = await runTitleCheck(nextName);
		if (titleError) {
			focusNameWithError(nextName, titleError);
			return false;
		}
		setName(nextName);
		setDescription(nextDescription);
		setNameError('');
		onChange?.({ title: nextName, description: nextDescription });
		setEditing(null);
		return true;
	};

	return {
		name, description, draftName, draftDescription, editing, nameError, isCheckingName,
		nameInputRef, descriptionInputRef, setDraftName, setDraftDescription, setEditing,
		cancelEdit, commitName, commitDescription, prepareSave,
	};
}
