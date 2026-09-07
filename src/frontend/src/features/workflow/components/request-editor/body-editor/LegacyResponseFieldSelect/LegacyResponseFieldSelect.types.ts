import type { MethodWithId } from '../../../../types/connection';
import type { ResponseType } from '../requestReferenceOptions';

export type LegacyResponseFieldSelectProps = {
	method?: MethodWithId;
	type: ResponseType;
	value?: string;
	disabled?: boolean;
	iterators?: string[];
	/** Stacking for the options popup, which is rendered on `document.body` and
	 *  so is stacked against the whole page rather than against whatever opened
	 *  it. The default clears the method dialog this picker normally lives in; a
	 *  host that stacks higher — the confirm dialog, at 20000 — has to say so or
	 *  its own popup opens behind it. */
	popupZIndex?: number;
	onChange: (value?: string) => void;
};
