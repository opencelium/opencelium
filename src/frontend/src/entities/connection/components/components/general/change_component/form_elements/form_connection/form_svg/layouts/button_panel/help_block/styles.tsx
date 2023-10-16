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

import { HTMLAttributes } from "react";
import styled from "styled-components";
import Text from "@app_component/base/text/Text";
import { HelpBlockStyledProps } from "./interfaces";

const HelpBlockStyled = styled.div<HelpBlockStyledProps>`
  display: ${(props) => (!props.isButtonPanelOpened ? "none" : "flex")};
  gap: 10px;
  position: relative;

  &::after {
    content: "Help";
    position: absolute;
    left: 0;
    bottom: -295%;
    font-size: 14px;
  }

`;
interface AnimationOverlayStyledProps{
    isVisible?: boolean,
    onMouseOverContainer?: boolean,
}
interface ActionContainerStyledProps{
    isVisible?: boolean,
    onMouseOverContainer?: boolean,
    isAnimationPaused?: boolean,
}
const AnimationOverlayStyled = styled.div<HTMLAttributes<HTMLDivElement> & AnimationOverlayStyledProps>`
  display: ${({isVisible}) => isVisible ? 'block' : 'none'};
  background: ${({onMouseOverContainer}) => onMouseOverContainer ? '#eee' : 'unset'};
  opacity: ${({onMouseOverContainer}) => onMouseOverContainer ? '0.9' : 'unset'};
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1054;
  justify-content: center;
  align-items: center;
  z-index: 100001;
  transition: all 0.3s;
`;
const PauseOverlayContainer = styled.div<HTMLAttributes<HTMLDivElement>>`
    display: flex;
    transition: all 0.3s;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    justify-content: center;
    align-items: center;
    border: 1px solid #ccc;
    background: #eee;
    cursor: pointer;
`;

const EditOverlayContainer = styled.div<HTMLAttributes<HTMLDivElement>>`
    display: flex;
    transition: all 0.3s;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    justify-content: center;
    align-items: center;
    border: 1px solid #ccc;
    background: #eee;
    cursor: pointer;
`;
const ActionContainer = styled.div<HTMLAttributes<HTMLDivElement> & ActionContainerStyledProps>`
    width: ${({isAnimationPaused}) => isAnimationPaused ? '420px' : '200px'};
    gap: 10px;
    height: 200px;
    display: ${({isVisible}) => isVisible ? 'flex' : 'none'};
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin: 10% auto 0;
    opacity: ${({onMouseOverContainer}) => onMouseOverContainer ? '1' : '0'};
    z-index: 100002;
`;
const LabelContainer = styled(Text)`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin: 10% auto 0;
    z-index: 100002;
    text-align: center;
`;
export {
    HelpBlockStyled, AnimationOverlayStyled,
    PauseOverlayContainer, EditOverlayContainer,
    ActionContainer, LabelContainer,
};
