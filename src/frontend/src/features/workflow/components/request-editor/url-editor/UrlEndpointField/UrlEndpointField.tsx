import { useRef } from 'react';
import type { UrlEndpointFieldProps } from './UrlEndpointField.types';
import { useUrlEndpointCaret } from './useUrlEndpointCaret';
import { useUrlEndpointInput } from './useUrlEndpointInput';
import { useUrlEndpointRender } from './useUrlEndpointRender';
import './UrlEndpointField.css';

export function UrlEndpointField(props: UrlEndpointFieldProps) {
	const lastRendered = useRef('');
	const typing = useRef(false);
	const { render, readRaw } = useUrlEndpointRender(props, lastRendered, typing);
	const caret = useUrlEndpointCaret(props);
	const input = useUrlEndpointInput(props, typing, render, readRaw);
	const wrapperClass = props.readOnly ? 'urlEndpointField urlEndpointField--readOnly' : 'urlEndpointField';
	const inputClass = props.readOnly
		? 'urlEndpointFieldInput urlEndpointFieldInput--readOnly' : 'urlEndpointFieldInput';

	return <div className={wrapperClass}>
		{props.beforeNode && <div className='urlEndpointFieldBefore'>{props.beforeNode}</div>}
		<div ref={props.divRef} className={inputClass} contentEditable={!props.readOnly}
			onBeforeInput={input.onBeforeInput} onInput={input.updateFromDom}
			onMouseDown={caret.captureMouse} onClick={caret.captureMouse} onMouseUp={caret.captureMouse}
			onKeyUp={caret.captureSelection} onKeyDown={input.onKeyDown}
			onMouseDownCapture={input.onMouseDownCapture} onBlur={input.onBlur}
			onPaste={input.onPaste} />
		{props.afterNode && <div>{props.afterNode}</div>}
	</div>;
}
