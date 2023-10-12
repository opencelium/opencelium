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

import React, { FC, useEffect } from "react";
import { withTheme } from "styled-components";

import { ContentItemProps } from "./interfaces";
import { ContentItemStyled } from "./styles";

import { useAppDispatch } from "@application/utils/store";
import { setAnimationPreviewPanelVisibility, setVideoAnimationName, setIsAnimationNotFound, setIsAnimationForcedToStop } from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import animationData from "../../AnimationData";
import {Connection} from "@root/classes/Connection";

const ContentItem: FC<ContentItemProps> = (props) => {
  const { animationImage, animationTitle, animationName } = props;
    const { isAnimationForcedToStop, videoAnimationName } = Connection.getReduxState();

  const dispatch = useAppDispatch();

  useEffect(() => {
      if(isAnimationForcedToStop && videoAnimationName === animationName){
          setTimeout(() => {
              dispatch(setIsAnimationForcedToStop(false));
          }, 2000);
      }
  }, [isAnimationForcedToStop]);

  return (
    <ContentItemStyled onClick={() => {
      if(!animationData[animationName]){
        dispatch(setIsAnimationNotFound(true))
      }
      else{
        dispatch(setIsAnimationForcedToStop(true));
        dispatch(setAnimationPreviewPanelVisibility(false));
        dispatch(setVideoAnimationName(animationName));
      }
    }}>
      <p>{animationTitle}</p>
      <img src={animationImage} alt={animationTitle} />
    </ContentItemStyled>
  );
};

export { ContentItem };

export default withTheme(ContentItem);
