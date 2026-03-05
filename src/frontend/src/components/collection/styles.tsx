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
import {DropdownMenu, PaginationItem, PaginationLink} from "reactstrap";
import {DefaultTextSize} from "@entity/application/utils/constants";

const EmptyListStyled = styled.div`
    
`;

const TypesStyled = styled.span`
    display: flex;
    margin-bottom: 5px;
    cursor: pointer;
    padding: 2px;
    & :hover{
      background: #eee;
    }
    & > span{
        fontWeight: 600;
        margin: 0 10px;
    }
`;

const DropdownMenuStyled = styled(DropdownMenu)`
    min-width: 100px;
    top: -7px;
    left: -100px;
`;

const ListRowStyled = styled.tr`
    &:hover{
        background: #eee;
    }
`;

const PaginationItemStyled = styled(PaginationItem)`
    height: 30px;
    font-size: ${DefaultTextSize}px;
`;

const PaginationLinkStyled = styled(PaginationLink)`
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: ${DefaultTextSize}px;
`

export {
    EmptyListStyled,
    TypesStyled,
    DropdownMenuStyled,
    ListRowStyled,
    PaginationItemStyled,
    PaginationLinkStyled,
}
