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

import Button from "@basic_components/buttons/Button";
import styled from "styled-components";
import {TooltipButton} from "@molecule/tooltip_button/TooltipButton";

const ExpertButtonStyled = styled(Button)`
    margin: 0 110px 0 0;
    padding: 15px 10px;
    width: 100px;
    justify-content: center;
`;

const TemplateButtonStyled = styled(Button)`
    padding: 15px 10px;
    width: 100px;
    justify-content: center;
`;

const DeleteTemplateButtonStyled = styled(TooltipButton)`    
    position: absolute;
    top: 27px;
    right: -25px;
`;

export {
    ExpertButtonStyled,
    TemplateButtonStyled,
    DeleteTemplateButtonStyled,
}