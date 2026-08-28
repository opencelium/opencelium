import type { Connection, MethodWithId } from '../../../../types/connection';

export type LegacyBodyReferenceGeneratorProps = {
	connection: Connection;
	currentMethod: MethodWithId;
	onApply: (reference: string) => void;
	showWebhookOption?: boolean;
	/** Preselects the method to read from, and re-selects it whenever it changes
	 *  — for a host that has already asked which method it is (the delete
	 *  dialog's "read them all from one method"), so the question is not put a
	 *  second time in every field row. The field is cleared with it: a path
	 *  belongs to the method it was picked on. */
	defaultMethodId?: string;
	/** The reference this generator is currently editing, shown in its own
	 *  controls — method, response part and path — rather than replacing them
	 *  with the text of the answer. A host that keeps the generator on screen
	 *  after an answer (the delete dialog's table) needs the controls to say
	 *  what that answer is; one that dismisses it has nothing to pass. */
	value?: string;
	/** Shows the reference rather than offering to change it: every control
	 *  disabled, nothing to apply. For a host that wants a reference displayed
	 *  the way it is authored — the delete dialog's "current reference", read
	 *  beside the one that will replace it. */
	readOnly?: boolean;
	/** Drops the method select, for a host where the method is a given rather
	 *  than a question — the delete dialog's current reference always names the
	 *  method being deleted, which the row above the table already says. */
	showMethod?: boolean;
	/** Names the part of the response in a word instead of offering the B/H/S
	 *  switch — for a host where it is a fact to read rather than a choice. The
	 *  word is the one the reference itself uses (`body`, `header`, `status`),
	 *  so it reads as part of the reference rather than as a label for it. */
	responsePartAsText?: boolean;
	/** Bump to start this generator over — the same reset `defaultMethodId`
	 *  performs when it changes, for a host whose answer did not change value:
	 *  picking the option that is already selected is still an answer, and one
	 *  the underlying select cannot report as a change. */
	resetKey?: number;
	/** Applies as soon as a whole reference has been picked, and drops the apply
	 *  button with it. For a host where the generator is one control among
	 *  several — the delete dialog's table of fields — a button that has to be
	 *  found and pressed after the last dropdown closes reads as an extra step,
	 *  and leaving it unpressed silently loses the answer. Only a path that
	 *  cannot be expanded further counts as whole: the field picker drills in
	 *  one level at a time, and applying at `body.$.user` would take the
	 *  generator away before `body.$.user.id` could be reached. */
	applyOnSelect?: boolean;
	/** Stacking for the popups this generator opens, which are rendered on
	 *  `document.body`. Defaults to clearing the method dialog it normally lives
	 *  in; a host that stacks higher has to say so. */
	popupZIndex?: number;
};
