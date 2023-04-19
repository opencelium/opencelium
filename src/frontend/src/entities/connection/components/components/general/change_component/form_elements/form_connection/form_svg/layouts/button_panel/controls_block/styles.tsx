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
import { ControlsBlockStyledProps } from "./interfaces";

const ControlsBlockStyled = styled.div<ControlsBlockStyledProps>`
  display: flex;
  gap: 10px;
  position: relative;

  button:not(#show_button_panel){
    display: ${(props) => (!props.isButtonPanelOpened && 'none')}
  }

  &::after{
    content: "Controls";
    position: absolute;
    left: 0;
    bottom: -150%;
    font-size: 14px;
    display: ${(props) => (!props.isButtonPanelOpened && 'none')}
  }
`;

export { ControlsBlockStyled };
