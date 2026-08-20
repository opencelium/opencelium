import { MoreHorizontal } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { CommandPalette } from '@widgets/CommandPalette/CommandPalette';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { WorkflowHeaderMenuItem } from '../../types/workflow.types';
import { workflowCommandBridgeStore } from '../../command/workflowCommandBridge';
import { HeaderMenu } from '../header/HeaderMenu/HeaderMenu';

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
};

export function WorkflowHeaderActions({
	items, loadingItemId, onOpenHistory, onMenuItemSelect, onSave,
	readOnly, saveDisabled, saveDialogOpen, schedulesSlot,
}: Props) {
	const { t } = useI18n('workflow');
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<div className='headerActions'>
			<CommandPalette collapsible forceMode='modal' hideSuccessRecommendations
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
					disabled={saveDisabled} onClick={onSave} data-testid='workflow-save'>
					{t('actions.save')}
				</button>
			)}
			<div className='headerActionWrap'>
				<button className='iconButton' type='button' data-testid='workflow-menu'
					onClick={() => setMenuOpen((open) => !open)}>
					<MoreHorizontal size={16} />
				</button>
				<HeaderMenu open={menuOpen} items={items} onClose={() => setMenuOpen(false)}
					onSelect={(item) => item.id === 'version-history'
						? onOpenHistory() : onMenuItemSelect?.(item)}
					loadingItemId={loadingItemId}
				/>
			</div>
		</div>
	);
}
