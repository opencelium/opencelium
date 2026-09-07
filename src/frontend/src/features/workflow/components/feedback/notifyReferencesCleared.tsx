import { notification } from 'antd';
import { Button } from '@shared/ui/primitives/Button';

/** One at a time: a second delete replaces the first toast rather than stacking
 *  another undo the user has to choose between. */
const KEY = 'workflow-references-cleared';
/** Long for a toast, because it is an offer to act rather than a statement —
 *  the user has to read three step names and decide before it goes. */
const DURATION_SEC = 12;

type Params = {
	/** Already translated — the call site holds the count and the step names. */
	title: string;
	description: string;
	undoLabel: string;
	onUndo: () => void;
};

/**
 * What a delete cost, said once it has happened, with the way back attached.
 * The confirm dialog says the same thing beforehand, but it is gone by the time
 * the canvas shows the result, and the references it cleared leave no trace on
 * screen — the steps that read them simply have one fewer.
 *
 * A notification rather than a `message`, for the reason notifyError gives: a
 * message has no room for an action and expires on a timer that a user looking
 * at the canvas will miss.
 */
export const notifyReferencesCleared = ({ title, description, undoLabel, onUndo }: Params) =>
	notification.warning({
		key: KEY,
		message: title,
		description,
		duration: DURATION_SEC,
		btn: (
			<Button
				type='link'
				onClick={() => {
					notification.destroy(KEY);
					onUndo();
				}}
				testId='workflow-references-cleared-undo'
			>
				{undoLabel}
			</Button>
		),
	});
