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
import { renderToString } from 'react-dom/server';
import { connect } from 'react-redux';

import ReferenceGenerator from '@app_component/operator_builder/reference_generator/ReferenceGenerator';
import {
	freeStringFromAmp,
	getCaretPositionOfDivEditable,
	setFocusByCaretPositionInDivEditable,
} from '@application/utils/utils';
import QueryString from '@change_component/form_elements/form_connection/form_methods/method/query_string/QueryString';
import CMethodItem from '@entity/connection/components/classes/components/content/connection/method/CMethodItem';
import CEndpoint from '@entity/connection/components/classes/components/general/change_component/form_elements/CEndpoint';
import styles from '@entity/connection/components/themes/default/general/form_methods.scss';
import {
	BACKSPACE_KEY_CODE,
	DEL_KEY_CODE,
} from '@entity/connection/components/utils/constants/inputs';
import ToolboxThemeInput from '../../../../../../../hocs/ToolboxThemeInput';

const PROHIBITED_ENDPOINT_CHARACTERS = ['<', '>', 'Enter'];

function mapStateToProps(state) {
	const authUser = state.authReducer.authUser;
	return {
		authUser,
	};
}

@connect(mapStateToProps, {}, null, { forwardRef: true })
class Endpoint extends Component {
	constructor(props) {
		super(props);
		this.endpointValue = React.createRef();
		this.hasAdded = false;
		this.state = {
			contentEditableValue: props.method.request.endpoint,
			caretPosition: -1,
			currentKeyCode: '',
			actionButtonTooltip: 'Add Reference',
			actionButtonValue: 'add',
			isCaretPositionFocusedOnReference: false,
		};
		this.paramGeneratorRef = React.createRef();
	}

