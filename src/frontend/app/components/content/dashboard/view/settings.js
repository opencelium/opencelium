/*
 * Copyright (C) <2021>  <becon GmbH>
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

import React from 'react';
import MonitoringBoardsWidget from "@components/content/dashboard/view/widgets/MonitoringBoardsWidget";
import CurrentSchedulerWidget from "@components/content/dashboard/view/widgets/CurrentSchedulerWidget";
import ConnectionOverviewWidget from "@components/content/dashboard/view/widgets/ConnectionOverviewWidget";

export const HAS_DASHBOARD_WIDGET_ENGINE = true;


export const WIDGET_LIST = {
    MONITORING_BOARDS: <MonitoringBoardsWidget/>,
    CURRENT_SCHEDULER: <CurrentSchedulerWidget/>,
    CONNECTION_OVERVIEW: <ConnectionOverviewWidget/>,
}