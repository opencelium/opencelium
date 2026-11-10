import { Button as AntButton, message } from 'antd';
import { i18n } from '@shared/i18n/config/i18n';
import { isQuiet } from '../../editor/tell';

type Applied = {
	/** Already translated: what was taken over ("3 fields applied"). */
	text: string;
	/** Puts back what the result replaced; returns false when there is nothing left to undo. */
	onUndo: () => boolean | void;
	/** One toast per feature: applying again replaces the toast instead of stacking a second Undo. */
	key: string;
	undoTestId: string;
};

const SHOWN_FOR_SEC = 6;

/**
 * The toast after an AI result was applied, the same for every feature: what changed, and Undo. Applied by Beebot,
 * no toast is shown (Beebot shows nothing for spoken requests); Ctrl+Z or "undo" still work there.
 */
export function notifyAiApplied({ text, onUndo, key, undoTestId }: Applied): void {
	if (isQuiet()) return;
	const t = i18n.getFixedT(i18n.language, 'common');
	const undo = () => {
		message.destroy(key);
		if (onUndo() !== false) message.success({ key, content: t('aiResult.undone') });
	};
	message.success({
		key,
		duration: SHOWN_FOR_SEC,
		content: (
			<span>
				{text}{' '}
				{/* The static message renders outside the app's providers, where the Button primitive cannot resolve its UI kit. */}
				<AntButton type="link" size="small" data-testid={undoTestId} onClick={undo}>{t('aiResult.undo')}</AntButton>
			</span>
		),
	});
}
