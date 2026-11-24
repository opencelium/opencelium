import { describe, expect, it } from 'vitest';
import { menuByType, type NodeMenuActionId } from './contextMenuData';

const actionIds = (kind: string): NodeMenuActionId[] => (menuByType[kind] ?? []).flatMap((section) =>
	section.rows.flatMap((row) => row.kind === 'action' ? [row.action.id] : row.actions.map((action) => action.id)));

describe('context menu clipboard entries', () => {
	it.each(['connector', 'system', 'trigger-connection', 'if', 'loop'])('offers copy and paste on %s steps', (kind) => {
		expect(actionIds(kind)).toEqual(expect.arrayContaining(['copy', 'paste']));
	});

	it('offers only paste on the start step', () => {
		expect(actionIds('start')).toEqual(['paste']);
	});
});
