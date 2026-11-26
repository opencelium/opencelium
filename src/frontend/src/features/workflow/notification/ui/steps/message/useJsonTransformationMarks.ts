import { useEffect, useEffectEvent, useRef } from 'react';
import type { Ace } from 'ace-builds';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { hasReference } from '../../../model/notificationBody';
import { listJsonStringFields, replaceJsonValue, type JsonReferenceField } from '../../../model/notificationBodyPath';
import { getTransformationAvailability } from '../../../model/notificationTransformation';
import type { JsonTransformTarget } from '../../../model/notificationTransformTargets';
import { useNotificationTransformations } from '../../transformation/notificationTransformationContextValue';

type MarkState = 'available' | 'transformed' | 'invalid';

export type JsonTransformationMark = {
	row: number;
	field: JsonReferenceField;
	target: JsonTransformTarget;
	state: MarkState;
	enhanceId?: string;
};

const MARK_CLASS = 'notificationJsonMark';

const rowOf = (text: string, offset: number) => {
	let row = 0;
	for (let index = text.indexOf('\n'); index !== -1 && index < offset; index = text.indexOf('\n', index + 1)) row += 1;
	return row;
};

// One mark per line: a transformed value wins over one that could be transformed.
const onePerRow = (marks: JsonTransformationMark[]) => {
	const byRow = new Map<number, JsonTransformationMark>();
	marks.forEach((mark) => {
		const current = byRow.get(mark.row);
		if (!current || (current.state === 'available' && mark.state !== 'available')) byRow.set(mark.row, mark);
	});
	return [...byRow.values()];
};

type Args = {
	editor: Ace.Editor | null;
	text: string;
	isEnabled: boolean;
	onChange: (text: string) => void;
	/** Where the broken references stand: a value holding one is not offered a transformation. */
	broken: readonly { start: number; end: number }[];
	/** A transformed value's mark offers its actions in a menu rather than acting at once. */
	onOpenMenu: (mark: JsonTransformationMark) => void;
};

/**
 * Marks the lines of hand-edited JSON whose text value can be, or is, computed by a script, in the
 * editor's gutter. Clicking a mark turns the value into a transformation, or opens the menu of one.
 */
export function useJsonTransformationMarks({ editor, text, isEnabled, onChange, broken, onOpenMenu }: Args) {
	const { t } = useI18n('workflow');
	const { getEnhanceId, add, syncInputs, isReadOnly } = useNotificationTransformations();

	// Every text value, not only those with a reference: a transformed value whose reference was
	// mistyped away keeps its (warning) mark, so the transformation does not vanish unseen.
	const marks = onePerRow(isEnabled ? (listJsonStringFields(text) ?? []).flatMap((field): JsonTransformationMark[] => {
		const target: JsonTransformTarget = { kind: 'json', path: field.path };
		const enhanceId = getEnhanceId(target);
		if (!enhanceId && !hasReference(field.value)) return [];
		const hasBroken = broken.some((item) => item.start >= field.start && item.end <= field.end);
		const isAvailable = !hasBroken && getTransformationAvailability(field.value) === 'ok';
		if (enhanceId) return [{ row: rowOf(text, field.start), field, target, enhanceId, state: isAvailable ? 'transformed' : 'invalid' }];
		return isAvailable && !isReadOnly ? [{ row: rowOf(text, field.start), field, target, state: 'available' }] : [];
	}) : []);

	const titleOf = (state: MarkState) => {
		switch (state) {
			case 'available': return t('notification.transformation.add');
			case 'transformed': return t('notification.transformation.json.edit');
			case 'invalid': return t('notification.transformation.needsStepReference');
			default: {
				const _exhaustive: never = state;
				return _exhaustive;
			}
		}
	};

	// Ace calls this from the gutter widget its effect registered, with the marks of the latest render.
	const onMarkClick = useEffectEvent((row: number) => {
		const mark = marks.find((item) => item.row === row);
		if (!mark) return;
		if (mark.enhanceId) {
			onOpenMenu(mark);
			return;
		}
		const next = add(mark.target, mark.field.value);
		if (next !== null) onChange(replaceJsonValue(text, mark.field, next));
	});

	const widgets = marks.map((mark) => ({ row: mark.row, state: mark.state, title: titleOf(mark.state) }));
	const widgetsKey = JSON.stringify(widgets);
	useEffect(() => {
		if (!editor) return undefined;
		const session = editor.session;
		const apply = () => widgets.forEach(({ row, state, title }) => session.addGutterCustomWidget(row, {
			className: `${MARK_CLASS} ${MARK_CLASS}--${state}`, label: title, title,
			callbacks: { onClick: (_event: Event, clickedRow: number) => onMarkClick(clickedRow) },
		}));
		try {
			apply();
		} catch {
			// Ace looks the row up among the rendered gutter cells, which do not exist before the first render.
			editor.renderer.once('afterRender', apply);
		}
		return () => widgets.forEach(({ row }) => session.removeGutterCustomWidget(row));
		// eslint-disable-next-line react-hooks/exhaustive-deps -- widgetsKey stands for widgets
	}, [editor, widgetsKey]);

	// The script's inputs follow the references typed into a transformed value. A value seen for
	// the first time is only remembered, so opening the dialog leaves the bindings untouched.
	const seenRef = useRef(new Map<string, string>());
	useEffect(() => {
		marks.forEach(({ enhanceId, field, target }) => {
			if (!enhanceId) return;
			const seen = seenRef.current.get(enhanceId);
			seenRef.current.set(enhanceId, field.value);
			if (seen !== undefined && seen !== field.value) syncInputs(target, field.value);
		});
	});

	return marks;
}
