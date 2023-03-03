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

import React from 'react';
import styled from "styled-components";
import {
    CreatePanelRightContainerAppearance,
    CreatePanelRightOperatorAppearance,
    CreatePanelRightProcessAppearance,
    CreatePanelBottomContainerAppearance,
    CreatePanelBottomOperatorAppearance,
    CreatePanelBottomProcessAppearance,
} from "@style/animations";

export const CreatePanelStyled = styled.rect<React.ComponentProps<"rect"> & {isBottom?: boolean, isRight?: boolean}>`
    opacity: 0.3;
    cursor: default;
    fill: transparent;
    width: ${({isBottom}) => isBottom ? '80px' : '60px'};
    height: 70px;
    ${({isBottom}) => isBottom ? CreatePanelBottomContainerAppearance : ''}
    ${({isRight}) => isRight ? CreatePanelRightContainerAppearance : ''}
`;

export const CreateProcessStyled = styled.rect<React.ComponentProps<"rect"> & {isBottom?: boolean, isRight?: boolean}>`
    cursor: pointer;
    rx: 2;
    ry: 2;
    width: 30px;
    height: 15px;
    fill: transparent;
    stroke: #000;
    &:hover{
        fill: #fff;
    }
    ${({isBottom}) => isBottom ? CreatePanelBottomProcessAppearance : ''}
    ${({isRight}) => isRight ? CreatePanelRightProcessAppearance : ''}
`;

export const CreateOperatorContainerStyled = styled.g<React.ComponentProps<"g"> & {isBottom?: boolean, isRight?: boolean}>`
    ${({isBottom}) => isBottom ? CreatePanelBottomOperatorAppearance : ''}
    ${({isRight}) => isRight ? CreatePanelRightOperatorAppearance : ''}
`;

export const CreateOperatorStyled = styled.polygon`
    cursor: pointer;
    fill: transparent;
    stroke: #000;
    &:hover{
        fill: #fff;
    }
`;