	onChangeEndpoint(e) {
		const value = e.target.innerHTML;
		const endpointDiv = this.getEndpointHtmlElement();
		const { currentKeyCode } = this.state;

		if (!value) return;

		const beforeRaw = String(this.state.contentEditableValue || '');
		const beforeVisual = this.freeStringFromReferences(beforeRaw);
		const caretBefore = getCaretPositionOfDivEditable(endpointDiv);

		let result = '';
		const chunks = value.split('</span>');
		for (let i = 0; i < chunks.length; i++) {
			if (!chunks[i]) continue;
			const idx = chunks[i].indexOf('>');
			const parsedText = freeStringFromAmp(
				(chunks[i].substring(idx + 1) || '').trim()
			);

			if (!chunks[i].includes('data-value="param"')) {
				if (!chunks[i].includes('data-value="invoker_reference"')) {
					result += parsedText;
				} else {
					const hasSpace = !parsedText[parsedText.length - 1]?.trim();
					if (hasSpace) result += `{${parsedText.slice(0, -1)}} `;
					else {
						const dataMainValue = chunks[i]
							.split('data-main="')[1]
							?.split('"')[0];
						if (dataMainValue === parsedText) result += `{${parsedText}}`;
					}
				}
			} else {
				let rawParam = chunks[i].split('data-main="')[1]?.split('"')[0] || '';
				rawParam = rawParam
					.replace(/^\s*\{\%\s*#?/, '{%#')
					.replace(/\%\}\s*$/, '%}');
				result += rawParam;
			}
		}

		const afterVisual = this.freeStringFromReferences(result);
		const delta = afterVisual.length - beforeVisual.length;

		const REF_RE = /(\{\%\s*#.*?\s*\%\})/g;
		const refsBefore = (beforeRaw.match(REF_RE) || []).length;
		const refsAfter = (result.match(REF_RE) || []).length;

		let newPos = caretBefore;

		if (
			(currentKeyCode === BACKSPACE_KEY_CODE ||
				currentKeyCode === DEL_KEY_CODE) &&
			refsBefore > refsAfter
		) {
			newPos = caretBefore;
		} else if (delta === -1 && currentKeyCode === BACKSPACE_KEY_CODE) {
			newPos = caretBefore;
		} else if (delta === -1 && currentKeyCode === DEL_KEY_CODE) {
			newPos = caretBefore;
		} else if (delta !== 1) {
			newPos = caretBefore + delta;
		}

		this.setState({ contentEditableValue: result }, () => {
			requestAnimationFrame(() => {
				setFocusByCaretPositionInDivEditable(endpointDiv, newPos);
				this._nudgeCaretOutOfParam(endpointDiv);
			});
		});
	}

	_nudgeCaretOutOfParam(root) {
		const sel = window.getSelection && window.getSelection();
		if (!sel || !sel.rangeCount) return;
		const r = sel.getRangeAt(0);
		const isParam = (el) =>
			el &&
			el.nodeType === 1 &&
			el.getAttribute &&
			el.getAttribute('data-value') === 'param';

		let n = r.startContainer;
		while (n && n !== root) {
			if (isParam(n)) {
				const span = n;
				const spanRange = document.createRange();
				spanRange.selectNodeContents(span);
				const atStart =
					r.compareBoundaryPoints(Range.START_TO_START, spanRange) === 0;
				const atEnd =
					r.compareBoundaryPoints(Range.START_TO_END, spanRange) === 0;

				if (
					atStart &&
					span.previousSibling &&
					span.previousSibling.nodeType === Node.TEXT_NODE
				) {
					const nr = document.createRange();
					nr.setStart(
						span.previousSibling,
						span.previousSibling.textContent.length
					);
					nr.collapse(true);
					sel.removeAllRanges();
					sel.addRange(nr);
				} else if (
					atEnd &&
					span.nextSibling &&
					span.nextSibling.nodeType === Node.TEXT_NODE
				) {
					const nr = document.createRange();
					nr.setStart(span.nextSibling, 0);
					nr.collapse(true);
					sel.removeAllRanges();
					sel.addRange(nr);
				}
				break;
			}
			n = n.parentNode;
		}
	}

	_visibleFromToken(tk) {
		const inner = tk.replace(/^\{\%\s*#/, '').replace(/\s*\%\}$/, '');
		let name = inner.replace(/^.*?body\.\$/, '');
		name = name.replace(/^\./, '');
		return name || inner;
	}

	_buildPartsAndVisuals(raw) {
		const REF_RE = /(\{\%\s*#.*?\s*\%\})/g;
		const parts = [];
		let last = 0,
			m;
		while ((m = REF_RE.exec(raw)) !== null) {
			if (m.index > last)
				parts.push({
					value: raw.slice(last, m.index),
					isRef: false,
					rawStart: last,
				});
			parts.push({ value: m[0], isRef: true, rawStart: m.index });
			last = REF_RE.lastIndex;
		}
		if (last < raw.length)
			parts.push({ value: raw.slice(last), isRef: false, rawStart: last });

		const visuals = [];
		let v = 0,
			refCounter = 0;
		for (let i = 0; i < parts.length; i++) {
			const len = parts[i].isRef
				? this._visibleFromToken(parts[i].value).length
				: parts[i].value.length;
			visuals.push({
				i,
				vStart: v,
				vEnd: v + len,
				isRef: parts[i].isRef,
				len,
				refIndex: parts[i].isRef ? refCounter++ : -1,
			});
			v += len;
		}
		return { parts, visuals };
	}

	_getNthRefBounds(raw, n) {
		const { parts, visuals } = this._buildPartsAndVisuals(raw);
		const seg = visuals.find((s) => s.isRef && s.refIndex === n);
		if (!seg) return null;
		const p = parts[seg.i];
		return {
			rawStart: p.rawStart,
			rawEnd: p.rawStart + p.value.length,
			vStart: seg.vStart,
			vEnd: seg.vEnd,
			visLen: seg.len,
		};
	}

	getEndpointIdName() {
		const { connector, method } = this.props;
		const connectorType = connector.getConnectorType();
		return `endpoint_${connectorType}_${method.index}`;
	}

	getEndpointHtmlElement() {
		return document.getElementById(this.getEndpointIdName());
	}

	freeStringFromReferences(str) {
		let result = '';
		let stringsWithStartReferences = str.split('{%#');
		for (let i = 0; i < stringsWithStartReferences.length; i++) {
			let stringsWithEndReferences = stringsWithStartReferences[i].split('%}');
			if (stringsWithEndReferences.length > 0) {
				if (stringsWithEndReferences.length === 1) {
					result += stringsWithEndReferences;
				} else {
					let reference = stringsWithEndReferences[0].split('.');
					reference = reference.splice(3).join('.');
					result += reference;
					result += stringsWithEndReferences[1];
				}
			}
		}
		return result;
	}

	setCaretPosition(e) {
		let { currentKeyCode, contentEditableValue } = this.state;

		const root = this.getEndpointHtmlElement();
		if (!root) return;

		const isKeyDown = e && e.type === 'keydown';
		const keyCode = e?.keyCode || 0;
		const key = e?.key || '';
		const isBackspace = key === 'Backspace' || keyCode === 8;
		const isDelete = key === 'Delete' || keyCode === 46;

		if (isKeyDown && keyCode) currentKeyCode = keyCode;

		const raw = String(contentEditableValue || '');
		const { parts, visuals } = this._buildPartsAndVisuals(raw);
		const caretVis = getCaretPositionOfDivEditable(root);

		if (isKeyDown && (isBackspace || isDelete)) {
			let targetRefIdx = -1;

			for (const seg of visuals) {
				if (!seg.isRef) continue;

				const insideStrict = caretVis > seg.vStart && caretVis < seg.vEnd;
				const atLeftEdge = caretVis === seg.vStart;
				const atRightEdge = caretVis === seg.vEnd;

				if (insideStrict) {
					targetRefIdx = seg.refIndex;
					break;
				}
				if (isBackspace && atRightEdge) {
					targetRefIdx = seg.refIndex;
					break;
				}
				if (isDelete && atLeftEdge) {
					targetRefIdx = seg.refIndex;
					break;
				}
			}

			if (targetRefIdx !== -1) {
				e.preventDefault();
				const b = this._getNthRefBounds(raw, targetRefIdx);
				const finalRaw = raw.slice(0, b.rawStart) + raw.slice(b.rawEnd);
				const newCaret =
					isDelete && caretVis === b.vStart ? caretVis : b.vStart;

				this.setState({ contentEditableValue: finalRaw }, () => {
					requestAnimationFrame(() =>
						setFocusByCaretPositionInDivEditable(root, newCaret)
					);
				});
				return;
			}

			if (isBackspace) {
				const leftLinkSeg = visuals.find(
					(s) => s.isRef && caretVis === s.vStart
				);
				if (leftLinkSeg) {
					const prevSeg = visuals.find((s) => s.vEnd === caretVis);
					if (prevSeg && !prevSeg.isRef && prevSeg.len > 0) {
						e.preventDefault();

						const partIdx = prevSeg.i;
						let rawStart = 0;
						for (let j = 0; j < partIdx; j++) rawStart += parts[j].value.length;

						const deletePos = rawStart + (parts[partIdx].value.length - 1);
						const finalRaw = raw.slice(0, deletePos) + raw.slice(deletePos + 1);
						const newCaret = Math.max(0, caretVis - 1);

						this.setState({ contentEditableValue: finalRaw }, () => {
							requestAnimationFrame(() =>
								setFocusByCaretPositionInDivEditable(root, newCaret)
							);
						});
						return;
					}
				}
			}
		}

		let focused = false;
		for (const seg of visuals) {
			if (!seg.isRef) continue;
			if (caretVis > seg.vStart && caretVis < seg.vEnd) {
				focused = true;
				break;
			}
		}

		this.setState(
			{
				caretPosition: caretVis,
				currentKeyCode,
				actionButtonTooltip: focused ? 'Replace Reference' : 'Add Reference',
				actionButtonValue: focused ? 'autorenew' : 'add',
				isCaretPositionFocusedOnReference: focused,
			},
			() => setFocusByCaretPositionInDivEditable(root, caretVis)
		);
	}

	saveEndpoint() {
		const { method, updateEntity } = this.props;
		method.setRequestEndpoint(this.state.contentEditableValue);
		updateEntity();
	}

	limitEndpointInputOnKeyPress(e) {
		let { contentEditableValue, caretPosition } = this.state;
		const requiredInvokerData = this.props.connector.invoker.data;
		if (
			CEndpoint.isCaretPositionFocusedOnReference(
				caretPosition,
				contentEditableValue,
				requiredInvokerData
			) ||
			PROHIBITED_ENDPOINT_CHARACTERS.indexOf(e.key) !== -1
		) {
			e.preventDefault();
		}
	}

	addParam(param) {
		const root = this.getEndpointHtmlElement();
		const raw = String(this.state.contentEditableValue || '');
		if (!root) return;

		let p = (param || '').trim();
		if (p.startsWith('{%') && p.endsWith('%}')) p = p.slice(2, -2).trim();
		const newToken = `{%#${p.replace(/^#/, '')}%}`;

		const visibleFromToken = (tk) => {
			const inner = tk.replace(/^\{\%\s*#/, '').replace(/\s*\%\}$/, '');
			let name = inner.replace(/^.*?body\.\$/, '').replace(/^\./, '');
			return name || inner;
		};
		const visLenToken = (tk) => visibleFromToken(tk).length;

		const REF_RE = /(\{\%\s*#.*?\s*\%\})/g;
		const parts = [];
		let last = 0,
			m;
		while ((m = REF_RE.exec(raw)) !== null) {
			if (m.index > last)
				parts.push({ value: raw.slice(last, m.index), isRef: false });
			parts.push({ value: m[0], isRef: true });
			last = REF_RE.lastIndex;
		}
		if (last < raw.length) parts.push({ value: raw.slice(last), isRef: false });

		const visuals = [];
		let v = 0,
			refCount = 0;
		for (let i = 0; i < parts.length; i++) {
			const len = parts[i].isRef
				? visLenToken(parts[i].value)
				: parts[i].value.length;
			visuals.push({
				i,
				vStart: v,
				vEnd: v + len,
				isRef: parts[i].isRef,
				len,
				refIndex: parts[i].isRef ? refCount++ : -1,
			});
			v += len;
		}

		const caretVis =
			Number.isFinite(this.state.caretPosition) && this.state.caretPosition >= 0
				? this.state.caretPosition
				: getCaretPositionOfDivEditable(root);

		let targetRefIdx = -1;
		let targetSeg = null;
		for (const seg of visuals) {
			if (!seg.isRef) continue;
			if (caretVis >= seg.vStart && caretVis <= seg.vEnd) {
				targetRefIdx = seg.refIndex;
				targetSeg = seg;
				break;
			}
		}
		if (targetRefIdx === -1) {
			for (const seg of visuals) {
				if (!seg.isRef) continue;
				if (caretVis === seg.vStart || caretVis === seg.vEnd) {
					targetRefIdx = seg.refIndex;
					targetSeg = seg;
					break;
				}
			}
		}

		let finalRaw, newCaretVis;

		if (targetRefIdx !== -1) {
			let matchIdx = -1,
				nth = -1,
				mm;
			REF_RE.lastIndex = 0;
			while ((mm = REF_RE.exec(raw)) !== null) {
				nth++;
				if (nth === targetRefIdx) {
					matchIdx = mm.index;
					break;
				}
			}
			if (matchIdx === -1) {
				const insertAt = raw.length;
				finalRaw = raw.slice(0, insertAt) + newToken + raw.slice(insertAt);
				newCaretVis = caretVis + visLenToken(newToken);
			} else {
				const oldLen = mm[0].length;
				finalRaw =
					raw.slice(0, matchIdx) + newToken + raw.slice(matchIdx + oldLen);
				const vStart = targetSeg.vStart;
				newCaretVis = vStart + visLenToken(newToken);
			}
		} else {
			let rawInsertAt = raw.length,
				acc = 0;
			for (let i = 0; i < parts.length; i++) {
				const p = parts[i];
				const segLen = p.isRef ? visLenToken(p.value) : p.value.length;
				if (caretVis <= acc + segLen) {
					if (p.isRef) {
						const rawStart = (() => {
							let r = 0;
							for (let j = 0; j < i; j++) r += parts[j].value.length;
							return r;
						})();
						rawInsertAt = rawStart + p.value.length; // после токена
					} else {
						let rawStart = 0;
						for (let j = 0; j < i; j++) rawStart += parts[j].value.length;
						rawInsertAt = rawStart + (caretVis - acc);
					}
					break;
				}
				acc += segLen;
			}
			finalRaw = raw.slice(0, rawInsertAt) + newToken + raw.slice(rawInsertAt);
			newCaretVis = caretVis + visLenToken(newToken);
		}

		this.setState({ contentEditableValue: finalRaw }, () => {
			requestAnimationFrame(() =>
				setFocusByCaretPositionInDivEditable(root, newCaretVis)
			);
		});
	}

	normalizeReference = (ref) => {
		if (ref.startsWith('{%') && ref.endsWith('%}')) {
			return ref.slice(2, -2);
		}
		return ref;
	};

	render() {
		const {
			connection,
			connector,
			method,
			readOnly,
			theme,
			updateEntity,
		} = this.props;
		const {
			contentEditableValue,
			actionButtonTooltip,
			actionButtonValue,
			caretPosition,
		} = this.state;
		let hasError = false;
		if (!method) {
			return null;
		}
		if (method.error.hasError) {
			if (method.error.location === 'query') {
				hasError = true;
			}
		}
		let contentEditableStyles = { color: hasError ? 'red' : 'black' };
		let htmlValue = renderToString(
			<QueryString
				query={contentEditableValue}
				connector={connector}
				caretPosition={caretPosition}
			/>
		);
		let themeQueryInput = '';
		if (theme && theme.hasOwnProperty('queryInput')) {
			themeQueryInput = theme.queryInput;
		}
		const connectionEditor = {
			connection,
			connector,
			item: method,
			updateConnection: updateEntity,
		};
		return (
			<div>
				<ToolboxThemeInput
					className={themeQueryInput}
					label={'Query'}
					labelClassName={
						hasError ? styles.method_endpoint_label_has_error : ''
					}
				>
					<div
						id={this.getEndpointIdName()}
						ref={this.endpointValue}
						dangerouslySetInnerHTML={{ __html: htmlValue }}
						contentEditable={!readOnly}
						onInput={(a) => this.onChangeEndpoint(a)}
						onMouseDown={(a) => {
							this.setCaretPosition(a);
						}}
						onMouseUp={(a) => {
							this.setCaretPosition(a);
						}}
						onKeyDown={(a) => this.setCaretPosition(a)}
						onKeyUp={(a) => this.setCaretPosition(a)}
						onBlur={(a) => this.saveEndpoint(a)}
						onKeyPress={(a) => this.limitEndpointInputOnKeyPress(a)}
						className={`${styles.method_endpoint_content_editable}`}
						style={contentEditableStyles}
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
