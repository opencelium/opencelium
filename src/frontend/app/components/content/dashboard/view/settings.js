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