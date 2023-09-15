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
import { AnimationSpeedSliderStyledProps } from "./interfaces";

const AnimationSpeedSliderStyled = styled.div<AnimationSpeedSliderStyledProps>`
  position: relative;
  width: 100%;
  input{
    position: absolute;
    transform: rotate(90deg);
    top: 54px;
    left: -49px;
  }

  .speed_steps{
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    position: absolute;
    font-size: 12px;
    top: 0;
    left: -26px;
    gap: 9px;
  }
`;

export { AnimationSpeedSliderStyled };
