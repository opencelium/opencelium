import type { Connection, MethodWithId } from '../../../../types/connection';

export type BodyReferenceTriggerRect = {
	left: number;
	top: number;
	width: number;
	height: number;
	containerLeft?: number;
	containerRight?: number;
};

export type InlineBodyReferenceEditorProps = {
	referenceId: string;
	connection: Connection;
	currentMethod: MethodWithId;
	submitEdit: () => void;
	onClose?: () => void;
};
