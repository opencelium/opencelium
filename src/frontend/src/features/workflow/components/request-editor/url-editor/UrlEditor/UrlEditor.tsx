import { UrlEditorContent } from './UrlEditorContent';
import type { UrlEditorProps } from './UrlEditor.types';
import { useUrlEditor } from './useUrlEditor';

export default function UrlEditor({ readOnly }: UrlEditorProps) {
	const editor = useUrlEditor(readOnly);
	if (!editor.connection) return null;
	return <UrlEditorContent readOnly={readOnly} editor={editor} />;
}
