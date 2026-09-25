import type { MethodWithId } from '../../../types/connection';

export type MethodSelectProps = {
	methods: MethodWithId[];
	selectedMethod?: MethodWithId;
	value?: string;
	onChange: (value?: string) => void;
};

export type MethodSelectOption = {
	connectorTitle?: string;
	color?: string;
	dupIndex?: number;
	method: MethodWithId;
};
