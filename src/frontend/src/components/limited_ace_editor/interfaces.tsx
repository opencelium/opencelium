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

export interface LimitedAceEditorProps {
	maxLength?: number;
	mode?: string;
	theme?: any;
	value?: string;
	fontSize?: number;
	showPrintMargin?: boolean;
	showGutter?: boolean;
	highlightActiveLine?: boolean;
	wrapEnabled?: boolean;
	setOptions?: any;
	className?: string;
	readOnly?: boolean;
	style?: React.CSSProperties;
	markers?: any;
	onChange?: (value: string) => void;
	name?: string;
	editorProps?: any;
	height?: string;
	width?: string;
	placeholder?: string;
	onBlur?: () => void;
	cursorStart?: any;
	focus?: boolean;
	counterStyles?: {
		top?: string;
		right?: string;
	};
}

export interface LimitedAceEditorCounterProps {
	top?: string;
	right?: string;
}