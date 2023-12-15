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

import React, { FC, useState } from "react";

import { AnimationSpeedSliderProps } from "./interfaces";
import { AnimationSpeedSliderStyled } from "./styles";
import { Connection } from "@entity/connection/classes/Connection";
import { useAppDispatch } from "@application/utils/store";
import { setAnimationSpeed } from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import { ColorTheme } from "@style/Theme";
import TooltipButton from "@app_component/base/tooltip_button/TooltipButton";
import AnimationFunctionSteps from "../classes/AnimationFunctionSteps";
import {ModalConnection} from "@root/classes/ModalConnection";


const AnimationSpeedSlider: FC<AnimationSpeedSliderProps> = (props) => {

  const dispatch = useAppDispatch();

  const {animationSpeed} = Connection.getReduxState();

  const [animationSpeedLabel, setAnimationSpeedLabel] = useState('1x');
  const { isEditableAnimation } = ModalConnection.getReduxState();

  const isEditableAnimationReference: any = React.useRef();
  isEditableAnimationReference.current = isEditableAnimation;
  const changAnimationSpeed = (speed: number) => {
    let data: any = {};
    const speed_05x = AnimationFunctionSteps.DefaultSpeed * 2;
    const speed_1x = AnimationFunctionSteps.DefaultSpeed;
    const speed_15x = AnimationFunctionSteps.DefaultSpeed * 3/4;
    const speed_2x = AnimationFunctionSteps.DefaultSpeed / 2;
    switch(speed){
      case speed_2x:
        data.speed = speed_05x;
        data.label = '0.5x';
        break;
      case speed_05x:
        data.speed = speed_1x;
        data.label = '1x';
        break;
      case speed_1x:
        data.speed = speed_15x;
        data.label = '1.5x';
        break;
      case speed_15x:
        data.speed = speed_2x;
        data.label = '2x';
        break;
    }

    dispatch(setAnimationSpeed(data.speed));
    setAnimationSpeedLabel(data.label);
  }

  return (
    <AnimationSpeedSliderStyled >
      <TooltipButton
          position={"bottom"}
          icon={"speed"}
          tooltip={"Animation Speed"}
          target={`animation_speed`}
          hasBackground={true}
          background={ColorTheme.White}
          color={ColorTheme.Blue}
          padding="2px"
          handleClick={() => changAnimationSpeed(animationSpeed)}
          isDisabled={isEditableAnimationReference.current}
        />
      <div className="speed_label">{animationSpeedLabel}</div>
    </AnimationSpeedSliderStyled>
  );
};

export default  AnimationSpeedSlider;

