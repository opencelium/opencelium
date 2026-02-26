import React from 'react';
import {Step} from "react-joyride";

export const EmptyScheduleListSteps: Step[] = [
    {
        title: 'Schedules',
        content:
            'Schedules determine when specific connections are executed, either on a defined timetable or based on triggers.',
        target: '#schedule-list-empty-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Add Schedule',
        content:
            'Press Add Schedule to create a new schedule.',
        target: '#schedule-list-add',
        placement: 'bottom',
        disableBeacon: true,
    },
];
export const ScheduleListSteps: Step[] = [
    {
        title: 'Schedules',
        content:
            'Schedules determine when specific connections are executed, either on a defined timetable or based on triggers.',
        target: '#schedule-list-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Add Schedule',
        content:
            'Press Add Schedule to create a new schedule.',
        target: '#schedule-list-add',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Notification',
        content:
            'You can create a notification for selected schedules pressing here.',
        target: '#schedule-list-notification',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Delete Schedules',
        content:
            'Select schedules that you want to delete and press here to do an action.',
        target: '#schedule-list-delete-selected',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Search',
        content:
            'Type here to search for a schedule by title.',
        target: '#collection-search-input',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Status',
        content:
            'Indicates the current execution status of the schedule, showing whether it is active - green, inactive - gray, or in an error state - red.',
        target: '#collection-column-header-status',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Connection',
        content:
            'Displays the connection that is executed by this schedule. You can navigate to the Connection Update form pressing on it.',
        target: '#collection-column-header-connection-title',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Cron',
        content:
            'Shows the cron expression that defines when the schedule is triggered.',
        target: '#collection-column-header-cronExp',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Last Success',
        content:
            'Displays the date and time of the most recent successful execution. Also, it provides the executions logs if they are on.',
        target: '#collection-column-header-lastSuccessExecution',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Last Fail',
        content:
            'Displays the date, time, and execution attempt of the most recent failed run. Also, it provides the executions logs if they are on.',
        target: '#collection-column-header-lastFailExecution',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Last Duration',
        content:
            'Shows the execution time of the most recent successful run.',
        target: '#collection-column-header-lastDuration',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Logs',
        content:
            'Provides switcher to on and off the execution logs for this schedule.',
        target: '#collection-column-header-debugMode',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Webhook',
        content:
            'Indicates whether a webhook trigger exists for this schedule.',
        target: '#collection-column-header-webhook',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Update',
        content:
            'Update the connection configuration.',
        target: '[id^="update_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Start',
        content:
            'Trigger this schedule now.',
        target: '[id^="start_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Webhook',
        content:
            'Create or delete the webhook.',
        target: '[id^="webhook_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Notifications',
        content:
            'Here you can create notifications for this schedules.',
        target: '[id^="schedule_notifications_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Support Logs',
        content:
            'If you have any problem with this schedule, press here to generate support logs. After finish you will be notified that support files are generated and are available in Admin Panel.',
        target: '[id^="get_logs_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Delete',
        content:
            'Permanently remove the connection and assigned schedules from the system. This action cannot be undone.',
        target: '[id^="delete_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
]

