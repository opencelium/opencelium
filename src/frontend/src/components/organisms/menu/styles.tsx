/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import styled from "styled-components";

const MenuStyled = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 95px;
    height: 100vh;
    background: ${({theme}) => theme.menu.background || '#012E55'};
    color: #eee;
    padding: 1.5rem 1.5rem 2rem;
    transition: .5s;
    z-index: 1001;
    ${({isExpanded}:{isExpanded: boolean}) => isExpanded ? 'width: calc(95px + 9.25rem) !important;' : ''}
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