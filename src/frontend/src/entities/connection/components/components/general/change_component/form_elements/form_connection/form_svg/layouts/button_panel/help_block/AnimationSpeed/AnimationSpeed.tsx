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


const AnimationSpeedSlider: FC<AnimationSpeedSliderProps> = (props) => {

  const dispatch = useAppDispatch();

  const {animationSpeed} = Connection.getReduxState();

  const [animationSpeedLabel, setAnimationSpeedLabel] = useState('1x');
  
  const changAnimationSpeed = (speed: number) => {
    let data: any = {};
    switch(speed){
      case 1500:
        data.speed = 1000;
        data.label = '1x';
        break;
      case 1000:
        data.speed = 500;
        data.label = '1.5x';
        break;
      case 500:
        data.speed = 250;
        data.label = '2x';
        break;
      default:
        data.speed = 1500;
        data.label = '0.5x';
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
        />
      <div className="speed_label">{animationSpeedLabel}</div>
    </AnimationSpeedSliderStyled>
  );
};

export default  AnimationSpeedSlider;

