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
  height: ${(props) => (props.isButtonPanelOpened ? '150px' : '0')};
    width: ${(props) => (props.isButtonPanelOpened ? '150px' : '0')}; 

  button:not(#show_button_panel){
    display: ${(props) => (!props.isButtonPanelOpened && 'none')};
  }

  &::after{
    content: "Controls";
    position: absolute;
    left: 0;
    bottom: -15%;
    font-size: 14px;
    display: ${(props) => (!props.isButtonPanelOpened && 'none')};
  }
  
  .center_item{
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 222;
  }
  
  .wrapper {
    display: ${(props) => (!props.isButtonPanelOpened && 'none')};
    position: absolute;
    z-index: 1;
    left: calc(50% - 14px);
    top: 13px;
    height: 50%;
    transform-origin: 50% 100%;
  }
  .wrapper:nth-child(2) { transform: rotate(60deg); }
  .wrapper:nth-child(3) { transform: rotate(120deg); }
  .wrapper:nth-child(4) { transform: rotate(180deg); }
  .wrapper:nth-child(5) { transform: rotate(240deg); }
  .wrapper:nth-child(6) { transform: rotate(300deg); }
  
  .button_wrap {
    position: relative;
    display: inline-flex;
    flex-flow: column nowrap;
    justify-content: start;
    align-items: center;
    text-align: center;
    height: 28px; 
    width: 28px;
    transform-origin: 50% 30px;
  }
  .wrapper:nth-child(2) .button_wrap { transform: rotate(-60deg); }
  .wrapper:nth-child(3) .button_wrap { transform: rotate(-120deg); }
  .wrapper:nth-child(4) .button_wrap { transform: rotate(-180deg); }
  .wrapper:nth-child(5) .button_wrap { transform: rotate(-240deg); }
  .wrapper:nth-child(6) .button_wrap { transform: rotate(-300deg); }

  .additional_panel{
    position: absolute;
    z-index: 10000;
    background: #ffffffee;
    transform: translateY(-120%);
    display: flex;
    padding: 10px;
    gap: 10px;
    border-radius: 4px;
    &::after{
      content: '';
      position: absolute;
      z-index: -1;
      top: -5px;
      left: -5px;
      right: -5px;
      bottom: -5px;
      box-shadow: inset 0 0 0 3000px rgba(204, 203, 203, 0.3);
      filter: blur(10px);
    }
  }
  .additional_panel_save{
    transform: translateY(-120%);
  }
  .additional_panel_template{
    transform: translateY(80%);
  }
`;

export { ControlsBlockStyled };
