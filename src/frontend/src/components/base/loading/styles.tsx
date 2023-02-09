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
import Icon from "../icon/Icon";
import Loading from "./Loading";

const LoadingStyled = styled(Icon)`
    margin: 0 auto;
    margin-top: ${({top}) => top || 0};
`;

const GridImageLoadingStyled = styled(Loading)`
    transform: translate(-57%,32%);
`;

const LayoutLoadingStyled = styled(Loading)`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
`;

const ContentLoadingStyled = styled(Loading)`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
`;

export {
    LoadingStyled,
    LayoutLoadingStyled,
    ContentLoadingStyled,
    GridImageLoadingStyled,
}