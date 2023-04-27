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

import { ContentProps, ContentData } from "./interfaces";
import { ContentStyled } from "./styles";


import ContentBlock from "./content_block/ContentBlock";
import ContentItem from "./content_item/ContentItem";

import {
  basicsContentData,
  expertsContentData,
  advancedContentData,
} from "./data";

const Content: FC<ContentProps> = () => {
  return (
    <ContentStyled>
      <ContentBlock label="basics">
        {basicsContentData.map((item, index) => {
          return <ContentItem key={index} {...item} />;
        })}
      </ContentBlock>
      <div
        style={{
          margin: "0 40px",
          width: "2px",
          background: "#d2d2d3",
          height: "384px",
        }}
      />
      <ContentBlock label="experts">
        {expertsContentData.map((item, index) => {
          return <ContentItem key={index} {...item} />;
        })}
      </ContentBlock>
      <div
        style={{
          margin: "0 40px",
          width: "2px",
          background: "#d2d2d3",
          height: "384px",
        }}
      />
      <ContentBlock label="advanced functions">
        {advancedContentData.map((item, index) => {
          return <ContentItem key={index} {...item} />;
        })}
      </ContentBlock>
    </ContentStyled>
  );
};

Content.defaultProps = {};

export default Content;
