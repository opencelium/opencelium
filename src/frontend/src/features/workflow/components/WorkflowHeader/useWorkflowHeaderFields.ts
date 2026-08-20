import { useEffect, useRef, useState } from 'react';
import type { EditField } from './WorkflowHeader.types';

export function useWorkflowHeaderFields(initialName: string, initialDescription: string) {
	const [name, setName] = useState(initialName);
	const [description, setDescription] = useState(initialDescription);
	const [draftName, setDraftName] = useState(initialName);
	const [draftDescription, setDraftDescription] = useState(initialDescription);
	const [editing, setEditing] = useState<EditField>(null);
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

	return {
		name, setName, description, setDescription, draftName, setDraftName,
		draftDescription, setDraftDescription, editing, setEditing,
		nameInputRef, descriptionInputRef,
	};
}
