import { Clock3, MoreHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { HeaderEditableField } from './header/HeaderEditableField';
import { HeaderMenu } from './header/HeaderMenu';
import { HeaderSaveDialog } from './header/HeaderSaveDialog';
import { headerMenuItems } from './header/headerMenuItems';
import type { WorkflowHeaderMenuItem } from '../types/workflow.types';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = {
	initialName?: string;
	initialDescription?: string;
	onOpenHistory: () => void;
	onSave: (values: { title: string; description: string; comment: string }) => void | Promise<void>;
	onChange?: (values: { title: string; description: string }) => void;
	onMenuItemSelect?: (item: WorkflowHeaderMenuItem) => void;
	/** Async title check; returns a translated error message to show inline, or null when the title is acceptable. */
	validateTitle?: (title: string) => Promise<string | null>;
	saveDisabled?: boolean;
	readOnly?: boolean;
	loading?: boolean;
};
type EditField = 'name' | 'description' | null;
const EMPTY_NAME_LABEL = '[Empty Name]';

export function WorkflowHeader({ initialName = 'i-doit 2 Znuny example', initialDescription = 'This interface delivering data into znuny and creates a ticket if the specified object is missing.', onOpenHistory, onSave, onChange, onMenuItemSelect, validateTitle, saveDisabled = false, readOnly = false, loading = false }: Props) {
	const { t } = useI18n('workflow');
	const [name, setName] = useState(initialName);
	const [description, setDescription] = useState(initialDescription);
	const [draftName, setDraftName] = useState(name);
	const [draftDescription, setDraftDescription] = useState(description);
	const [editing, setEditing] = useState<EditField>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const [saveDialogOpen, setSaveDialogOpen] = useState(false);
	const [saveComment, setSaveComment] = useState('');
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
		setSaveDialogOpen(false);
		setEditing('name');
		setDraftName(value);
		window.setTimeout(() => {
			nameInputRef.current?.focus();
		}, 0);
	};

	const runTitleCheck = async (value: string): Promise<string | null> => {
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
		if (titleError) {
			// Reject the duplicate: keep editing, refocus, don't accept the value.
			focusNameWithError(nextName, titleError);
			return;
		}
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

	const isNameEmpty = (value: string) => !value.trim() || value.trim() === EMPTY_NAME_LABEL;

	const openSaveDialog = async () => {
		const nextName = editing === 'name' ? draftName.trim() : name;
		const nextDescription = editing === 'description' ? draftDescription.trim() : description;

		if (isNameEmpty(nextName)) {
			focusNameWithError(nextName, t('messages.enterWorkflowName'));
			return;
		}

		const titleError = await runTitleCheck(nextName);
		if (titleError) {
			focusNameWithError(nextName, titleError);
			return;
		}

		setName(nextName);
		setDescription(nextDescription);
		setNameError('');
		onChange?.({ title: nextName, description: nextDescription });
		setEditing(null);
		setSaveDialogOpen(true);
	};

	const closeSaveDialog = () => {
		setSaveDialogOpen(false);
		setSaveComment('');
	};

	return (
		<>
			<div className='headerCard'>
				<div className='headerInlineInfo'>
					{loading ? (
						<span className="headerInlineLoading" aria-hidden />
					) : (<>
					{editing === 'name' ? (
						<div className='headerInlineFieldWrap'>
							<HeaderEditableField
								className={`headerInlineNameInput ${nameError ? 'headerInlineInputError' : ''}`}
								value={draftName}
								onChange={setDraftName}
								onSubmit={commitName}
								onBlur={commitName}
								onCancel={cancelEdit}
								loading={isCheckingName}
								inputRef={nameInputRef}
							/>
							{nameError ? <div className='headerInlineErrorMessage'>{nameError}</div> : null}
						</div>
					) : (
						<div className='headerInlineFieldWrap'>
							<div
								className={`headerInlineName ${nameError ? 'headerInlineErrorText' : ''}`}
								onClick={() => { if (!readOnly) setEditing('name'); }}
								role={readOnly ? undefined : 'button'}
								tabIndex={readOnly ? undefined : 0}
							>
								{name || EMPTY_NAME_LABEL}
							</div>
							{nameError ? <div className='headerInlineErrorMessage'>{nameError}</div> : null}
						</div>
					)}
					<div className='headerInlineDivider'>-</div>
					{editing === 'description' ? (
						<HeaderEditableField
							className='headerInlineDescriptionInput headerInlineEditorWide'
							value={draftDescription}
							onChange={setDraftDescription}
							onSubmit={commitDescription}
							onBlur={commitDescription}
							onCancel={cancelEdit}
							inputRef={descriptionInputRef}
						/>
					) : (
						<div
							className='headerInlineDescription'
							onClick={() => { if (!readOnly) setEditing('description'); }}
							role={readOnly ? undefined : 'button'}
							tabIndex={readOnly ? undefined : 0}
						>
							{description}
						</div>
					)}
					</>)}
				</div>

				<div className='headerActions'>
					{!readOnly && (
						<button
							className='primaryButton headerPrimaryButton'
							type='button'
							disabled={saveDisabled}
							onClick={openSaveDialog}
						>
							{t('actions.save')}
						</button>
					)}
					<button
						className='iconButton'
						type='button'
						onClick={() => {
							setMenuOpen(false);
							onOpenHistory();
						}}
					>
						<Clock3 size={16} />
					</button>
					<div className='headerActionWrap'>
						<button
							className='iconButton'
							type='button'
							onClick={() => setMenuOpen((prev) => !prev)}
						>
							<MoreHorizontal size={16} />
						</button>
						<HeaderMenu
							open={menuOpen}
							items={headerMenuItems}
							onClose={() => setMenuOpen(false)}
							onSelect={onMenuItemSelect}
						/>
					</div>
				</div>
			</div>
			<HeaderSaveDialog
				open={saveDialogOpen}
				value={saveComment}
				onChange={setSaveComment}
				onClose={closeSaveDialog}
				saveDisabled={saveDisabled}
				onSave={async () => {
					await onSave({ title: name, description, comment: saveComment });
					closeSaveDialog();
				}}
			/>
		</>
	);
}
