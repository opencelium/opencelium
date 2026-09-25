/**
 * Text-entry targets that own their keystrokes: while focus is inside one of
 * these, the browser's native editing behaviour (its own undo stack, Delete
 * within the text) must win over the canvas-level shortcuts.
 */
export const EDITABLE_TARGET_SELECTOR =
	'input, textarea, select, [contenteditable="true"], .ace_editor';
