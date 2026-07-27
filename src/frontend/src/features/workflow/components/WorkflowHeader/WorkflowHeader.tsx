import { MoreHorizontal } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CommandPalette } from '@widgets/CommandPalette/CommandPalette';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { workflowCommandBridgeStore } from '../../command/workflowCommandBridge';
import { HeaderMenu } from '../header/HeaderMenu';
import { HeaderSaveDialog } from '../header/HeaderSaveDialog';
import { headerMenuItems } from '../header/headerMenuItems';
import { WorkflowHeaderInfo } from './WorkflowHeaderInfo';
import type { WorkflowHeaderProps } from './WorkflowHeader.types';
import { useWorkflowHeaderState } from './useWorkflowHeaderState';

export function WorkflowHeader({
	onOpenHistory, onSave, onMenuItemSelect, menuLoadingItemId,
	saveDisabled = false, readOnly = false, loading = false, schedulesSlot, hasSavedConnection = false, ...stateProps
}: WorkflowHeaderProps) {
	const { t } = useI18n('workflow');
	const state = useWorkflowHeaderState({
		...stateProps,
		onNameCommitted: (title, description) =>
			onSave({ title, description, comment: t('saveDialog.autoNameChangeComment', { name: title }) }),
		onDescriptionCommitted: (title, description) =>
			onSave({ title, description, comment: t('saveDialog.autoDescriptionChangeComment', { description }) }),
	});
	const [menuOpen, setMenuOpen] = useState(false);
	const [saveDialogOpen, setSaveDialogOpen] = useState(false);
	const [saveComment, setSaveComment] = useState('');
	const menuItems = useMemo(
		() => headerMenuItems.map((item) => item.id === 'download-template'
			? {
				...item,
				disabled: !hasSavedConnection,
				disabledTooltipKey: 'headerMenu.downloadAsTemplateDisabledHint',
			}
			: item),
		[hasSavedConnection],
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
				<div className='headerActions'>
					<CommandPalette
						collapsible
						forceMode='modal'
						hideSuccessRecommendations
						onScopeExit={() => workflowCommandBridgeStore.getState().clearSearchHighlights()}
						onEscapeClearScope={() => {
							const bridge = workflowCommandBridgeStore.getState();
							if (saveDialogOpen || bridge.hasOpenDialog()) return false;
							if (!bridge.hasSearchHighlights()) return false;
							bridge.clearSearchHighlights();
							return true;
						}}
					/>
					{schedulesSlot}
					{!readOnly && (
						<button className='primaryButton headerPrimaryButton' type='button'
							disabled={saveDisabled} onClick={openSaveDialog} data-testid='workflow-save'>
							{t('actions.save')}
						</button>
					)}
					<div className='headerActionWrap'>
						<button className='iconButton' type='button' data-testid='workflow-menu'
							onClick={() => setMenuOpen((open) => !open)}>
							<MoreHorizontal size={16} />
						</button>
						<HeaderMenu open={menuOpen} items={menuItems}
							onClose={() => setMenuOpen(false)}
							onSelect={(item) => item.id === 'version-history'
								? onOpenHistory() : onMenuItemSelect?.(item)}
							loadingItemId={menuLoadingItemId}
						/>
					</div>
				</div>
			</div>
			<HeaderSaveDialog open={saveDialogOpen} value={saveComment}
				onChange={setSaveComment} onClose={closeSaveDialog} saveDisabled={saveDisabled}
				onSave={async () => {
					await onSave({ title: state.name, description: state.description, comment: saveComment });
					closeSaveDialog();
				}}
			/>
		</>
	);
}
