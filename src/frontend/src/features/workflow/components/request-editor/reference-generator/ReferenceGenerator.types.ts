import type { Connection, MethodWithId } from '../../../types/connection';
import type { ResponseType } from '../body-editor/requestReferenceOptions';

export type ReferenceGeneratorProps = {
	open: boolean;
	connection: Connection | null;
	currentMethod: MethodWithId;
	onClose: () => void;
	onApply: (reference: string) => void;
	resetKey?: number;
	allowResponseTypes?: ResponseType[];
};

export type ReferenceOption = { label: string; value: string };

export type DropdownPosition = { top: number; left: number; width: number };
