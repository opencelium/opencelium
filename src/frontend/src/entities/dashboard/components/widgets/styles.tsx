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
import WidgetTitle from "../widget_title/WidgetTitle";
import {DefaultCardShadowStyles} from "@entity/application/utils/constants";

const CurrentSchedulesWidgetStyled = styled.div`
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
    height: 100%;
    padding: 1vw 1vw 0.5vw;
    background-color: #fff;
    ${DefaultCardShadowStyles}
`;

const ConnectionOverviewWidgetStyled = styled.div`
    height: 100%;
    position: relative;
    :first-child:first-child:focus{
        outline: none !important;
    }
    ${DefaultCardShadowStyles}
`;

const ConnectionOverviewTitle = styled(WidgetTitle)`
    position: absolute;
    margin: 15px;
`;

const MonitoringBoardsWidgetStyled = styled.div`
    padding: 1vw 1vw 0.5vw;
    background-color: #fff;
    ${DefaultCardShadowStyles}
    height: calc(100% - 55px);
    max-width: 100%;
    &>iframe{
        border: none;
        width: 100%;
        height: calc(100% - 50px) !important;
    }
`;

const SubscriptionOverviewWidgetStyled = styled.div`
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
    height: 100%;
    width: 100%;
    padding: 1vw 1.5vw 0.5vw 1vw;
    background-color: #fff;
    ${DefaultCardShadowStyles}
`;

export {
    CurrentSchedulesWidgetStyled,
    ConnectionOverviewWidgetStyled,
    ConnectionOverviewTitle,
    MonitoringBoardsWidgetStyled,
    SubscriptionOverviewWidgetStyled,
}
