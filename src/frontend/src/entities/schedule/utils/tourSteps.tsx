import React from 'react';
import {Step} from "react-joyride";
import {Link} from "react-router-dom";

export const Spot = ({color}: {color: string}) => (<div style={{
    width: '14px',
    height: '14px',
    background: color,
    borderRadius: '50%',
    fontSize: '12px',
    display: 'inline-block',
    marginRight: '5px',
}}/>)
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
            <span>
                Indicates the current execution status of the schedule, showing whether it is:
            <ul style={{marginLeft: 20, marginTop: 10}}>
                    <li style={{listStyleType: 'none'}}>
                       <Spot color={'#c3f5c3'}/> Green — active
                    </li>
                    <li style={{listStyleType: 'none'}}>
                        <Spot color={'#cccccc'}/> Gray — inactive
                    </li>
                    <li style={{listStyleType: 'none'}}>
                        <Spot color={'#f5c3c3'}/> Red — error
                    </li>
                </ul>
        </span>,
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
            'Update the schedule configuration.',
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
        <span>
            If you have any problem with this schedule, press here to generate support logs. After finish you will be notified that support files are generated and are available <Link to={'/support_files'} target={'_blank'}>here</Link>.
        </span>
            ,
        target: '[id^="get_logs_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Delete',
        content:
            <p>
                <p>Permanently remove the schedules from the system.</p><p><strong>This action
                cannot be undone!</strong></p>
            </p>,
        target: '[id^="delete_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
]


export const ScheduleFormSteps: Step[] = [
    {
        title: 'General Data',
        content:
            'This form is used to create a schedule that automatically executes a selected connection based on a defined time configuration in cron expression field.',
        target: '#schedule-form-general-data',
        placement: 'right',
        disableBeacon: true,
    },
]

export const ScheduleInputLogs: Step[] = [{
    title: 'Enable or disable logging for this schedule',
    content: `When enabled, execution details will be stored and available for review.`,
    target: '',
    placement: 'right',
    disableBeacon: true,
    hideCloseButton: true,
    hideFooter: true,
}]

export const ScheduleSupportLogsSteps: Step[] = [
    {
        title: 'Create Support-Logs',
        content:
            <span>
                <span>
                    This form allows you to create a support log file while controlling how sensitive data is masked.
                    Masking ensures that confidential information is hidden in logs for security and compliance purposes.
                </span>
                <span>Once the creation is complete, the support file will be available for download in <Link to={'/support_files'} target={'_blank'}>{"Support Files"}</Link>.</span>
            </span>,
        target: '#schedule-support-log-header',
        placement: 'right',
        disableBeacon: true,
    },
]


export const NotificationTemplateInputSteps: Step[] = [{
    title: 'Template',
    content: <span>
            <span>
                Select a notification template that defines the message content.
                Templates can be created and managed in <Link to={'/notification_templates'} target={'_blank'}>{"Notification Templates"}</Link>.
            </span>
        </span>,
    target: '',
    placement: 'bottom',
    disableBeacon: true,
    hideCloseButton: true,
    hideFooter: true,
    data: {
        styles: {
            spotlight: {
                marginTop: 90,
                transition: 'none',
            }
        }
    }
}]
export const NotificationTemplateEventTypeSteps: Step[] = [{
    title: 'Event Type',
    content: <span>
            Defines when the notification is triggered:
            <ul style={{marginLeft: '20px'}}>
                <li>Pre — before the schedule execution starts</li>
                <li>Post — after the schedule execution completes</li>
                <li>Alert — when an error or exceptional event occurs</li>
            </ul>
        </span>,
    target: '',
    placement: 'bottom',
    disableBeacon: true,
    hideCloseButton: true,
    hideFooter: true,
    data: {
        styles: {
            spotlight: {
                marginTop: 90,
                transition: 'none',
            }
        }
    }
}]
