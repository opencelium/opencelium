import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { HeaderSaveDialog } from '../header/HeaderSaveDialog/HeaderSaveDialog';
import { headerMenuItems } from '../header/HeaderMenu/headerMenuItems';
import { WorkflowHeaderActions } from './WorkflowHeaderActions';
import { WorkflowHeaderInfo } from './WorkflowHeaderInfo';
import type { WorkflowHeaderProps } from './WorkflowHeader.types';
import { useWorkflowHeaderState } from './useWorkflowHeaderState';

export function WorkflowHeader({
	onOpenHistory, onSave, onMenuItemSelect, menuLoadingItemId,
	saveDisabled = false, readOnly = false, testRunLocked = false, loading = false, schedulesSlot, hasSavedConnection = false, ...stateProps
}: WorkflowHeaderProps) {
	const { t } = useI18n('workflow');
	const state = useWorkflowHeaderState({
		...stateProps,
		onNameCommitted: (title, description) =>
			onSave({ title, description, comment: t('saveDialog.autoNameChangeComment', { name: title }) }),
		onDescriptionCommitted: (title, description) =>
			onSave({ title, description, comment: t('saveDialog.autoDescriptionChangeComment', { description }) }),
	});
	const [saveDialogOpen, setSaveDialogOpen] = useState(false);
	const [saveComment, setSaveComment] = useState('');
	const menuItems = useMemo(
		// The change history walks the in-session undo stack, so it only exists
		// where editing does.
		() => headerMenuItems
			.filter((item) => !(readOnly && item.id === 'change-history'))
			.map((item) => {
				if (testRunLocked && (item.id === 'assign-category' || item.id === 'version-history' || item.id === 'load-template')) {
					return {
						...item,
						disabled: true,
						disabledTooltipKey: 'headerMenu.testRunLockedHint',
					};
				}
				if (item.id === 'download-template') {
					return {
						...item,
						disabled: !hasSavedConnection,
						disabledTooltipKey: 'headerMenu.downloadAsTemplateDisabledHint',
					};
				}
				if (item.id === 'assign-category') {
					return {
						...item,
						disabled: !hasSavedConnection,
						disabledTooltipKey: 'headerMenu.assignCategoryDisabledHint',
					};
				}
				return item;
			}),
		[hasSavedConnection, readOnly, testRunLocked],
	);

	const openSaveDialog = async () => {
		if (await state.prepareSave(t('messages.enterWorkflowName'))) setSaveDialogOpen(true);
	};
	const closeSaveDialog = () => {
		setSaveDialogOpen(false);
		setSaveComment('');
	};

	const openSaveDialogRef = useRef(openSaveDialog);
	openSaveDialogRef.current = openSaveDialog;

	useEffect(() => {
		const handleSaveShortcut = (event: KeyboardEvent) => {
			if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') return;
			event.preventDefault();
			if (readOnly || saveDisabled || saveDialogOpen) return;
			void openSaveDialogRef.current();
		};
		window.addEventListener('keydown', handleSaveShortcut);
		return () => window.removeEventListener('keydown', handleSaveShortcut);
	}, [readOnly, saveDisabled, saveDialogOpen]);

	return (
		<>
			<div className={`headerCard ${state.nameError ? 'headerCardWithInlineError' : ''}`}>
				<div className='headerInlineInfo'>
					<WorkflowHeaderInfo loading={loading} readOnly={readOnly} state={state} />
				</div>
				<WorkflowHeaderActions items={menuItems} loadingItemId={menuLoadingItemId}
					onOpenHistory={onOpenHistory} onMenuItemSelect={onMenuItemSelect}
					onSave={openSaveDialog} readOnly={readOnly} saveDisabled={saveDisabled}
					saveDialogOpen={saveDialogOpen} schedulesSlot={schedulesSlot}
				/>
			</div>
			<HeaderSaveDialog open={saveDialogOpen} value={saveComment}
				onChange={setSaveComment} onClose={closeSaveDialog} saveDisabled={saveDisabled}
				onSave={async () => {
					try {
						await onSave({ title: state.name, description: state.description, comment: saveComment });
					} catch {
						// A rejected save reports itself on the page behind this dialog —
						// a sticky notification, plus a red ring on the node the backend
						// named — so the overlay has to come down for any of it to be
						// seen. The typed comment is kept for the retry.
						setSaveDialogOpen(false);
						return;
					}
					closeSaveDialog();
				}}
			/>
		</>
	);
}
