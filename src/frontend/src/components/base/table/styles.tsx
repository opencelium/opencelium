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
import {TableStyledProps} from './interfaces';

const TableStyled = styled.table<TableStyledProps>`
    width: 100%;
    & th, & td{
        text-align: center;
    }
    & td{
        border-top: 1px solid rgb(222, 226, 230);
    }
    & th{
        text-transform: capitalize;
        padding: 10px 0;
    }
    & thead{
        & > span{
            margin-right: 5px;
        }
        & tr{
            & th:first-child{
                padding-left: 15px;
                padding-right: 15px;
            }
            & th:last-child{
                padding: 0 15px;
            }
        }
    }
    & tbody{
        & tr{
            border-top: 1px solid #aaa;
            & td{
                padding: 10px 0;
            }
            & td:first-child{
                padding-left: 15px;
                padding-right: 15px;
            }
            & td:last-child{
                padding: 0 15px;
            }
        }
    }
    margin-bottom: ${({marginBottom}) => marginBottom || 0};
`;

export {
    TableStyled,
}