import type { ExecutionPlaygroundLocation } from './executionPlayground';

type EditorPlaygroundOpener = {
	connectionId: number;
	open: (location: ExecutionPlaygroundLocation) => void;
};

// The logs dialog is hosted outside the route tree, so it cannot see the editor's
// context. An open editor registers here so the dialog opens the Playground in it
// instead of navigating to the route it is already on, which would raise the
// unsaved-changes prompt although nothing would be discarded.
let current: EditorPlaygroundOpener | null = null;

export function registerEditorPlaygroundOpener(opener: EditorPlaygroundOpener): () => void {
	current = opener;
	return () => {
		if (current === opener) current = null;
	};
}

export const findEditorPlaygroundOpener = (connectionId: number) =>
	current?.connectionId === connectionId ? current.open : null;
