// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { isInEditorPopupLayer } from './editorPopupLayers';

const inside = (className: string) => {
	const layer = document.createElement('div');
	layer.className = className;
	const link = document.createElement('a');
	layer.appendChild(link);
	return link;
};

describe('isInEditorPopupLayer', () => {
	it('keeps the editor open for its dropdowns, tooltips and the webhook dialog', () => {
		for (const className of ['ant-select-dropdown', 'ant-tooltip', 'MuiTooltip-popper', 'bodyLegacyWebhookModalRoot']) {
			expect(isInEditorPopupLayer(inside(className))).toBe(true);
		}
	});

	it('closes it for anything else', () => {
		expect(isInEditorPopupLayer(inside('workflowCanvas'))).toBe(false);
		expect(isInEditorPopupLayer(null)).toBe(false);
	});
});
