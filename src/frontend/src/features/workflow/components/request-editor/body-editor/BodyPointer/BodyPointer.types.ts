import type { Connection, MethodWithId } from '../../../../types/connection';

export type BodyPointerProps = {
	pointer: string;
	pointers: string[];
	submitEdit?: () => void;
	onClick?: (event?: unknown) => void;
	onRemove?: (pointer: string, pointers: string[]) => void;
	onEdit?: (pointer: string, pointers: string[], reference: string) => void;
	connection?: Connection;
	currentMethod?: MethodWithId;
};
