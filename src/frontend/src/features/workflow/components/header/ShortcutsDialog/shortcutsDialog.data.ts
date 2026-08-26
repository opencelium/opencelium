import type { ShortcutGroup } from './ShortcutsDialog.types';

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
	{
		titleKey: 'shortcutsDialog.groups.canvas',
		items: [
			{ keys: ['drag'], descKey: 'shortcutsDialog.items.pan' },
			{ keys: ['scroll'], descKey: 'shortcutsDialog.items.zoom' },
		],
	},
	{
		titleKey: 'shortcutsDialog.groups.nodes',
		items: [
			{ keys: ['doubleClick'], descKey: 'shortcutsDialog.items.openConfig' },
			{ keys: ['drag'], descKey: 'shortcutsDialog.items.moveNode' },
			{ keys: ['ctrl', 'drag'], descKey: 'shortcutsDialog.items.duplicate' },
			{ keys: ['ctrl', 'click'], descKey: 'shortcutsDialog.items.multiSelect' },
			{ keys: ['delete'], descKey: 'shortcutsDialog.items.deleteNode' },
		],
	},
	{
		titleKey: 'shortcutsDialog.groups.general',
		items: [
			{ keys: ['ctrl', 's'], descKey: 'shortcutsDialog.items.save' },
			{ keys: ['ctrl', 'z'], descKey: 'shortcutsDialog.items.undo' },
			{ keys: ['ctrl', 'redo'], descKey: 'shortcutsDialog.items.redo' },
			{ keys: ['esc'], descKey: 'shortcutsDialog.items.close' },
			{ keys: ['esc'], descKey: 'shortcutsDialog.items.dismissError' },
		],
	},
];
