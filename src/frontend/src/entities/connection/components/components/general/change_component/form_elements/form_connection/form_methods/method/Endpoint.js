/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import ReferenceGenerator from '@app_component/operator_builder/reference_generator/ReferenceGenerator';
import CMethodItem from '@entity/connection/components/classes/components/content/connection/method/CMethodItem';
import styles from '@entity/connection/components/themes/default/general/form_methods.scss';
import { BACKSPACE_KEY_CODE, DEL_KEY_CODE } from '@entity/connection/components/utils/constants/inputs';
import ToolboxThemeInput from '../../../../../../../hocs/ToolboxThemeInput';

const PROHIBITED_ENDPOINT_CHARACTERS = ['<', '>', 'Enter'];
const REF_RE = /(\{\%\s*#.*?\s*\%\})/g;
const SLOT = '\u200B';

function mapStateToProps() {
	return {};
}

function escapeHtml(str) {
	return String(str || '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function normalizeText(text) {
	return String(text || '')
		.replace(new RegExp(SLOT, 'g'), '')
		.replace(/[\n\r\t]/g, '')
		.replace(/\u00a0/g, ' ');
}

function visibleFromToken(tk) {
	const inner = String(tk || '')
		.replace(/^\{\%\s*#/, '')
		.replace(/\s*\%\}$/, '');

	if (/\.status(\.|$)/.test(inner)) {
		return 'Response Status';
	}

	const bodyMatch = inner.match(/\.body\.\$(?:\.(.*))?$/);
	if (bodyMatch) {
		const field = bodyMatch[1] || '';
		return field ? `B:${field}` : 'B:root object';
	}

	const headerMatch = inner.match(/\.header\.\$(?:\.(.*))?$/);
	if (headerMatch) {
		const field = headerMatch[1] || '';
		return field ? `H:${field}` : 'H:root object';
	}

	return inner;
}

function tokenColor(tk) {
	const m = String(tk || '').match(/#([0-9a-fA-F]{6})/);
	return m ? `#${m[1]}` : null;
}

function isParamSpan(node) {
	return (
		node &&
		node.nodeType === Node.ELEMENT_NODE &&
		node.getAttribute &&
		node.getAttribute('data-value') === 'param'
	);
}

function getParamToken(el) {
	return (el && el.getAttribute && el.getAttribute('data-main')) || '';
}

function normalizeToken(rawParam) {
	return String(rawParam || '')
		.replace(/^\s*\{\%\s*#?/, '{%#')
		.replace(/\s*\%\}\s*$/, '%}');
}

function buildParts(raw) {
	const parts = [];
	let last = 0;
	let m;
	REF_RE.lastIndex = 0;

	while ((m = REF_RE.exec(raw)) !== null) {
		if (m.index > last) parts.push({ value: raw.slice(last, m.index), isRef: false });
		parts.push({ value: m[0], isRef: true });
		last = REF_RE.lastIndex;
	}
	if (last < raw.length) parts.push({ value: raw.slice(last), isRef: false });
	return parts;
}

function getVisualLength(raw) {
	const parts = buildParts(String(raw || ''));
	let v = 0;
	for (let i = 0; i < parts.length; i++) {
		v += parts[i].isRef ? visibleFromToken(parts[i].value).length : parts[i].value.length;
	}
	return v;
}

function buildHtmlFromRaw(raw) {
	if (!raw) return '';

	const out = [];
	let last = 0;
	let m;
	REF_RE.lastIndex = 0;
	let refIdx = 0;

	while ((m = REF_RE.exec(raw)) !== null) {
		if (m.index > last) out.push(escapeHtml(raw.slice(last, m.index)));

		const token = m[0];
		const visible = visibleFromToken(token);
		const encodedMain = token.replace(/"/g, '&quot;');

		const bg = tokenColor(token);
		const style = bg
			? `background:${bg};color:#fff;border-radius:3px;padding:0 4px;margin:0 1px;`
			: '';

		out.push(
			`<span data-value="param" data-main="${encodedMain}" data-ref-index="${refIdx}" class="oc-endpoint-ref" contenteditable="false"${
				style ? ` style="${style}"` : ''
			}>${escapeHtml(visible)}</span>${SLOT}`
		);

		refIdx++;
		last = REF_RE.lastIndex;
	}

	if (last < raw.length) out.push(escapeHtml(raw.slice(last)));
	return out.join('');
}

function parseHtmlToRaw(html) {
	if (!html) return '';
	const container = document.createElement('div');
	container.innerHTML = html;

	const walk = (node) => {
		if (node.nodeType === Node.TEXT_NODE) return normalizeText(node.textContent || '');

		if (node.nodeType === Node.ELEMENT_NODE) {
			const el = node;

			if (isParamSpan(el)) return normalizeToken(getParamToken(el));

			let acc = '';
			for (let i = 0; i < el.childNodes.length; i++) acc += walk(el.childNodes[i]);
			return acc;
		}

		return '';
	};

	let result = '';
	for (let i = 0; i < container.childNodes.length; i++) result += walk(container.childNodes[i]);
	return result;
}

function clearHighlight(root) {
	if (!root) return;
	root.querySelectorAll('.oc-endpoint-ref').forEach((s) => {
		s.style.outline = 'none';
		s.style.boxShadow = 'none';
	});
}

function highlightRefByIndex(root, idx) {
	clearHighlight(root);
	if (!root || idx == null) return;
	const span = root.querySelector(`.oc-endpoint-ref[data-ref-index="${idx}"]`);
	if (!span) return;
	span.style.outline = '1px solid #000';
	span.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.4)';
}

function isSelectionInside(root) {
	const sel = window.getSelection?.();
	if (!sel || sel.rangeCount === 0) return false;
	const node = sel.getRangeAt(0).startContainer;
	return !!node && root.contains(node);
}

function getVisualCaretPos(root) {
	const sel = window.getSelection?.();
	if (!root || !sel || sel.rangeCount === 0) return 0;

	const r = sel.getRangeAt(0);
	const targetNode = r.startContainer;
	const targetOffset = r.startOffset;

	const textVisLen = (txt) => normalizeText(txt).length;
	const paramVisLen = (el) => visibleFromToken(getParamToken(el)).length;

	const subtreeVisLen = (node) => {
		if (!node) return 0;
		if (node.nodeType === Node.TEXT_NODE) return textVisLen(node.textContent || '');
		if (node.nodeType === Node.ELEMENT_NODE) {
			const el = node;
			if (isParamSpan(el)) return paramVisLen(el);
			let acc = 0;
			for (let i = 0; i < el.childNodes.length; i++) acc += subtreeVisLen(el.childNodes[i]);
			return acc;
		}
		return 0;
	};

	let pos = 0;

	const walkDomForCaretPosition = (node) => {
		if (!node) return false;

		if (node.nodeType === Node.ELEMENT_NODE && isParamSpan(node) && node.contains(targetNode)) {
			const vlen = paramVisLen(node);

			if (targetNode.nodeType === Node.TEXT_NODE) {
				const before = String(targetNode.textContent || '').slice(0, targetOffset);
				pos += Math.min(vlen, textVisLen(before));
			} else {
				pos += targetOffset <= 0 ? 0 : vlen;
			}
			return true;
		}

		if (node === targetNode) {
			if (node.nodeType === Node.TEXT_NODE) {
				const beforeRaw = String(node.textContent || '').slice(0, targetOffset);
				pos += textVisLen(beforeRaw);
				return true;
			}

			if (node.nodeType === Node.ELEMENT_NODE) {
				const el = node;
				for (let i = 0; i < targetOffset; i++) pos += subtreeVisLen(el.childNodes[i]);
				return true;
			}
		}

		if (node.nodeType === Node.TEXT_NODE) {
			pos += textVisLen(node.textContent || '');
			return false;
		}

		if (node.nodeType === Node.ELEMENT_NODE) {
			const el = node;
			if (isParamSpan(el)) {
				pos += paramVisLen(el);
				return false;
			}
			for (let i = 0; i < el.childNodes.length; i++) {
				if (walkDomForCaretPosition(el.childNodes[i])) return true;
			}
		}

		return false;
	};

	for (let i = 0; i < root.childNodes.length; i++) {
		if (walkDomForCaretPosition(root.childNodes[i])) break;
	}

	return pos;
}

function setCaretByVisualPos(root, visualPos) {
	if (!root) return;
	const sel = window.getSelection?.();
	if (!sel) return;

	let remaining = Math.max(0, Number(visualPos) || 0);

	const textVisLen = (txt) => normalizeText(txt).length;
	const nodeVisLen = (node) => {
		if (!node) return 0;
		if (node.nodeType === Node.TEXT_NODE) return textVisLen(node.textContent || '');
		if (node.nodeType === Node.ELEMENT_NODE) {
			const el = node;
			if (isParamSpan(el)) return visibleFromToken(getParamToken(el)).length;
			let acc = 0;
			for (let i = 0; i < el.childNodes.length; i++) acc += nodeVisLen(el.childNodes[i]);
			return acc;
		}
		return 0;
	};

	const placeInTextNode = (textNode, visOffset) => {
		const txt = String(textNode.textContent || '');

		let real = 0;
		let vis = 0;
		while (real < txt.length && vis < visOffset) {
			const ch = txt[real];
			if (ch !== SLOT && ch !== '\n' && ch !== '\r' && ch !== '\t') vis++;
			real++;
		}

		const rr = document.createRange();
		rr.setStart(textNode, real);
		rr.collapse(true);
		sel.removeAllRanges();
		sel.addRange(rr);
	};

	const walkDomForCaretPosition = (node) => {
		if (!node) return false;

		if (node.nodeType === Node.TEXT_NODE) {
			const vlen = nodeVisLen(node);
			if (remaining <= vlen) {
				placeInTextNode(node, remaining);
				return true;
			}
			remaining -= vlen;
			return false;
		}

		if (node.nodeType === Node.ELEMENT_NODE) {
			const el = node;

			if (isParamSpan(el)) {
				const vlen = nodeVisLen(el);

				if (remaining <= vlen) {
					const next = el.nextSibling;
					if (next && next.nodeType === Node.TEXT_NODE && String(next.textContent || '').includes(SLOT)) {
						const rr = document.createRange();
						rr.setStart(next, Math.min(1, String(next.textContent || '').length));
						rr.collapse(true);
						sel.removeAllRanges();
						sel.addRange(rr);
						return true;
					}

					const parent = el.parentNode;
					if (!parent) return true;
					const idx = Array.from(parent.childNodes).indexOf(el);
					const rr = document.createRange();
					rr.setStart(parent, Math.min(idx + 1, parent.childNodes.length));
					rr.collapse(true);
					sel.removeAllRanges();
					sel.addRange(rr);
					return true;
				}

				remaining -= vlen;
				return false;
			}

			for (let i = 0; i < el.childNodes.length; i++) {
				if (walkDomForCaretPosition(el.childNodes[i])) return true;
			}
		}

		return false;
	};

	for (let i = 0; i < root.childNodes.length; i++) {
		if (walkDomForCaretPosition(root.childNodes[i])) return;
	}

	try {
		const rr = document.createRange();
		rr.selectNodeContents(root);
		rr.collapse(false);
		sel.removeAllRanges();
		sel.addRange(rr);
	} catch {
	}
}

function replaceNthRef(raw, n, newToken) {
	let mm = null;
	let nth = -1;
	REF_RE.lastIndex = 0;

	while ((mm = REF_RE.exec(raw)) !== null) {
		nth++;
		if (nth === n) {
			const start = mm.index;
			const end = start + mm[0].length;
			return raw.slice(0, start) + newToken + raw.slice(end);
		}
	}

	return raw;
}

function getVisualStartOfNthRef(raw, n) {
	const parts = buildParts(String(raw || ''));
	let v = 0;
	let refCounter = 0;

	for (let i = 0; i < parts.length; i++) {
		const p = parts[i];
		if (!p.isRef) {
			v += p.value.length;
			continue;
		}
		if (refCounter === n) return v;
		v += visibleFromToken(p.value).length;
		refCounter++;
	}
	return null;
}

@connect(mapStateToProps, {}, null, { forwardRef: true })
class Endpoint extends Component {
	constructor(props) {
		super(props);

		this.endpointValue = React.createRef();
		this.raw = props.method.request.endpoint || '';

		this.lastKnownCaretPos = 0;
		this.selectedRefIndex = null;

		this.state = {
			caretPosition: -1,
			currentKeyCode: '',
			actionButtonTooltip: 'Add Reference',
			actionButtonValue: 'add',
			isCaretPositionFocusedOnReference: false,
		};

		this.handleSelectionChange = this._onSelectionChange.bind(this);
	}

	shouldComponentUpdate(nextProps, nextState) {
		return (
			nextProps.method !== this.props.method ||
			nextProps.readOnly !== this.props.readOnly ||
			nextProps.connection !== this.props.connection ||
			nextProps.connector !== this.props.connector ||
			nextProps.updateEntity !== this.props.updateEntity ||
			nextProps.theme !== this.props.theme ||
			nextState.caretPosition !== this.state.caretPosition ||
			nextState.currentKeyCode !== this.state.currentKeyCode ||
			nextState.actionButtonTooltip !== this.state.actionButtonTooltip ||
			nextState.actionButtonValue !== this.state.actionButtonValue ||
			nextState.isCaretPositionFocusedOnReference !== this.state.isCaretPositionFocusedOnReference
		);
	}

	componentDidMount() {
		this._renderFromRaw(this.raw, { focusEnd: true });
		document.addEventListener('selectionchange', this.handleSelectionChange);
	}

	componentWillUnmount() {
		document.removeEventListener('selectionchange', this.handleSelectionChange);
		this._saveEndpoint(this.raw);
	}

	componentDidUpdate(prevProps) {
		if (prevProps.method?.methodId !== this.props.method?.methodId) {
			const incoming = this.props.method.request.endpoint || '';
			this.raw = incoming;
			this.selectedRefIndex = null;

			this.setState(
				{
					actionButtonTooltip: 'Add Reference',
					actionButtonValue: 'add',
					isCaretPositionFocusedOnReference: false,
					caretPosition: -1,
					currentKeyCode: '',
				},
				() => {
					this.lastKnownCaretPos = getVisualLength(incoming);
					this._renderFromRaw(incoming, { caretOverride: this.lastKnownCaretPos });
				}
			);
			return;
		}

		if (prevProps.method.request.endpoint !== this.props.method.request.endpoint) {
			const incoming = this.props.method.request.endpoint || '';
			if (incoming !== this.raw) {
				this.raw = incoming;
				this.selectedRefIndex = null;

				this.setState(
					{
						actionButtonTooltip: 'Add Reference',
						actionButtonValue: 'add',
						isCaretPositionFocusedOnReference: false,
					},
					() => {
						this.lastKnownCaretPos = getVisualLength(incoming);
						this._renderFromRaw(incoming, { caretOverride: this.lastKnownCaretPos });
					}
				);
			}
		}
	}

	getEndpointIdName() {
		const { connector, method } = this.props;
		const connectorType = connector.getConnectorType();
		return `endpoint_${connectorType}_${method.index}`;
	}

	getEndpointHtmlElement() {
		return this.endpointValue.current || document.getElementById(this.getEndpointIdName());
	}

	_onSelectionChange() {
		const root = this.getEndpointHtmlElement();
		if (!root) return;
		if (!isSelectionInside(root)) return;
		this.lastKnownCaretPos = getVisualCaretPos(root);
	}

	_setActionState(nextActionButtonTooltip, nextActionButtonValue, nextFocusedOnReference) {
		if (
			this.state.actionButtonTooltip !== nextActionButtonTooltip ||
			this.state.actionButtonValue !== nextActionButtonValue ||
			this.state.isCaretPositionFocusedOnReference !== nextFocusedOnReference
		) {
			this.setState({
				actionButtonTooltip: nextActionButtonTooltip,
				actionButtonValue: nextActionButtonValue,
				isCaretPositionFocusedOnReference: nextFocusedOnReference,
			});
		}
	}

	_renderFromRaw(raw, opts) {
		const root = this.getEndpointHtmlElement();
		if (!root) return;

		const caret =
			typeof opts?.caretOverride === 'number'
				? Math.max(0, opts.caretOverride)
				: opts?.focusEnd
					? getVisualLength(raw)
					: this.lastKnownCaretPos;

		root.innerHTML = buildHtmlFromRaw(raw);
		highlightRefByIndex(root, this.selectedRefIndex);

		this.lastKnownCaretPos = caret;

		if (!this.props.readOnly) {
			try {
				root.focus();
				setCaretByVisualPos(root, caret);
			} catch {
			}
		}
	}

	_saveEndpoint(raw) {
		const { method, updateEntity, readOnly } = this.props;
		if (readOnly) return;

		const next = String(raw || '');
		if (next === (method.request.endpoint || '')) return;

		method.setRequestEndpoint(next);
		updateEntity();
	}

	normalizeReference = (ref) => {
		if (ref && ref.startsWith('{%') && ref.endsWith('%}')) return ref.slice(2, -2);
		return ref;
	};

	onInput = () => {
		const root = this.getEndpointHtmlElement();
		if (!root) return;

		if (isSelectionInside(root)) this.lastKnownCaretPos = getVisualCaretPos(root);

		this.selectedRefIndex = null;
		clearHighlight(root);

		this._setActionState('Add Reference', 'add', false);

		this.raw = parseHtmlToRaw(root.innerHTML);
	};

	onMouseDownCapture = (e) => {
		const root = this.getEndpointHtmlElement();
		if (!root) return;

		const target = e.target;
		const span = target?.closest?.('.oc-endpoint-ref');
		if (!span || !root.contains(span)) {
			this.selectedRefIndex = null;
			clearHighlight(root);
			this._setActionState('Add Reference', 'add', false);
			return;
		}

		const idxStr = span.getAttribute('data-ref-index');
		const idx = idxStr ? Number(idxStr) : null;
		if (idx == null || Number.isNaN(idx)) return;

		e.preventDefault();
		e.stopPropagation();

		this.selectedRefIndex = idx;
		highlightRefByIndex(root, idx);

		this._setActionState('Replace Reference', 'autorenew', true);

		const startVis = getVisualStartOfNthRef(this.raw, idx);
		const token = this._getNthTokenRaw(this.raw, idx);
		const len = token ? visibleFromToken(token).length : 0;
		const caret = (startVis ?? 0) + len;

		this.lastKnownCaretPos = caret;

		requestAnimationFrame(() => {
			try {
				root.focus();
				setCaretByVisualPos(root, caret);
			} catch {
			}
		});
	};

	_getNthTokenRaw(raw, n) {
		let mm = null;
		let nth = -1;
		REF_RE.lastIndex = 0;
		while ((mm = REF_RE.exec(raw)) !== null) {
			nth++;
			if (nth === n) return mm[0];
		}
		return null;
	}

	onKeyDown = (e) => {
		const keyCode = e?.keyCode || 0;
		const key = e?.key || '';

		if (PROHIBITED_ENDPOINT_CHARACTERS.includes(key)) {
			e.preventDefault();
			return;
		}

		const root = this.getEndpointHtmlElement();
		if (!root) return;

		if (keyCode === BACKSPACE_KEY_CODE || keyCode === DEL_KEY_CODE) {
			const mode = keyCode === BACKSPACE_KEY_CODE ? 'backspace' : 'delete';
			if (this._deleteRefByCaret(e, mode)) return;
		}

		const isPrintable = key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
		if (isPrintable && this.selectedRefIndex != null) {
			this.selectedRefIndex = null;
			clearHighlight(root);
			this._setActionState('Add Reference', 'add', false);
		}

		requestAnimationFrame(() => {
			if (!isSelectionInside(root)) return;
			this.lastKnownCaretPos = getVisualCaretPos(root);
		});
	};

	_deleteRefByCaret(e, mode) {
		const root = this.getEndpointHtmlElement();
		const sel = window.getSelection?.();
		if (!root || !sel || sel.rangeCount === 0) return false;

		const r = sel.getRangeAt(0);
		if (!r.collapsed) return false;

		const isSlotText = (n) =>
			n &&
			n.nodeType === Node.TEXT_NODE &&
			(String(n.textContent || '') === SLOT ||
				String(n.textContent || '') === '' ||
				String(n.textContent || '') === '\u00a0');

		const findNeighborRef = () => {
			let node = r.startContainer;
			let offset = r.startOffset;

			if (node.nodeType === Node.ELEMENT_NODE) {
				const el = node;
				const child = el.childNodes[offset] || el.childNodes[offset - 1] || null;
				if (child) {
					node = child;
					offset = child.nodeType === Node.TEXT_NODE ? 0 : 0;
				}
			}

			const prev = () => {
				if (node.nodeType === Node.TEXT_NODE) {
					if (offset > 0) return null;
					let p = node.previousSibling;
					while (isSlotText(p)) p = p.previousSibling;
					return p;
				}
				let p = node.previousSibling;
				while (isSlotText(p)) p = p.previousSibling;
				return p;
			};

			const next = () => {
				if (node.nodeType === Node.TEXT_NODE) {
					const len = String(node.textContent || '').length;
					if (offset < len) return null;
					let n = node.nextSibling;
					while (isSlotText(n)) n = n.nextSibling;
					return n;
				}
				let n = node.nextSibling;
				while (isSlotText(n)) n = n.nextSibling;
				return n;
			};

			const cand = mode === 'backspace' ? prev() : next();
			if (cand && cand.nodeType === 1 && cand.classList?.contains('oc-endpoint-ref')) return cand;
			return null;
		};

		const span = findNeighborRef();
		if (!span) return false;

		e.preventDefault();

		const parent = span.parentNode;
		if (!parent) return true;

		const after = span.nextSibling;
		if (after && after.nodeType === Node.TEXT_NODE && String(after.textContent || '') === SLOT) {
			after.remove();
		}
		span.remove();
		parent.normalize();

		this.raw = parseHtmlToRaw(root.innerHTML);

		this.selectedRefIndex = null;
		clearHighlight(root);
		this._setActionState('Add Reference', 'add', false);

		this.lastKnownCaretPos = Math.max(0, getVisualCaretPos(root));

		requestAnimationFrame(() => {
			try {
				root.focus();
				setCaretByVisualPos(root, this.lastKnownCaretPos);
			} catch {
			}
		});

		return true;
	}

	addParam = (param) => {
		const root = this.getEndpointHtmlElement();
		if (!root) return;

		if (isSelectionInside(root)) this.lastKnownCaretPos = getVisualCaretPos(root);

		const currentRaw = String(this.raw || '');

		let p = String(param || '').trim();
		if (p.startsWith('{%') && p.endsWith('%}')) p = p.slice(2, -2).trim();
		const newToken = `{%#${p.replace(/^#/, '')}%}`;
		const tokenVisualLen = visibleFromToken(newToken).length;

		if (typeof this.selectedRefIndex === 'number' && this.selectedRefIndex >= 0) {
			const startVis = getVisualStartOfNthRef(currentRaw, this.selectedRefIndex);
			const finalRaw = replaceNthRef(currentRaw, this.selectedRefIndex, newToken);

			const newCaretVis = (startVis ?? 0) + tokenVisualLen;
			this.lastKnownCaretPos = newCaretVis;

			this.selectedRefIndex = null;
			this._setActionState('Add Reference', 'add', false);

			this.raw = finalRaw;
			this._renderFromRaw(finalRaw, { caretOverride: newCaretVis });
			return;
		}

		const caretVis = Number.isFinite(this.lastKnownCaretPos)
			? this.lastKnownCaretPos
			: getVisualLength(currentRaw);

		const parts = buildParts(currentRaw);

		let rawInsertAt = currentRaw.length;
		let acc = 0;

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			const segLen = part.isRef ? visibleFromToken(part.value).length : part.value.length;

			if (caretVis <= acc + segLen) {
				let rawStart = 0;
				for (let j = 0; j < i; j++) rawStart += parts[j].value.length;
				rawInsertAt = part.isRef ? rawStart + part.value.length : rawStart + (caretVis - acc);
				break;
			}
			acc += segLen;
		}

		const finalRaw = currentRaw.slice(0, rawInsertAt) + newToken + currentRaw.slice(rawInsertAt);
		const newCaretVis = caretVis + tokenVisualLen;

		this.lastKnownCaretPos = newCaretVis;
		this.raw = finalRaw;
		this._renderFromRaw(finalRaw, { caretOverride: newCaretVis });
	};

	onBlur = () => {
		this._saveEndpoint(this.raw);
	};

	limitEndpointInputOnKeyPress = (e) => {
		if (PROHIBITED_ENDPOINT_CHARACTERS.indexOf(e.key) !== -1) e.preventDefault();
	};

	render() {
		const { connection, connector, method, readOnly, theme, updateEntity } = this.props;
		const { actionButtonTooltip, actionButtonValue } = this.state;

		if (!method) return null;

		let themeQueryInput = '';
		if (theme && theme.hasOwnProperty('queryInput')) themeQueryInput = theme.queryInput;

		const connectionEditor = {
			connection,
			connector,
			item: method,
			updateConnection: updateEntity,
		};

		return (
			<div>
				<ToolboxThemeInput className={themeQueryInput} label={'Query'}>
					<div
						id={this.getEndpointIdName()}
						ref={this.endpointValue}
						contentEditable={!readOnly}
						onInput={this.onInput}
						onMouseDownCapture={this.onMouseDownCapture}
						onKeyDown={this.onKeyDown}
						onBlur={this.onBlur}
						onKeyPress={this.limitEndpointInputOnKeyPress}
						className={`${styles.method_endpoint_content_editable}`}
					/>
					<ReferenceGenerator
						connectionEditor={connectionEditor}
						setReference={(a) => this.addParam(this.normalizeReference(a))}
						manualAdd={true}
						actionButtonTooltip={actionButtonTooltip}
						actionButtonValue={actionButtonValue}
						isAbsolute={true}
						endpointReference={true}
					/>
				</ToolboxThemeInput>
			</div>
		);
	}
}

Endpoint.propTypes = {
	method: PropTypes.instanceOf(CMethodItem),
	readOnly: PropTypes.bool,
};

Endpoint.defaultProps = {
	readOnly: false,
	theme: null,
	isParamGeneratorArrowVisible: true,
	isParamGeneratorAlwaysVisible: false,
};

export default Endpoint;