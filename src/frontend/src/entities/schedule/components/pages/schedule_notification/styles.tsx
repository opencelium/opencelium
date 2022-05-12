/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import styled from "styled-components";
import {Text} from "@app_component/base/text/Text";
import {NotificationListAppearance} from "@style/animations";
import {ScheduleNotificationListStyledProps} from "./interfaces";

const ScheduleNotificationListStyled = styled.div<ScheduleNotificationListStyledProps>`
    ${NotificationListAppearance}
    width: 300px;
    height: auto;
    position: absolute;
    left: ${({x}) => x || 0}px;
    top: ${({y}) => y || 0}px;
    background: white;
    border: 1px solid #eee;
    border-radius: 2px;
`;

const ListStyled = styled.div`
    padding: 5px;
    overflow-x: hidden;
    overflow-y: auto;
    max-height: 198px;
`;

const BottomActionsStyled = styled.div`
    border-top: 1px solid #eee;
    margin: 0 3px;
`;

const EmptyListStyled = styled(Text)`
`;

export {
    ListStyled,
    ScheduleNotificationListStyled,
    BottomActionsStyled,
    EmptyListStyled,
}