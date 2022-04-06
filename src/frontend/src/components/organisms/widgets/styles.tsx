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

const CurrentSchedulesWidgetStyled = styled.div`
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
    height: 100%;
    padding: 1vw 1vw 0.5vw;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    transition: all 0.3s cubic-bezier(.25,.8,.25,1);
`;

const ConnectionOverviewWidgetStyled = styled.div`
    height: 100%;
    position: relative;
    &:first-child:first-child:focus{
        outline: none !important;
    }
    background: white;
    padding: 1vw 1vw 0.5vw;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    transition: all 0.3s cubic-bezier(.25,.8,.25,1);
`;

const MonitoringBoardsWidgetStyled = styled.div`
    padding: 1vw 1vw 0.5vw;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    transition: all 0.3s cubic-bezier(.25,.8,.25,1);
    height: calc(100% - 55px);
    max-width: 100%;
    &>iframe{
        border: none;
        width: 100%;
        height: calc(100% - 50px) !important;
    }
`;

export {
    CurrentSchedulesWidgetStyled,
    ConnectionOverviewWidgetStyled,
    MonitoringBoardsWidgetStyled,
}