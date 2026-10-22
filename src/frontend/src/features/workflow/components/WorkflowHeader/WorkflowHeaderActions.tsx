import { MoreHorizontal } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { CommandPalette } from '@widgets/CommandPalette/CommandPalette';
import { UserActions } from '@widgets/UserActions/UserActions';
import { useBreakpoints } from '@app/hooks/useBreakpoints';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { WorkflowHeaderMenuItem } from '../../types/workflow.types';
import { workflowCommandBridgeStore } from '../../command/workflowCommandBridge';
import { HeaderMenu } from '../header/HeaderMenu/HeaderMenu';
import { useWorkflowSearchShortcut } from '../../hooks/useWorkflowSearchShortcut';

// The editor header also carries the name, search, schedules and Save, so the user actions fold away well before the app's tablet breakpoint.
const COMPACT_USER_ACTIONS_MAX_WIDTH = 1500;
// Below this the header can't spare room for the schedules pill or the profile icon: schedules moves into the `…` menu, the profile actions are dropped.
const MENU_ONLY_BELOW_WIDTH = 700;

const SCHEDULES_MENU_ITEM: WorkflowHeaderMenuItem = { id: 'schedules', labelKey: 'headerMenu.schedules', section: 'schedules' };

type Props = {
	items: WorkflowHeaderMenuItem[];
	loadingItemId?: string | null;
	onOpenHistory: () => void;
	onMenuItemSelect?: (item: WorkflowHeaderMenuItem) => void;
	onSave: () => void | Promise<void>;
	readOnly: boolean;
	saveDisabled: boolean;
	saveDialogOpen: boolean;
	schedulesSlot?: ReactNode;
	problemsSlot?: ReactNode;
	onToggleSchedules?: () => void;
};

export function WorkflowHeaderActions({
	items, loadingItemId, onOpenHistory, onMenuItemSelect, onSave,
	readOnly, saveDisabled, saveDialogOpen, schedulesSlot, problemsSlot, onToggleSchedules,
}: Props) {
	const { t } = useI18n('workflow');
	const { width } = useBreakpoints();
	const [menuOpen, setMenuOpen] = useState(false);
	const isMenuOnly = width < MENU_ONLY_BELOW_WIDTH;
	const menuItems = isMenuOnly && onToggleSchedules ? [SCHEDULES_MENU_ITEM, ...items] : items;
	const selectMenuItem = (item: WorkflowHeaderMenuItem) => {
		if (item.id === 'schedules') onToggleSchedules?.();
		else if (item.id === 'version-history') onOpenHistory();
		else onMenuItemSelect?.(item);
	};
	const [searchRequestId, setSearchRequestId] = useState(0);
	useWorkflowSearchShortcut({
		disabled: saveDialogOpen || workflowCommandBridgeStore.getState().hasOpenDialog(),
		onOpenSearch: () => setSearchRequestId((current) => current + 1),
	});
	const scopeActivation = useMemo(() => ({
		requestId: searchRequestId,
		scope: 'workflow',
		inputValue: 'search ',
	}), [searchRequestId]);

	return (
		<div className='headerActions'>
			<CommandPalette collapsible forceMode='modal' hideSuccessRecommendations
				scopeActivation={scopeActivation}
				onScopeExit={() => workflowCommandBridgeStore.getState().clearSearchHighlights()}
				onEscapeClearScope={() => {
					const bridge = workflowCommandBridgeStore.getState();
					if (saveDialogOpen || bridge.hasOpenDialog()) return false;
					if (!bridge.hasSearchHighlights()) return false;
					bridge.clearSearchHighlights();
					return true;
				}}
			/>
			{!isMenuOnly && (
				<>
					{schedulesSlot}
					<UserActions layout={width <= COMPACT_USER_ACTIONS_MAX_WIDTH ? 'compact' : 'inline'} tours='workflow'
						newFeatureId='workflow-header-user-actions' />
					<span className='headerActionsDivider' aria-hidden />
				</>
			)}
			{problemsSlot}
			{!readOnly && (
				<button className='primaryButton headerPrimaryButton' type='button'
					disabled={saveDisabled} onClick={onSave} data-testid='workflow-save'>
					{t('actions.save')}
				</button>
			)}
			<div className='headerActionWrap'>
				<button className='iconButton' type='button' data-testid='workflow-menu'
					onClick={() => setMenuOpen((open) => !open)}>
					<MoreHorizontal size={16} />
				</button>
				<HeaderMenu open={menuOpen} items={menuItems} onClose={() => setMenuOpen(false)}
					onSelect={selectMenuItem}
					loadingItemId={loadingItemId}
				/>
			</div>
		</div>
	);
}
