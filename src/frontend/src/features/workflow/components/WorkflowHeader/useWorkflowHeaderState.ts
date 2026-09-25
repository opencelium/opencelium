import { useState } from 'react';
import type { WorkflowHeaderStateProps } from './WorkflowHeader.types';
import { useWorkflowHeaderFields } from './useWorkflowHeaderFields';

export const EMPTY_NAME_LABEL = '[Empty Name]';

export function useWorkflowHeaderState({
	initialName = 'i-doit 2 Znuny example',
	initialDescription = 'This interface delivering data into znuny and creates a ticket if the specified object is missing.',
	onChange,
	validateTitle,
	onNameCommitted,
	onDescriptionCommitted,
}: WorkflowHeaderStateProps) {
	const {
		name, setName, description, setDescription, draftName, setDraftName,
		draftDescription, setDraftDescription, editing, setEditing,
		nameInputRef, descriptionInputRef,
	} = useWorkflowHeaderFields(initialName, initialDescription);
	const [nameError, setNameError] = useState('');
	const [isCheckingName, setIsCheckingName] = useState(false);
	const [isSavingName, setIsSavingName] = useState(false);
	const [isSavingDescription, setIsSavingDescription] = useState(false);

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
		const didRename = nextName !== name;
		setName(nextName);
		setNameError('');
		onChange?.({ title: nextName, description });
		if (didRename && onNameCommitted) {
			setIsSavingName(true);
			try {
				await onNameCommitted(nextName, description);
			} catch {

			} finally {
				setIsSavingName(false);
			}
		}
		setEditing(null);
	};

	const commitDescription = async () => {
		const nextDescription = draftDescription.trim();
		const didChangeDescription = nextDescription !== description;
		setDescription(nextDescription);
		onChange?.({ title: name, description: nextDescription });
		if (didChangeDescription && onDescriptionCommitted) {
			setIsSavingDescription(true);
			try {
				await onDescriptionCommitted(name, nextDescription);
			} catch {

			} finally {
				setIsSavingDescription(false);
			}
		}
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
		name, description, draftName, draftDescription, editing, nameError, isCheckingName, isSavingName,
		isSavingDescription, nameInputRef, descriptionInputRef, setDraftName, setDraftDescription, setEditing,
		cancelEdit, commitName, commitDescription, prepareSave,
	};
}
