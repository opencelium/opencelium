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
import {ScheduleDataAppearance} from "@style/animations";
import {LastSuccessExecutionStyledProps} from "./interfaces";
import Icon from "@app_component/base/icon/Icon";

const LastSuccessExecutionStyled = styled.div<LastSuccessExecutionStyledProps>`
    ${({isRefreshing}) => isRefreshing ? ScheduleDataAppearance : ''}
`;

const LoadingIcon = styled(Icon)`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 18px;
`
export {
    LastSuccessExecutionStyled,
    LoadingIcon,
}
