import React from 'react';
import MonitoringBoardsWidget from "@components/content/dashboard/view/widgets/MonitoringBoardsWidget";
import CurrentSchedulerWidget from "@components/content/dashboard/view/widgets/CurrentSchedulerWidget";
import ConnectionOverviewWidget from "@components/content/dashboard/view/widgets/ConnectionOverviewWidget";

export const HAS_DASHBOARD_WIDGET_ENGINE = false;

export const INITIAL_LAYOUT = [
    {icon: 'analytics', tooltip: 'Monitoring Boards', i: 'MONITORING_BOARDS', x: 2, y: 0, w: 8, h: 5, minW: 8, minH: 5},
];

export const INITIAL_TOOLBOX = [
    {icon: 'date_range', tooltip: 'Current Scheduler', i: 'CURRENT_SCHEDULER', x: 10, y: 0, w: 6, h: 3, minW: 6, minH: 3},
    {icon: 'cable', tooltip: 'Connection Overview', i: 'CONNECTION_OVERVIEW', x: 0, y: 1, w: 3, h: 2, minW: 3, minH: 2},
];

export const WIDGET_LIST = {
    MONITORING_BOARDS: <MonitoringBoardsWidget/>,
    CURRENT_SCHEDULER: <CurrentSchedulerWidget/>,
    CONNECTION_OVERVIEW: <ConnectionOverviewWidget/>,
}