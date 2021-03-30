import React from 'react';
import MonitoringBoardsWidget from "@components/content/dashboard/view/widgets/MonitoringBoardsWidget";
import CurrentSchedulerWidget from "@components/content/dashboard/view/widgets/CurrentSchedulerWidget";
import ConnectionOverviewWidget from "@components/content/dashboard/view/widgets/ConnectionOverviewWidget";

export const HAS_DASHBOARD_WIDGET_ENGINE = true;

export const INITIAL_WIDGET_SETTINGS = [
    {icon: 'cable', tooltip: 'Connection Overview', i: 'CONNECTION_OVERVIEW', x: 0, y: 0, w: 6, h: 4, minW: 6, minH: 4},
    {icon: 'date_range', tooltip: 'Current Scheduler', i: 'CURRENT_SCHEDULER', x: 10, y: 0, w: 6, h: 3, minW: 6, minH: 3},
    {icon: 'analytics', tooltip: 'Monitoring Boards', i: 'MONITORING_BOARDS', x: 0, y: 0, w: 6, h: 4, minW: 6, minH: 4},
];

export const INITIAL_LAYOUT = [
    {icon: 'cable', tooltip: 'Connection Overview', i: 'CONNECTION_OVERVIEW', x: 0, y: 0, w: 6, h: 4, minW: 6, minH: 4},
    {icon: 'date_range', tooltip: 'Current Scheduler', i: 'CURRENT_SCHEDULER', x: 10, y: 0, w: 6, h: 3, minW: 6, minH: 3},
];

export const INITIAL_TOOLBOX = [
    {icon: 'analytics', tooltip: 'Monitoring Boards', i: 'MONITORING_BOARDS', x: 0, y: 0, w: 6, h: 4, minW: 6, minH: 4},
];

export const WIDGET_LIST = {
    MONITORING_BOARDS: <MonitoringBoardsWidget/>,
    CURRENT_SCHEDULER: <CurrentSchedulerWidget/>,
    CONNECTION_OVERVIEW: <ConnectionOverviewWidget/>,
}