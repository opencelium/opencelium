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
import { TooltipButton } from "@app_component/base/tooltip_button/TooltipButton";
import { TextSize } from "@app_component/base/text/interfaces";
import { ColorTheme } from "@style/Theme";

import { ContentProps } from "./interfaces";
import { ContentStyled } from "./styles";

import ContentBlock from "./content_block/ContentBlock";
import ContentItem from "./content_item/ContentItem";

import {
  basicsContentData,
  expertsContentData,
  advancedContentData,
} from "./data";
import { useAppDispatch, useAppSelector } from "@application/utils/store";
import { setAnimationPreviewPanelVisibility } from "@entity/connection/redux_toolkit/slices/ConnectionSlice";

const Content: FC<ContentProps> = () => {
  const dispatch = useAppDispatch();

  const { isAnimationPreviewPanelOpened } = useAppSelector(
    (state) => state.connectionReducer
  );

  return (
    <ContentStyled isPreviewPanelOpened={isAnimationPreviewPanelOpened}>
      <ContentBlock label="basics">
        {basicsContentData.map((item: any, index: number) => (
          <ContentItem key={index} {...item} />
        ))}
      </ContentBlock>
      <div className="content_divider"/>
      <ContentBlock label="experts">
        {expertsContentData.map((item, index) => (
          <ContentItem key={index} {...item} />
        ))}
      </ContentBlock>
      <div className="content_divider"/>
      <ContentBlock label="advanced functions">
        {advancedContentData.map((item, index) => (
          <ContentItem key={index} {...item} />
        ))}
      </ContentBlock>

      <TooltipButton
        className="toggle_preview_button"
        size={TextSize.Size_40}
        position={"bottom"}
        icon={isAnimationPreviewPanelOpened ? "expand_more" : "expand_less"}
        tooltip={isAnimationPreviewPanelOpened ? "Hide" : "Show"}
        target={"toggle_animation_preview"}
        hasBackground={true}
        background={isAnimationPreviewPanelOpened ? ColorTheme.White : ColorTheme.Blue}
        color={isAnimationPreviewPanelOpened ? ColorTheme.Gray : ColorTheme.White}
        padding="2px"
        handleClick={() =>
          dispatch(
            setAnimationPreviewPanelVisibility(!isAnimationPreviewPanelOpened)
          )
        }
      />
    </ContentStyled>
  );
};

Content.defaultProps = {};

export { Content };
export default withTheme(Content);
