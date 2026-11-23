import type { Ace } from 'ace-builds';
import type { ImportCall } from './enhancementImports.utils';

// Inserts the call at the cursor and selects its first placeholder, so typing replaces it.
export function insertCall(editor: Ace.Editor | null, call: ImportCall) {
	if (!editor) return;
	const { row, column } = editor.getCursorPosition();
	editor.insert(call.text);
	if (call.selection) {
		editor.selection.setSelectionRange({
			start: { row, column: column + call.selection.start },
			end: { row, column: column + call.selection.end },
		});
	}
	editor.focus();
}
