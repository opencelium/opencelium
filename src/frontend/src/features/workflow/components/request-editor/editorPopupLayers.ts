// Layers that render in portals outside a reference editor but belong to it: select dropdowns,
// date pickers, the webhook dialog, and the tooltips of its own fields (the reference feedback
// tooltip carries a docs link). A mouse-down inside one must not close the editor.
const EDITOR_POPUP_LAYERS = [
	'.ant-select-dropdown',
	'.ant-picker-dropdown',
	'.ant-tooltip',
	'.MuiTooltip-popper',
	'.bodyLegacyWebhookModalRoot',
	'.ant-modal-wrap .bodyLegacyWebhookModal',
].join(', ');

export const isInEditorPopupLayer = (target: Element | null) => !!target?.closest(EDITOR_POPUP_LAYERS);
