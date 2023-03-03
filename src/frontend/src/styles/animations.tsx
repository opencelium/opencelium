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

import {css, keyframes} from "styled-components";

export const KeyframeSelectedCard = keyframes`
  from {
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
  }
  to {
    background-color: #ffffff;
    box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.12), 1px 3px 15px rgba(0, 0, 0, 0.24);
  }
`;

const KeyframeScaleAppear = keyframes`
  from {
    transform: scale(0) translate3d(100%, -100%, 0);
    opacity: 0;
  }
  to {
    transform: scale(1) translate3d(0, 0, 0);
    opacity: 1;
  }
`;

const KeyframeAppearance = keyframes`
  from {
    opacity: 0;
  }
  to {
    transform: 1;
  }
`;

const KeyframeScheduleDataAppearance = keyframes`
  0 {
    background: #fff;
  }
  50% {
    background: #7aced2;
  }
  100% {
    background: #fff;
  }
`;

const KeyframeGridImageRefreshing = keyframes`
    from{
        margin-top: -5px;
        opacity: 0;
    }
    to{
        margin-top: 0;
        opacity: 1
    }
`;

const KeyframeSlideTop = keyframes`
    0% {
    }
    
    100% {
        top: 22px;
        opacity: 0;
    }
`;

const KeyframeCreatePanelRightContainerAppearance = keyframes`
    0% {
        x: -60;
    }
    
    100% {
        x: 0;
    }
`;

const KeyframeCreatePanelRightProcessAppearance = keyframes`
    0% {
        transform: translate(-20px, 0px);
    }
    
    100% {
        transform: translate(9px, 0px);
    }
`;

const KeyframeCreatePanelRightOperatorAppearance = keyframes`
    0% {
        transform: translate(-20px, 42.5px);
    }
    
    100% {
        transform: translate(14px, 42.5px);
    }
`;

const KeyframeCreatePanelBottomContainerAppearance = keyframes`
    0% {
        y: -60;
    }
    
    100% {
        y: 0;
    }
`;

const KeyframeCreatePanelBottomProcessAppearance = keyframes`
    0% {
        transform: translate(0px, -20px);
    }
    
    100% {
        transform: translate(0px, 5px);
    }
`;

const KeyframeCreatePanelBottomOperatorAppearance = keyframes`
    0% {
        transform: translate(42.5px, -20px);
    }
    
    100% {
        transform: translate(42.5px, 30px);
    }
`;

const KeyframeGridImageShow = keyframes`
    0% {
        opacity: 0;
        margin-top: -20px;
    }
    
    100% {
        margin-top: 0;
        opacity: 1;
    }
`;

export const SlideToTop = css`
    animation-delay: 2.5s;
    animation-name: ${KeyframeSlideTop};
    animation-duration: 0.5s;
    animation-timing-function: ease-in-out;
    animation-fill-mode: forwards;
`

export const CreatePanelRightContainerAppearance = css`
    animation-name: ${KeyframeCreatePanelRightContainerAppearance};
    animation-duration: 0.3s;
    animation-timing-function: ease-in-out;
    animation-fill-mode: forwards;
`

export const CreatePanelRightProcessAppearance = css`
    animation-name: ${KeyframeCreatePanelRightProcessAppearance};
    animation-duration: 0.3s;
    animation-timing-function: ease-in-out;
    animation-fill-mode: forwards;
`

export const CreatePanelRightOperatorAppearance = css`
    animation-name: ${KeyframeCreatePanelRightOperatorAppearance};
    animation-duration: 0.3s;
    animation-timing-function: ease-in-out;
    animation-fill-mode: forwards;
`

export const CreatePanelBottomContainerAppearance = css`
    animation-name: ${KeyframeCreatePanelBottomContainerAppearance};
    animation-duration: 0.3s;
    animation-timing-function: ease-in-out;
    animation-fill-mode: forwards;
`

export const CreatePanelBottomProcessAppearance = css`
    animation-name: ${KeyframeCreatePanelBottomProcessAppearance};
    animation-duration: 0.3s;
    animation-timing-function: ease-in-out;
    animation-fill-mode: forwards;
`

export const CreatePanelBottomOperatorAppearance = css`
    animation-name: ${KeyframeCreatePanelBottomOperatorAppearance};
    animation-duration: 0.3s;
    animation-timing-function: ease-in-out;
    animation-fill-mode: forwards;
`
export const Appearance = css`
    animation: ${KeyframeAppearance} 0.5s linear;
    animation-fill-mode: forwards;
`;
export const ScheduleDataAppearance = css`
    animation: ${KeyframeScheduleDataAppearance} 0.5s linear;
    animation-fill-mode: forwards;
`;

export const SelectedCard = css`
  animation-name: ${KeyframeSelectedCard};
  animation-duration: 0.4s;
  animation-fill-mode: forwards;
  animation-timing-function:ease-in;
`;

export const NotificationListAppearance = css`
  animation-name: ${KeyframeScaleAppear};
  animation-duration: 0.3s;
  animation-fill-mode: forwards;
`;

export const GridImageAppearance = css`
  animation-name: ${KeyframeGridImageShow};
  animation-duration: 0.2s;
  animation-fill-mode: forwards;
`;

export const GridImageRefreshing = css`
  animation-name: ${KeyframeGridImageRefreshing};
  animation-duration: 0.3s;
  animation-fill-mode: forwards;
`;