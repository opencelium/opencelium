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

import styled from 'styled-components';

export const PanelRoot = styled.div<{ $open: boolean }>`
	overflow-y: auto;
	position: fixed;
	top: 0;
	height: 100vh;
	width: 440px;
	background: #fff;
	border-left: 1px solid rgba(0, 0, 0, 0.12);
	z-index: 20000;
	box-shadow: 0 0 20px rgba(0, 0, 0, 0.08);
	display: flex;
	flex-direction: column;
	transition: all 0.3s;

	right: ${({ $open }) => ($open ? '0' : '-460px')};
	pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
`;

export const PanelHeader = styled.div`
	padding: 16px;
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

export const PanelTitle = styled.div`
	font-size: 18px;
	font-weight: 700;
`;

export const CloseBtn = styled.button`
	width: 32px;
	height: 32px;
	border-radius: 6px;
	border: 1px solid rgba(0, 0, 0, 0.12);
	background: #fff;
	cursor: pointer;
	font-size: 18px;
	line-height: 28px;
`;

export const PanelContent = styled.div`
	padding: 0 16px 16px 0;
	overflow: auto;
`;

export const LoadingRow = styled.div`
	padding: 8px 0;
`;

export const EmptyRow = styled.div`
	padding: 8px 0;
	color: rgba(0, 0, 0, 0.6);
`;

export const TimelineRoot = styled.div`
	position: relative;
`;

export const TimelineLine = styled.div`
	position: absolute;
	left: 55px;
	top: 0;
	bottom: 0;
	width: 2px;
	background: rgba(0, 0, 0, 0.12);
`;

export const DateRow = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	margin: 14px 0;
`;

export const DateSpacer = styled.div`
	width: 72px;
`;

export const DateInnerRow = styled.div`
	flex: 1;
	display: flex;
	align-items: center;
	gap: 10px;
`;

export const DateHr = styled.div`
	flex: 1;
	height: 1px;
	background: rgba(0, 0, 0, 0.12);
`;

export const DateLabel = styled.div`
	font-size: 14px;
	color: rgba(0, 0, 0, 0.65);
`;

export const ItemRow = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 12px;
	margin-bottom: 14px;
`;

export const TimeCol = styled.div`
	width: 72px;
	position: relative;
	flex-shrink: 0;
`;

export const TimeLabel = styled.div`
	position: absolute;
	left: 15px;
	top: 7px;
	width: 32px;
	text-align: right;
	font-size: 14px;
	color: rgba(0, 0, 0, 0.65);
`;

export const Dot = styled.div`
	position: absolute;
	left: 50px;
	top: 12px;
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: #e0e0e0;
	border: 1px solid rgba(0,0,0,0.12);
	box-sizing: border-box;
	z-index: 1;
`;

export const Card = styled.div<{ $width: number }>`
	width: ${({ $width }) => `${$width}px`};
	border: 1px solid rgba(0, 0, 0, 0.12);
	border-radius: 14px;
	background: #fff;
	padding: 12px;
	cursor: pointer;
	position: relative;
`;

export const CardHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	margin-bottom: 10px;
`;

export const AuthorText = styled.div`
	font-weight: 600;
	color: rgba(0, 0, 0, 0.82);
`;

export const DotsButton = styled.button`
	width: 28px;
	height: 28px;
	border-radius: 6px;
	border: 1px solid rgba(0, 0, 0, 0.12);
	background: #fff;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0;
`;

export const DotsIcon = styled.span`
	display: inline-flex;
	flex-direction: column;
	gap: 2px;
`;

export const DotSmall = styled.span`
	width: 3px;
	height: 3px;
	border-radius: 50%;
	background: rgba(0, 0, 0, 0.6);
`;

export const CommentArea = styled.div`
	position: relative;
`;

export const ExpandButtonContainer = styled.div`
	position: absolute;
	right: 16px;
	top: 6px;
	width: 26px;
	height: 26px;
	border-radius: 6px;
	border: 1px solid rgba(0, 0, 0, 0.12);
	background: #fff;
	cursor: pointer;
	z-index: 6;
	display: flex;
	align-items: center;
	justify-content: center;
`;

export const ExpandIcon = styled.span<{ $expanded: boolean }>`
	font-size: 14px;
	line-height: 1;
	transform: ${({ $expanded }) => ($expanded ? 'rotate(180deg)' : 'none')};
`;

export const CommentTextarea = styled.textarea<{
	$expanded: boolean;
	$expandedWidth: number;
	$shiftLeft: number;
}>`
	width: ${({ $expanded, $expandedWidth }) => $expanded ? `${$expandedWidth}px` : '100%'};
	float: ${({ $expanded }) => ($expanded ? 'right' : 'none')};
	
	min-height: ${({ $expanded }) => ($expanded ? '200px' : '84px')};
	max-height: ${({ $expanded }) => ($expanded ? '240px' : '140px')};
	overflow-y: hidden;

  &:focus {
    overflow-y: auto;
  }

	position: relative;
	z-index: ${({ $expanded }) => ($expanded ? 5 : 1)};

	resize: none;
	border: 2px solid rgba(0,0,0,0.12);
	border-radius: 0px;
	padding: 10px;
	padding-right: 45px;
	font-size: 14px;
	outline: none;
	box-sizing: border-box;
	background: #fff;
	color: rgba(0, 0, 0, 0.85);
	margin-bottom: 10px;
`;

export const SaveRow = styled.div`
	display: flex;
	justify-content: flex-end;
	clear: both;
`;

export const MenuRoot = styled.div`
	position: fixed;
	min-width: 190px;
	background: #fff;
	border: 1px solid rgba(0, 0, 0, 0.12);
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
	border-radius: 8px;
	z-index: 30000;
`;

export const MenuItem = styled.div<{ $isDisabled?: boolean }>`
	padding: 10px 12px;
	font-size: 13px;
	cursor: pointer;
	white-space: nowrap;

	pointer-events: ${({ $isDisabled }) => ($isDisabled ? 'none' : 'auto')};
	&:hover {
		background: rgba(0, 0, 0, 0.12);
	}
`;

export const MenuDivider = styled.div`
	height: 1px;
	background: rgba(0, 0, 0, 0.12);
`;
