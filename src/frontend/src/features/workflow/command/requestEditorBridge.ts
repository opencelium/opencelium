import { create } from 'zustand';
import type { RequestMessageProperty } from '../components/request-editor/body-editor/bodyBinding.types';

export type OpenTransformationResult =
	| { kind: 'opened'; enhanceId: string }
	| { kind: 'unknown-field' }
	| { kind: 'no-reference' };

/** The body or header editor open in the method dialog, as far as a request from outside (Beebot) needs it. */
export type OpenRequestEditor = {
	/** The method's node id. */
	methodId: string;
	methodLabel: string;
	messageProperty: RequestMessageProperty;
	/** The editor's fields as paths (`ConfigItem.CIXMLData.Vendor`), as they are now. */
	fieldPaths: () => string[];
	/** The field selected in the editor (whose transformation shows), as a path; null when none is. */
	selectedFieldPath: () => string | null;
	/** Selects the field and shows its transformation, creating it for a field that holds a reference. */
	openTransformation: (path: string) => OpenTransformationResult;
};

type RequestEditorBridge = {
	editor: OpenRequestEditor | null;
	/** Returns the unregister for the editor's unmount; a newer editor is not unregistered by an older one. */
	register: (editor: OpenRequestEditor) => () => void;
};

export const requestEditorBridgeStore = create<RequestEditorBridge>((set, get) => ({
	editor: null,
	register: (editor) => {
		set({ editor });
		return () => {
			if (get().editor === editor) set({ editor: null });
		};
	},
}));
