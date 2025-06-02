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

import { ITheme } from '@style/Theme';
import styled from 'styled-components';
import { LimitedAceEditorCounterProps } from './interfaces';

const LimitedAceEditorContainer = styled.div`
	position: relative;
`;

const LimitedAceEditorCounter = styled.div<LimitedAceEditorCounterProps>`
	position: absolute;
	top: ${({ top }) => top || '-20px'};
	right: ${({ right }) => right || '0'};
	font-size: 12px;
	color: ${({ theme }: { theme: ITheme }) =>
		theme ? theme?.input?.text?.color?.quite : '#888888'};
	z-index: 1;
`;

export { LimitedAceEditorContainer, LimitedAceEditorCounter };
