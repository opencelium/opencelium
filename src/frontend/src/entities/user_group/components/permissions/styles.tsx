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
import {PermissionsStyledProps} from "./interfaces";

const PermissionsStyled = styled.table<PermissionsStyledProps>`
    ${({hasLabel}) => hasLabel ? 'margin-top: 18px;' : ''}
    width: 100%;
    & th, & td{
        text-align: center;
    }
    & th{
        text-transform: capitalize;
    }
    & thead{
        & span{
            margin-right: 5px;
        }
    }
    & tbody{
        & tr{
            border-top: 1px solid rgb(222, 226, 230);
            & td{
                padding: 10px 0;
            }
        }
        & tr:hover{
            background: #eee;
        }
    }
    padding-left: ${({paddingLeft}) => paddingLeft || 0};
    padding-right: ${({paddingRight}) => paddingRight || 0};
    width: ${({width, isIconInside, hasIcon, theme}) => width || isIconInside || !hasIcon ? '100%' : `calc(100% - ${theme.input.iconInputDistance})`};
    margin-left: ${({hasIcon, isIconInside, theme}) => !hasIcon || isIconInside ? 0 : theme.input.iconInputDistance};
`

export {
    PermissionsStyled,
}