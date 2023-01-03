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

import styled from "styled-components";
import {MenuStyledProps} from "./interfaces";

const MenuStyled = styled.div<MenuStyledProps>`
    position: fixed;
    top: 0;
    left: 0;
    width: ${({isFullScreen, isExpanded}) => isFullScreen ? '0' : isExpanded ? 'width: calc(95px + 9.25rem) !important;' : '95px'};
    padding: ${({isFullScreen}) => isFullScreen ? '0' : '1.5rem 1.5rem 2rem'};
    height: 100vh;
    background: ${({theme, background}) => background || theme.menu.background || '#012E55'};
    color: #eee;
    transition: .5s;
    z-index: 1001;
    ${({isPreview}) => isPreview ? `
        width: 96px;
        position: absolute;
        height: calc(100% - 20px);
        top: 10px;
        left: 10px;
        z-index: 0;
    ` : ''}
`;

const NavStyled = styled.nav`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
`;

const MenuTop = styled.div`
  a {
    display: grid;
    grid-template-columns: max-content max-content;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    column-gap: .75rem;
  }
  a:hover{
    text-decoration: none;
  }
`;

export {
    MenuStyled,
    NavStyled,
    MenuTop,
}