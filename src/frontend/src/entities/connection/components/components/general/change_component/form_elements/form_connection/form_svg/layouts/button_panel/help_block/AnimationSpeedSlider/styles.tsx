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
  margin-top: 3px;

  &::after{
    content: "1x 2x 3x 4x 5x 6x";
    position: absolute;
    top: 15px;
    left: 0;
    font-size: 11px;
    word-spacing: 7.6px;
  }
`;

export { AnimationSpeedSliderStyled };
