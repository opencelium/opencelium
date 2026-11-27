import { useEffect, useState } from 'react';
import AceEditor from 'react-ace';
import { Range, type Ace } from 'ace-builds';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-tomorrow';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useTheme } from '@shared/theme/hooks/useTheme';
import { toBindingPath } from '../../../model/notificationBodyPath';
import { NotificationReferencePicker } from '../../references/NotificationReferencePicker';
import { ReferenceInsertButton } from '../../references/ReferenceInsertButton';
import { useNotificationTransformations } from '../../transformation/notificationTransformationContextValue';
import { TransformationEditor } from '../../transformation/TransformationEditor';
import { JsonTransformationMenu, type JsonTransformationMenuState } from './JsonTransformationMenu';
import { useBrokenReferenceMessage, useBrokenReferences } from './useBrokenReferences';
import { useJsonTransformationMarks, type JsonTransformationMark } from './useJsonTransformationMarks';

const PICKER_ID = 'notification-json-body';

type Props = {
	value: string;
	onChange: (value: string) => void;
	isReadOnly?: boolean;
	/** Hand-edited JSON only: until then the editor fields carry the transformations. */
	canTransform?: boolean;
};

export function MessageJsonEditor({ value, onChange, isReadOnly, canTransform = false }: Props) {
	const { t } = useI18n('workflow');
	const { themeMode } = useTheme();
	const [editor, setEditor] = useState<Ace.Editor | null>(null);
	const { openEditorId, setOpenEditorId, remove } = useNotificationTransformations();
	const [menu, setMenu] = useState<JsonTransformationMenuState | null>(null);
	const openMenu = (mark: JsonTransformationMark) => {
		if (!editor || !mark.enhanceId) return;
		const line = editor.renderer.textToScreenCoordinates(mark.row, 0);
		setMenu({ enhanceId: mark.enhanceId, target: mark.target, anchor: {
			left: editor.container.getBoundingClientRect().left + editor.renderer.gutterWidth,
			top: line.pageY,
			height: editor.renderer.lineHeight,
		} });
	};
	const broken = useBrokenReferences(value);
	const marks = useJsonTransformationMarks({ editor, text: value, isEnabled: canTransform, onChange, broken, onOpenMenu: openMenu });

	// The menu is pinned to where the line was: scrolling the editor would leave it pointing elsewhere.
	useEffect(() => {
		if (!editor || !menu) return undefined;
		const close = () => setMenu(null);
		editor.session.on('changeScrollTop', close);
		return () => { editor.session.off('changeScrollTop', close); };
	}, [editor, menu]);
	const describeBroken = useBrokenReferenceMessage();
	const brokenAnnotations = broken.map((item) => ({ start: item.start, end: item.end, text: `${item.token}\n${describeBroken(item)}` }));
	const brokenKey = JSON.stringify(brokenAnnotations);
	// Each broken reference: an error in the gutter (its text on hover) and a wavy underline.
	useEffect(() => {
		if (!editor) return undefined;
		const { session } = editor;
		const markerIds = brokenAnnotations.map(({ start, end }) => {
			const from = session.doc.indexToPosition(start, 0);
			const to = session.doc.indexToPosition(end, 0);
			return session.addMarker(new Range(from.row, from.column, to.row, to.column), 'notificationJsonBrokenReference', 'text', false);
		});
		session.setAnnotations(brokenAnnotations.map(({ start, text }) => ({
			row: session.doc.indexToPosition(start, 0).row, column: 0, text, type: 'error' })));
		return () => {
			markerIds.forEach((id) => session.removeMarker(id));
			session.clearAnnotations();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- brokenKey stands for brokenAnnotations
	}, [editor, brokenKey]);
	const openMark = marks.find((mark) => mark.enhanceId && mark.enhanceId === openEditorId);

	return (
		<div className='notificationJsonEditor'>
			<div className='notificationJsonEditorBar'>
				<span className='notificationMuted'>
					{t(canTransform ? 'notification.message.jsonTransformHint' : 'notification.message.jsonReferenceHint')}
				</span>
				<ReferenceInsertButton pickerId={PICKER_ID} testId='notification-json-insert-reference' disabled={isReadOnly} />
			</div>
			<NotificationReferencePicker pickerId={PICKER_ID} onApply={(reference) => {
				editor?.insert(reference);
				editor?.focus();
			}} />
			<div className='notificationJsonEditorFrame' data-testid='notification-json-editor'>
				<AceEditor mode='json' theme={themeMode === 'dark' ? 'tomorrow_night' : 'tomorrow'} name='notification-json-editor'
					value={value} onChange={onChange} onLoad={setEditor}
					readOnly={isReadOnly} width='100%' height='420px' fontSize={13} showGutter highlightActiveLine wrapEnabled
					setOptions={{ useWorker: false, showPrintMargin: false, tabSize: 2 }} />
			</div>
			<JsonTransformationMenu menu={menu} onClose={() => setMenu(null)} />
			{openMark?.enhanceId && (
				<TransformationEditor enhanceId={openMark.enhanceId} fieldLabel={toBindingPath(openMark.field.path)}
					onDelete={() => remove(openMark.target)} onClose={() => setOpenEditorId(null)} />
			)}
		</div>
	);
}
