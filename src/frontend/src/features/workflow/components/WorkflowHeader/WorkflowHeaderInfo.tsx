import { HeaderEditableField } from '../header/HeaderEditableField';
import { EMPTY_NAME_LABEL } from './useWorkflowHeaderState';

type Props = {
	loading: boolean;
	readOnly: boolean;
	state: ReturnType<typeof import('./useWorkflowHeaderState').useWorkflowHeaderState>;
};

export function WorkflowHeaderInfo({ loading, readOnly, state }: Props) {
	if (loading) return <span className='headerInlineLoading' aria-hidden />;

	return (
		<>
			{state.editing === 'name' ? (
				<div className='headerInlineFieldWrap'>
					<HeaderEditableField
						className={`headerInlineNameInput ${state.nameError ? 'headerInlineInputError' : ''}`}
						value={state.draftName}
						onChange={state.setDraftName}
						onSubmit={state.commitName}
						onBlur={state.commitName}
						onCancel={state.cancelEdit}
						loading={state.isCheckingName}
						inputRef={state.nameInputRef}
					/>
					{state.nameError && <div className='headerInlineErrorMessage'>{state.nameError}</div>}
				</div>
			) : (
				<div className='headerInlineFieldWrap'>
					<div
						className={`headerInlineName ${state.nameError ? 'headerInlineErrorText' : ''}`}
						onClick={() => !readOnly && state.setEditing('name')}
						role={readOnly ? undefined : 'button'}
						tabIndex={readOnly ? undefined : 0}
					>
						{state.name || EMPTY_NAME_LABEL}
					</div>
					{state.nameError && <div className='headerInlineErrorMessage'>{state.nameError}</div>}
				</div>
			)}
			<div className='headerInlineDivider'>-</div>
			{state.editing === 'description' ? (
				<HeaderEditableField
					className='headerInlineDescriptionInput headerInlineEditorWide'
					value={state.draftDescription}
					onChange={state.setDraftDescription}
					onSubmit={state.commitDescription}
					onBlur={state.commitDescription}
					onCancel={state.cancelEdit}
					inputRef={state.descriptionInputRef}
				/>
			) : (
				<div
					className='headerInlineDescription'
					onClick={() => !readOnly && state.setEditing('description')}
					role={readOnly ? undefined : 'button'}
					tabIndex={readOnly ? undefined : 0}
				>
					{state.description}
				</div>
			)}
		</>
	);
}
