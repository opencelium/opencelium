import { ControlButton } from '@xyflow/react';
import { Icon } from '@shared/ui/primitives/Icon';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type BindingLensControlsProps = {
	lensOpen: boolean;
	tableOpen: boolean;
	onToggleLens: () => void;
	onToggleTable: () => void;
};

/**
 * The two ways into the same data — the arcs on the canvas and the list of every
 * binding in the workflow — as members of the flow's own control strip, below
 * the zoom buttons. Either can be open without the other.
 *
 * `ControlButton` rather than the IconButton primitive: these have to be the
 * same control as the zoom buttons beside them (a button inside a button is not
 * an option), so the glyph comes from the Icon primitive and the button, its
 * hover and its focus come from the strip. `title` over a Tooltip for the same
 * reason — it is what xyflow's own controls carry, and a Tooltip's wrapper span
 * would make this button the only one that is not a direct child of the strip.
 */
export function BindingLensControls({ lensOpen, tableOpen, onToggleLens,
	onToggleTable }: BindingLensControlsProps) {
	const { t } = useI18n('workflow');
	const lensLabel = t(lensOpen ? 'bindingLens.hide' : 'bindingLens.show');
	const tableLabel = t(tableOpen ? 'bindingLens.tableHide' : 'bindingLens.tableShow');

	return (
		<>
			<ControlButton
				className={lensOpen ? 'workflowControlsButtonActive' : ''}
				onClick={onToggleLens}
				title={lensLabel}
				aria-label={lensLabel}
				data-testid='workflow-binding-lens-toggle'
			>
				<Icon name='bindings' size={14} color='inherit' />
			</ControlButton>
			<ControlButton
				className={tableOpen ? 'workflowControlsButtonActive' : ''}
				onClick={onToggleTable}
				title={tableLabel}
				aria-label={tableLabel}
				data-testid='workflow-binding-table-toggle'
			>
				<Icon name='list' size={14} color='inherit' />
			</ControlButton>
		</>
	);
}
