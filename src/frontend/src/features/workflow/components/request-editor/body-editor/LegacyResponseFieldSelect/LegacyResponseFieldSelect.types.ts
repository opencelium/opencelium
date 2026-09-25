import type { MethodWithId } from '../../../../types/connection';
import type { ResponseType } from '../requestReferenceOptions';

export type LegacyResponseFieldSelectProps = {
	method?: MethodWithId;
	type: ResponseType;
	value?: string;
	disabled?: boolean;
	iterators?: string[];
	onChange: (value?: string) => void;
};
