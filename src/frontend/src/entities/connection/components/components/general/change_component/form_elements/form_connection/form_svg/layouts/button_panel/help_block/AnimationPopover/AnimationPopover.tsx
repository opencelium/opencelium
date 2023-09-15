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

import { AnimationPopoverProps } from "./interfaces";
import { AnimationPopoverStyled } from "./styles";
import { Popover, PopoverBody } from "reactstrap";


const AnimationPopover: FC<AnimationPopoverProps> = (props) => {

  const {target, isOpen, position, text} = props;

  if(!target) return null;

  return (
    <AnimationPopoverStyled>
      <Popover
        placement={position ? position : 'auto'}
        flip
        target={target}
        isOpen={isOpen}
      >
        <PopoverBody>
          {text}
        </PopoverBody>
      </Popover>
    </AnimationPopoverStyled>
  );
};

export default  AnimationPopover;

