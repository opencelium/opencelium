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

import React, { FC } from "react";

import { AnimationSpeedSliderProps } from "./interfaces";
import { AnimationSpeedSliderStyled } from "./styles";
import { Connection } from "@entity/connection/classes/Connection";
import { useAppDispatch } from "@application/utils/store";
import { setAnimationSpeed } from "@entity/connection/redux_toolkit/slices/ConnectionSlice";


const AnimationSpeedSlider: FC<AnimationSpeedSliderProps> = (props) => {

  const dispatch = useAppDispatch();

  const {animationSpeed} = Connection.getReduxState();

  const changeHandler = (event: any) => {
    let speed;
    switch(event.target.value){
      case "-2":
        speed = 4000; break;
      case "-1":
        speed = 2000; break;
      case "0":
        speed = 1000; break;
      case "1":
        speed = 500; break;
      case "2":
        speed = 250; break;
    }
    dispatch(setAnimationSpeed(speed));
  }

  const setValue = (data: any) => {
    let speed;
    switch(data){
      case 250: 
        speed = 2; break;
      case 500: 
        speed = 1; break;
      case 1000:
        speed = 0; break;
      case 2000: 
        speed = -1; break;
      case 4000:
        speed = -2; break;
    }
    return speed;
  }

  return (
    <AnimationSpeedSliderStyled >
      <input type="range" {...props} value={setValue(animationSpeed)} onChange={changeHandler}/>
      <div className="speed_steps">
        <span>0.25x</span>
        <span>0.5x</span>
        <span>1x</span>
        <span>2x</span>
        <span>4x</span>
      </div>
    </AnimationSpeedSliderStyled>
  );
};

export default  AnimationSpeedSlider;

