import type { Connection, MethodWithId } from '../../../../types/connection';

export type LegacyBodyReferenceGeneratorProps = {
	connection: Connection;
	currentMethod: MethodWithId;
	onApply: (reference: string) => void;
	showWebhookOption?: boolean;
	/**
	 * Move focus to the method picker as soon as this appears. For a generator that a
	 * button reveals — the endpoint editor's "Insert Reference" — where the click that
	 * opened it should land the caret in the first thing to fill in. Left off for the
	 * body editor, which renders generators inline and would otherwise have several
	 * of them competing for focus on mount.
	 */
	autoFocus?: boolean;
};
