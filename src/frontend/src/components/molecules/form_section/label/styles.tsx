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
import {LabelStyledProps} from "./interfaces";

const LabelStyled = styled.span<LabelStyledProps | HTMLSpanElement>`
    text-transform: uppercase;
    font-weight: 600;
    z-index: 100;
    transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
    padding: 15px;
    border-radius: 5px;
    background: ${({background}) => background || 'unset'};
    top: -30px;
    left: 20px;
    position: ${({position}) => position || 'inherit'};
    @media screen and (max-width: 950px) {
         margin-top: -80px;
         top: unset;
         left: unset;
    }
`;

export{
    LabelStyled,
}