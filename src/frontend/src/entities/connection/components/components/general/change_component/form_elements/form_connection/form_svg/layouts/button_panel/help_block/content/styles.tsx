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
import { ContentStyledProps } from "./interfaces";

const ContentStyled = styled.div<ContentStyledProps>`
  background: #f2f2f2;
  border-radius: 10px;
  padding: 40px;
  width: 100%;
  position: absolute;
  z-index: 100001;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  align-items: flex-end;

  ${props => !props.isPreviewPanelOpened && `
    padding: 0;

    & > div{
      display: none;
    }
  `}

  .toggle_preview_button{
    position: absolute;
    top: ${props => !props.isPreviewPanelOpened ? '-35px' : 0};
    right: auto;
    left: 50%;
    transform: translateX(-50%);
    z-index: 333;
    width: 30px;
  }

  .content_divider{
    margin: 0 40px;
    width: 2px;
    background: #d2d2d3;
    height: 384px;

    @media (max-width: 1600px) {
      margin: 0 15px;
    }
  }

  @media (max-width: 1600px) {
    padding: 15px;
  }
`;

export { ContentStyled };
