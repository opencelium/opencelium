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

const GraphiQLEditorStyled = styled.div`
    height: calc(100% - 80px);
    margin-top: 10px;
    width: 100%;
`;

const ShortcutStyled = styled.span`
    border: 1px solid #aaa;
    border-radius: 0.2em;
    box-shadow: 0.1em 0.1em 0.2em rgba(0,0,0,0.1);
    background-color: #f9f9f9;
    background-image: linear-gradient(to bottom,#eee,#f9f9f9,#eee);
    color: #000;
    padding: 0.1em 0.3em;
`;

export {
    GraphiQLEditorStyled,
    ShortcutStyled
}
