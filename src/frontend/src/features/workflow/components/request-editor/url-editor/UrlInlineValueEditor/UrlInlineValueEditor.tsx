import type { UrlInlineValueEditorProps } from './UrlInlineValueEditor.types';
import { useUrlInlineValueEditor } from './useUrlInlineValueEditor';
import { EndpointArgHoverTooltip } from '../EndpointArgHoverTooltip';
import './UrlInlineValueEditor.css';

export function UrlInlineValueEditor(props: UrlInlineValueEditorProps) {
	const editor = useUrlInlineValueEditor(props);
	const className = props.readOnly
		? 'urlInlineValueEditor urlInlineValueEditor--readOnly'
		: 'urlInlineValueEditor';

	return <>
		<div ref={editor.rootRef} className={className}
			contentEditable={!props.readOnly} suppressContentEditableWarning
			tabIndex={props.readOnly ? undefined : 0}
			onInput={editor.updateFromDom} onMouseDown={editor.onMouseDown}
			onFocus={editor.onFocus} onClick={editor.onClick}
			onKeyUp={editor.updateCaret} onKeyDown={editor.onKeyDown}
			onPaste={editor.onPaste} onBlur={() => editor.render(props.value || '')} />
		<EndpointArgHoverTooltip containerRef={editor.rootRef} endpointArgs={props.endpointArgs}
			connection={props.connection} currentMethod={props.currentMethod} />
	</>;
}
