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

  const changeHandler = (event: any) =>{
    dispatch(setAnimationSpeed(event.target.value));
  }

  return (
    <AnimationSpeedSliderStyled >
      <input type="range" {...props} value={animationSpeed} onChange={changeHandler}/>
    </AnimationSpeedSliderStyled>
  );
};

export default  AnimationSpeedSlider;

