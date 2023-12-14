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
import { ContentBlockStyledProps } from "./interfaces";

const ContentBlockStyled = styled.div<ContentBlockStyledProps>`
  padding: 15px 0 50px;
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: 15px;
  position: relative;

  &::after {
    content: "${(props) => props.label}";
    text-transform: capitalize;
    color: #000;
    font-weight: bold;
    position: absolute;
    bottom: 15px;
  }
`;

export { ContentBlockStyled };
