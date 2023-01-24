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

const ColorRowStyled = styled.div`
    display: flex;
    justify-content: space-between;
    margin: 0 8px 20px;
`;

const PreviewStyled = styled.div`
    border: 1px solid #eee;
    padding: 0 10px 0 115px;
    border-radius: 10px;
    position: relative;
`;

const HeaderStyled = styled.div`
    margin: 10px;
`;
const NameStyled = styled.div`
    text-align: center;
    margin-bottom: 10px;
`;

const ActionsStyled = styled.div`
    display: flex;
    justify-content: flex-end;
`;

export {
    ColorRowStyled,
    PreviewStyled,
    HeaderStyled,
    NameStyled,
    ActionsStyled,
}