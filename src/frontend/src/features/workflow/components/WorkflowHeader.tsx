import { Clock3, MoreHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { HeaderEditableField } from './header/HeaderEditableField';
import { HeaderMenu } from './header/HeaderMenu';
import { HeaderSaveDialog } from './header/HeaderSaveDialog';
import { headerMenuItems } from './header/headerMenuItems';

type Props = {
	initialName?: string;
	initialDescription?: string;
	onOpenHistory: () => void;
	onSave: (values: { title: string; description: string; comment: string }) => void | Promise<void>;
	readOnly?: boolean;
};
type EditField = 'name' | 'description' | null;

export function WorkflowHeader({ initialName = 'i-doit 2 Znuny example', initialDescription = 'This interface delivering data into znuny and creates a ticket if the specified object is missing.', onOpenHistory, onSave, readOnly = false }: Props) {
	const [name, setName] = useState(initialName);
	const [description, setDescription] = useState(initialDescription);
	const [draftName, setDraftName] = useState(name);
	const [draftDescription, setDraftDescription] = useState(description);
	const [editing, setEditing] = useState<EditField>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const [saveDialogOpen, setSaveDialogOpen] = useState(false);
	const [saveComment, setSaveComment] = useState('');
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

	const closeSaveDialog = () => {
		setSaveDialogOpen(false);
		setSaveComment('');
	};

	return (
		<>
			<div className='headerCard'>
				<div className='headerInlineInfo'>
					{editing === 'name' ? (
						<HeaderEditableField
							className='headerInlineNameInput'
							value={draftName}
							onChange={setDraftName}
							onSubmit={() => {
								setName(draftName.trim() || name);
								setEditing(null);
							}}
							onCancel={cancelEdit}
							inputRef={nameInputRef}
						/>
					) : (
						<div
							className='headerInlineName'
							onClick={() => { if (!readOnly) setEditing('name'); }}
							role={readOnly ? undefined : 'button'}
							tabIndex={readOnly ? undefined : 0}
						>
							{name}
						</div>
					)}
					<div className='headerInlineDivider'>-</div>
					{editing === 'description' ? (
						<HeaderEditableField
							className='headerInlineDescriptionInput headerInlineEditorWide'
							value={draftDescription}
							onChange={setDraftDescription}
							onSubmit={() => {
								setDescription(draftDescription.trim() || description);
								setEditing(null);
							}}
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
				</div>

				<div className='headerActions'>
					{!readOnly && (
						<button
							className='primaryButton headerPrimaryButton'
							type='button'
							onClick={() => setSaveDialogOpen(true)}
						>
							Save
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
						/>
					</div>
				</div>
			</div>
			<HeaderSaveDialog
				open={saveDialogOpen}
				value={saveComment}
				onChange={setSaveComment}
				onClose={closeSaveDialog}
				onSave={async () => {
					await onSave({ title: name, description, comment: saveComment });
					closeSaveDialog();
				}}
			/>
		</>
	);
}
