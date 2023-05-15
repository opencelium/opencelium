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
import { withTheme } from "styled-components";

import { ContentItemProps } from "./interfaces";
import { ContentItemStyled } from "./styles";

import { useAppDispatch, useAppSelector } from "@application/utils/store";
import { setAnimationPreviewPanelVisibility, setVideoAnimationName } from "@entity/connection/redux_toolkit/slices/ConnectionSlice";

const ContentItem: FC<ContentItemProps> = (props) => {
  const { image, title } = props;

  const dispatch = useAppDispatch();

  const { videoAnimationName } = useAppSelector(
    (state) => state.connectionReducer
  ); 


  return (
    <ContentItemStyled onClick={() => (dispatch(setAnimationPreviewPanelVisibility(false)), dispatch(setVideoAnimationName(title)))}>
      <p>{title}</p>
      <img src={image} alt="" />
    </ContentItemStyled>
  );
};

export { ContentItem };

export default withTheme(ContentItem);
